import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recomputeUserStreak } from "@/lib/streaks.server";

// One-time backfill: hit GET /api/admin/backfill-streaks?secret=<CRON_SECRET>
// to compute streaks for all users who have ever posted.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: users, error } = await admin
    .from("posts")
    .select("user_id")
    .order("user_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const uniqueUserIds = [...new Set((users ?? []).map((r) => r.user_id))];

  const results: { userId: string; status: string }[] = [];
  for (const userId of uniqueUserIds) {
    try {
      await recomputeUserStreak(userId);
      results.push({ userId, status: "ok" });
    } catch (e) {
      results.push({ userId, status: String(e) });
    }
  }

  return NextResponse.json({ backfilled: results.length, results });
}
