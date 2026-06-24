import type { NextRequest } from "next/server";

export type SongResult = {
  track_id: string;
  title: string;
  artist: string;
  album: string;
  album_art_url: string | null;
  track_url: string;
  preview_url: string | null;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  if (!q) return Response.json({ results: [] });

  const res = await fetch(
    `https://itunes.apple.com/search?media=music&entity=song&limit=10&term=${encodeURIComponent(q)}`
  );

  if (!res.ok)
    return Response.json({ error: "Music search failed" }, { status: 502 });

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: SongResult[] = data.results.map((track: any) => ({
    track_id: String(track.trackId),
    title: track.trackName,
    artist: track.artistName,
    album: track.collectionName,
    album_art_url: track.artworkUrl100
      ? track.artworkUrl100.replace("100x100", "300x300")
      : null,
    track_url: track.trackViewUrl,
    preview_url: track.previewUrl ?? null,
  }));

  return Response.json({ results });
}
