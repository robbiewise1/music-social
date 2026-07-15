import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recomputeUserGenre } from "@/lib/genre.server";

// One-time backfill: hit GET /api/admin/backfill-user-genres?secret=<CRON_SECRET>
// to compute top_genre for all users who have ever posted a song.
//
// Run this AFTER /api/admin/backfill-song-genres has finished (remaining: 0),
// since this route derives each user's top genre from songs.genre. Safe to
// re-run any time — recomputeUserGenre always derives from source of truth.
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
      await recomputeUserGenre(userId);
      results.push({ userId, status: "ok" });
    } catch (e) {
      results.push({ userId, status: String(e) });
    }
  }

  return NextResponse.json({ backfilled: results.length, results });
}
