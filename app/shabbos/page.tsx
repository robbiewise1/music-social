import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { SongResult } from "@/app/api/spotify/search/route";
import { nextSaturday } from "@/app/actions/shabbos";
import { ShabbosForm } from "./shabbos-form";

export default async function ShabbosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
  });
  const targetDate = nextSaturday(today);

  const { data: scheduled } = await admin
    .from("scheduled_posts")
    .select(
      "target_date, caption, status, songs(spotify_id, title, artist, album, album_art_url, spotify_url, preview_url)"
    )
    .eq("user_id", user.id)
    .eq("target_date", targetDate)
    .maybeSingle();

  const hasPending = scheduled?.status === "pending";
  const alreadyPublished = scheduled?.status === "published";

  // Map stored song row → SongResult shape for pre-filling the form
  let initialSong: SongResult | null = null;
  if (hasPending && scheduled?.songs) {
    const s = Array.isArray(scheduled.songs)
      ? scheduled.songs[0]
      : scheduled.songs;
    initialSong = {
      track_id: s.spotify_id,
      title: s.title,
      artist: s.artist,
      album: s.album ?? "",
      album_art_url: s.album_art_url ?? null,
      track_url: s.spotify_url ?? "",
      preview_url: s.preview_url ?? null,
    };
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Shabbos Mode</h1>
      <p className="text-sm text-zinc-400 mb-8">
        Pick a song on Friday and we&apos;ll post it at noon Eastern on
        Saturday — so your streak stays alive while you&apos;re offline.
      </p>

      {alreadyPublished ? (
        <div className="rounded-xl border border-zinc-100 bg-white p-6 text-center space-y-2">
          <p className="text-2xl">✓</p>
          <p className="text-sm font-medium text-zinc-900">
            Your Shabbos song was posted Saturday at noon.
          </p>
          <p className="text-xs text-zinc-400">
            You can find it in your profile and edit it there.
          </p>
        </div>
      ) : (
        <ShabbosForm
          targetDate={targetDate}
          initialSong={initialSong}
          initialCaption={scheduled?.caption ?? ""}
          hasPending={hasPending}
        />
      )}
    </main>
  );
}
