"use client";

import { useEffect, useRef, useState } from "react";
import type { SongResult } from "@/app/api/spotify/search/route";
import { SongCard } from "./song-card";

type Props = {
  onSelect: (song: SongResult) => void;
  selectedSong?: SongResult | null;
};

export function SongSearchInput({ onSelect, selectedSong }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SongResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(song: SongResult) {
    onSelect(song);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {selectedSong ? (
        <div className="rounded-lg border border-zinc-200 p-1">
          <SongCard song={selectedSong} selected />
          <button
            type="button"
            onClick={() => {
              onSelect(null as unknown as SongResult);
              setQuery("");
            }}
            className="mt-1 w-full rounded px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors text-left"
          >
            Change song
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a song…"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          {loading && (
            <p className="absolute right-3 top-2.5 text-xs text-zinc-400">
              Searching…
            </p>
          )}
          {open && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg">
              {results.map((song) => (
                <SongCard
                  key={song.track_id}
                  song={song}
                  onClick={() => handleSelect(song)}
                />
              ))}
            </div>
          )}
          {open && !loading && results.length === 0 && query.trim() && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-400 shadow-lg">
              No results found.
            </div>
          )}
        </>
      )}
    </div>
  );
}
