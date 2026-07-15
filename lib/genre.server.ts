import { createAdminClient } from "@/lib/supabase/admin";
import { computeTopGenre } from "./genre-map";

/**
 * Recompute a user's top genre from their full song-post history (song posts
 * only — album posts are excluded) and update profiles.top_genre. Safe to
 * call on every post write — always derives from source of truth rather than
 * trusting a cached counter, so it self-heals like recomputeUserStreak.
 */
export async function recomputeUserGenre(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: posts, error } = await admin
    .from("posts")
    .select("songs ( genre )")
    .eq("user_id", userId);

  if (error) {
    console.error("[genre] Failed to fetch posts:", error.message);
    return;
  }

  const rawGenres = (posts ?? []).map(
    (p) => (p as unknown as { songs: { genre: string | null } | null }).songs?.genre ?? null
  );
  const topGenre = computeTopGenre(rawGenres);

  const { error: updateError } = await admin
    .from("profiles")
    .update({ top_genre: topGenre })
    .eq("id", userId);

  if (updateError) {
    console.error("[genre] Failed to update top_genre:", updateError.message);
  }
}
