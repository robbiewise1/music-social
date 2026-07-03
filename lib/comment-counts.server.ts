import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Non-deleted comment counts for a batch of posts/album posts, keyed by
 * post id. Excludes soft-deleted comments so the feed badge doesn't count
 * rows the user can no longer actually see.
 */
export async function fetchCommentCounts(
  targetType: "post" | "album_post",
  ids: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;

  const admin = createAdminClient();
  const column = targetType === "post" ? "post_id" : "album_post_id";

  const { data, error } = await admin.from("comments").select(column).in(column, ids).is("deleted_at", null);

  if (error) {
    console.error("[comment-counts] Failed to fetch counts:", error.message);
    return map;
  }

  for (const row of (data ?? []) as Record<string, string>[]) {
    const key = row[column];
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}
