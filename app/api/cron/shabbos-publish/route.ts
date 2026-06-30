import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recomputeUserStreak } from "@/lib/streaks.server";

export async function GET(req: NextRequest) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
  });

  // All pending scheduled posts whose target date is today (Eastern)
  const { data: pending, error: fetchError } = await admin
    .from("scheduled_posts")
    .select("id, user_id, song_id, caption, target_date")
    .eq("target_date", today)
    .eq("status", "pending");

  if (fetchError) {
    console.error("[shabbos-publish] Failed to fetch scheduled posts:", fetchError.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!pending?.length) {
    return NextResponse.json({ published: 0, skipped: 0 });
  }

  let published = 0;
  let skipped = 0;

  await Promise.all(
    pending.map(async (item) => {
      // Check if the user already has any post for today (Eastern) — within last 30h to be safe
      const since = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
      const { data: recentPosts } = await admin
        .from("posts")
        .select("created_at")
        .eq("user_id", item.user_id)
        .gte("created_at", since);

      const hasPostToday = (recentPosts ?? []).some(
        (p) =>
          new Date(p.created_at).toLocaleDateString("en-CA", {
            timeZone: "America/Toronto",
          }) === today
      );

      if (!hasPostToday) {
        // Create the post as a regular free-form post
        const { error: insertError } = await admin.from("posts").insert({
          user_id: item.user_id,
          song_id: item.song_id,
          caption: item.caption,
          prompt_id: null,
        });

        if (insertError) {
          console.error(
            `[shabbos-publish] Failed to create post for user ${item.user_id}:`,
            insertError.message
          );
          return; // leave status as 'pending' so we can retry
        }

        await recomputeUserStreak(item.user_id);
        published++;
      } else {
        skipped++;
      }

      // Mark as published whether we created the post or the user already posted —
      // either way the streak is intact and there's nothing left to do.
      await admin
        .from("scheduled_posts")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", item.id);
    })
  );

  return NextResponse.json({ published, skipped });
}
