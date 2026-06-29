import type { NextRequest } from "next/server";

export type AlbumResult = {
  collection_id: string;
  title: string;
  artist: string;
  album_art_url: string | null;
  apple_music_url: string;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return Response.json({ results: [] });

  const res = await fetch(
    `https://itunes.apple.com/search?media=music&entity=album&limit=25&term=${encodeURIComponent(q)}`
  );

  if (!res.ok)
    return Response.json({ error: "Album search failed" }, { status: 502 });

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: AlbumResult[] = data.results.map((a: any) => ({
    collection_id: String(a.collectionId),
    title: a.collectionName,
    artist: a.artistName,
    album_art_url: a.artworkUrl100
      ? a.artworkUrl100.replace("100x100bb", "600x600bb")
      : null,
    apple_music_url: a.collectionViewUrl,
  }));

  const lq = q.toLowerCase();
  results.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const rank = (t: string) =>
      t === lq ? 0 : t.startsWith(lq) ? 1 : t.includes(lq) ? 2 : 3;
    return rank(aTitle) - rank(bTitle);
  });

  return Response.json({ results: results.slice(0, 10) });
}
