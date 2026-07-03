import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Streaks are only recomputed when a user posts (see lib/streaks.server.ts),
// so a user who goes quiet never gets their own current_streak zeroed out —
// nothing writes to their row again until they post. This cron sweeps daily
// and zeroes any streak whose last post wasn't today or yesterday (Eastern).
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
  const [ty, tm, td] = today.split("-").map(Number);
  const yesterday = new Date(Date.UTC(ty, tm - 1, td - 1)).toISOString().slice(0, 10);

  const { data, error } = await admin
    .from("streaks")
    .update({ current_streak: 0, updated_at: new Date().toISOString() })
    .gt("current_streak", 0)
    .lt("last_post_date", yesterday)
    .select("user_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reset: data?.length ?? 0 });
}
