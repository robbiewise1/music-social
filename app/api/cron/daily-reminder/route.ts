import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import webpush from "web-push";

export async function GET(req: NextRequest) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id");

  if (!subscriptions?.length) return NextResponse.json({ sent: 0 });

  const { data: todayPosts } = await admin
    .from("posts")
    .select("user_id, prompts!inner(active_date)")
    .eq("prompts.active_date", today);
  const postedUserIds = new Set((todayPosts ?? []).map((p) => p.user_id));
  const targets = subscriptions.filter((s) => !postedUserIds.has(s.user_id));

  const payload = JSON.stringify({
    title: "Music Club",
    body: "Check out today's prompt!",
    url: "/feed",
  });

  let sent = 0;
  const stale: string[] = [];

  await Promise.all(
    targets.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) stale.push(sub.endpoint);
      }
    })
  );

  if (stale.length) {
    await admin.from("push_subscriptions").delete().in("endpoint", stale);
  }

  return NextResponse.json({ sent, stale: stale.length });
}
