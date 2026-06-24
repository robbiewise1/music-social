"use client";

import { useState } from "react";
import { SongSearchInput } from "@/app/_components/song-search-input";
import { type SongResult } from "@/app/api/spotify/search/route";
import { createPost } from "@/app/actions/posts";

export default function ComposePage() {
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSong) return;
    setSubmitting(true);
    setError(null);
    const result = await createPost(selectedSong, caption);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">New post</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <SongSearchInput onSelect={setSelectedSong} selectedSong={selectedSong} />

        <div>
          <label
            htmlFor="caption"
            className="block text-sm font-medium text-zinc-700 mb-1.5"
          >
            Caption{" "}
            <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Why this song?"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
          />
          <p className="mt-1 text-right text-xs text-zinc-400">
            {caption.length}/280
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!selectedSong || submitting}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </form>
    </main>
  );
}
