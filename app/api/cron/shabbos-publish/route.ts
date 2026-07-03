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

  // Attach auto-published posts to today's Song of the Day prompt, if it's
  // been seeded. Unlike Album of the Week, there's no daily auto-seed cron
  // for song_of_the_day yet, so this can legitimately be missing — fall back
  // to an unattached post (old behavior) rather than skip publishing, since
  // keeping the user's streak alive is the whole point of Shabbos Mode.
  const { data: sotdPrompt, error: promptError } = await admin
    .from("prompts")
    .select("id")
    .eq("active_date", today)
    .eq("prompt_type", "song_of_the_day")
    .maybeSingle();

  if (promptError) {
    console.error("[shabbos-publish] Failed to fetch today's Song of the Day prompt:", promptError.message);
  }

  let published = 0;
  let skipped = 0;

  await Promise.all(
    pending.map(async (item) => {
      let hasPostToday: boolean;

      if (sotdPrompt) {
        const { data: existingSotdPost } = await admin
          .from("posts")
          .select("id")
          .eq("user_id", item.user_id)
          .eq("prompt_id", sotdPrompt.id)
          .maybeSingle();
        hasPostToday = !!existingSotdPost;
      } else {
        // No Song of the Day prompt for today — fall back to "posted
        // anything today" (30h window covers the full Eastern day regardless
        // of DST; JS date filter is authoritative) so we don't double-post.
        const since = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
        const { data: recentPosts } = await admin
          .from("posts")
          .select("created_at")
          .eq("user_id", item.user_id)
          .gte("created_at", since);

        hasPostToday = (recentPosts ?? []).some(
          (p) =>
            new Date(p.created_at).toLocaleDateString("en-CA", {
              timeZone: "America/Toronto",
            }) === today
        );
      }

      if (!hasPostToday) {
        const note = "*Automated with Shabbos Mode";
        const caption = item.caption ? `${item.caption}\n\n${note}` : note;

        const { error: insertError } = await admin.from("posts").insert({
          user_id: item.user_id,
          song_id: item.song_id,
          caption,
          prompt_id: sotdPrompt?.id ?? null,
        });

        if (insertError) {
          console.error(
            `[shabbos-publish] Failed to create post for user ${item.user_id}:`,
            insertError.message
          );
          return; // leave status 'pending' so the 17:00 UTC cron can retry
        }

        await recomputeUserStreak(item.user_id);
        published++;

        // Mark as published only when we actually created the post
        const { error: statusError } = await admin
          .from("scheduled_posts")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", item.id);

        if (statusError) {
          console.error(
            `[shabbos-publish] Failed to mark ${item.id} as published:`,
            statusError.message
          );
          // Post was created — streak is intact. Second cron run will retry the status update.
        }
      } else {
        // User already posted today; mark 'cancelled' so the page can distinguish
        // "we auto-posted" (published) from "user already had it covered" (cancelled).
        skipped++;

        const { error: statusError } = await admin
          .from("scheduled_posts")
          .update({ status: "cancelled", published_at: new Date().toISOString() })
          .eq("id", item.id);

        if (statusError) {
          console.error(
            `[shabbos-publish] Failed to mark ${item.id} as cancelled:`,
            statusError.message
          );
        }
      }
    })
  );

  return NextResponse.json({ published, skipped });
}
