"use client";

import { useState, useRef, useCallback } from "react";
import { type AlbumResult } from "@/app/api/itunes/album-search/route";
import { AlbumCard } from "@/app/_components/album-card";

export function AlbumSearchInput({
  onSelect,
  selectedAlbum,
}: {
  onSelect: (album: AlbumResult | null) => void;
  selectedAlbum: AlbumResult | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlbumResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/itunes/album-search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (selectedAlbum) onSelect(null);
    search(val);
  }

  function handleSelect(album: AlbumResult) {
    onSelect(album);
    setQuery(album.title);
    setResults([]);
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-700">
        Search for an album
      </label>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Album name..."
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
      />
      {loading && <p className="text-xs text-zinc-400">Searching...</p>}
      {results.length > 0 && !selectedAlbum && (
        <div className="space-y-1.5">
          {results.map((album) => (
            <AlbumCard key={album.collection_id} album={album} onSelect={() => handleSelect(album)} />
          ))}
        </div>
      )}
      {selectedAlbum && <AlbumCard album={selectedAlbum} selected />}
    </div>
  );
}
