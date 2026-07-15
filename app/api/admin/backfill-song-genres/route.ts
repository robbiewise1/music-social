import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Vercel Hobby's max serverless function duration. At ~3.2s/song this caps
// one invocation at ~15 songs — re-trigger the route to process the rest.
export const maxDuration = 60;
const BATCH_SIZE = 15;

// One-time backfill: hit GET /api/admin/backfill-song-genres?secret=<CRON_SECRET>
// to fill in `genre` on existing songs (from before the genre column existed).
// Must be run BEFORE /api/admin/backfill-user-genres, since that route derives
// each user's top genre from songs.genre.
//
// Throttled to ~1 request per 3.2s to stay under iTunes' informal ~20 req/min
// rate limit. Safe to re-run — only processes rows still missing genre, so a
// large backfill can be re-triggered across multiple invocations if a single
// run doesn't finish in time.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: songs, error } = await admin
    .from("songs")
    .select("id, spotify_id")
    .is("genre", null)
    .limit(BATCH_SIZE);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let updated = 0;
  let failed = 0;

  for (const song of songs ?? []) {
    try {
      const res = await fetch(
        `https://itunes.apple.com/lookup?id=${encodeURIComponent(song.spotify_id)}`
      );
      const data = res.ok ? await res.json() : null;
      const genre: string = data?.results?.[0]?.primaryGenreName ?? "unknown";

      const { error: updateError } = await admin
        .from("songs")
        .update({ genre })
        .eq("id", song.id);

      if (updateError) {
        failed++;
      } else {
        updated++;
      }
    } catch {
      failed++;
    }

    // Throttle to stay well under iTunes' informal rate limit.
    await new Promise((resolve) => setTimeout(resolve, 3200));
  }

  const { count: remaining } = await admin
    .from("songs")
    .select("id", { count: "exact", head: true })
    .is("genre", null);

  return NextResponse.json({
    processed: songs?.length ?? 0,
    updated,
    failed,
    remaining: remaining ?? 0,
  });
}
