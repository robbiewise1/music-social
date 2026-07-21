import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import webpush from "web-push";

// One-time announcement cron — only sends on 2026-07-22 (Eastern).
// Safe to leave in place; it's a no-op on any other date.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayEastern = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
  });
  if (todayEastern !== "2026-07-22") {
    return NextResponse.json({ skipped: true, date: todayEastern });
  }

  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (!subscriptions?.length) return NextResponse.json({ sent: 0 });

  const payload = JSON.stringify({
    title: "Music Club",
    body: "It is alphabet time... Check out today's prompt!",
    url: "/feed",
  });

  let sent = 0;
  const stale: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
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
