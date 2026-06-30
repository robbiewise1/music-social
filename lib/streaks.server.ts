import { createAdminClient } from "@/lib/supabase/admin";
import { computeStreak } from "./streaks";

/**
 * Recompute a user's streak from their full post history and upsert into the
 * streaks table. Safe to call on every post write — always derives from source
 * of truth rather than trusting a counter, so it self-heals if a job fails.
 */
export async function recomputeUserStreak(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: posts, error } = await admin
    .from("posts")
    .select("created_at")
    .eq("user_id", userId);

  if (error) {
    console.error("[streaks] Failed to fetch posts:", error.message);
    return;
  }

  const { currentStreak, longestStreak, lastPostDate } = computeStreak(
    (posts ?? []).map((p) => p.created_at)
  );

  const { error: upsertError } = await admin.from("streaks").upsert(
    {
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_post_date: lastPostDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    console.error("[streaks] Failed to upsert streak:", upsertError.message);
  }
}
