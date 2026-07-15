import { createClient, getAuthUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { SongResult } from "@/app/api/spotify/search/route";
import { nextSaturday } from "@/lib/dates";
import { ShabbosForm } from "./shabbos-form";

export default async function ShabbosPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
  });
  const [ty, tm, td] = today.split("-").map(Number);
  const isSaturday = new Date(Date.UTC(ty, tm - 1, td)).getUTCDay() === 6;
  const upcomingSaturday = nextSaturday(today);

  // On Saturday, also query today so we can show the confirmation for a post
  // that was auto-published earlier today. nextSaturday(saturday) returns +7,
  // so without this the confirmation block would never render on the day it matters.
  const datesToQuery = isSaturday ? [today, upcomingSaturday] : [upcomingSaturday];

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("scheduled_posts")
    .select(
      "target_date, caption, status, songs(spotify_id, title, artist, album, album_art_url, spotify_url, preview_url, genre)"
    )
    .eq("user_id", user.id)
    .in("target_date", datesToQuery);

  // Today's row (only relevant on Saturday) tells us what the cron did.
  const todayRow = isSaturday ? rows?.find((r) => r.target_date === today) : null;
  // Next Saturday's row drives the scheduling form.
  const nextRow = rows?.find((r) => r.target_date === upcomingSaturday) ?? null;

  const alreadyPublished = todayRow?.status === "published";
  const hasPending = nextRow?.status === "pending";

  let initialSong: SongResult | null = null;
  if (hasPending && nextRow?.songs) {
    const s = Array.isArray(nextRow.songs) ? nextRow.songs[0] : nextRow.songs;
    initialSong = {
      track_id: s.spotify_id,
      title: s.title,
      artist: s.artist,
      album: s.album ?? "",
      album_art_url: s.album_art_url ?? null,
      track_url: s.spotify_url ?? "",
      preview_url: s.preview_url ?? null,
      genre: s.genre ?? null,
    };
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Shabbos Mode</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-8">
        Pick a song on Friday and we&apos;ll post it to the Song of the Day
        feed at noon Eastern on Saturday — so your streak stays alive while
        you&apos;re offline.
      </p>

      {alreadyPublished ? (
        <div className="rounded-xl border border-[var(--color-accent)]/12 bg-[var(--color-surface)] p-6 text-center space-y-2">
          <p className="text-2xl">✓</p>
          <p className="text-sm font-medium text-[var(--color-text)]">
            Your Shabbos song was posted today at noon.
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            You can find it in your profile and edit it there.
          </p>
        </div>
      ) : (
        <ShabbosForm
          targetDate={upcomingSaturday}
          initialSong={initialSong}
          initialCaption={nextRow?.caption ?? ""}
          hasPending={hasPending}
        />
      )}
    </main>
  );
}
