"use client";

import { useState } from "react";
import { SongSearchInput } from "@/app/_components/song-search-input";
import { type SongResult } from "@/app/api/spotify/search/route";

export default function ComposePage() {
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">New post</h1>
      <SongSearchInput onSelect={setSelectedSong} selectedSong={selectedSong} />
    </main>
  );
}
