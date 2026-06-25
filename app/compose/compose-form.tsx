"use client";

import { useState } from "react";
import { SongSearchInput } from "@/app/_components/song-search-input";
import { type SongResult } from "@/app/api/spotify/search/route";
import { createPost } from "@/app/actions/posts";

type Prompt = { id: string; title: string; description: string | null; prompt_type: string } | null;

export function ComposeForm({ todayPrompt }: { todayPrompt: Prompt }) {
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSong) return;
    setSubmitting(true);
    setError(null);
    const result = await createPost(selectedSong, caption, todayPrompt?.id);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {todayPrompt && (
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3">
          <p className="text-xs text-zinc-400 mb-0.5">
            {todayPrompt.prompt_type === "song_of_the_day" ? "Song of the Day" : "Today's prompt"}
          </p>
          <p className="text-sm font-medium text-zinc-900">{todayPrompt.title}</p>
          {todayPrompt.description && (
            <p className="text-xs text-zinc-500 mt-0.5">{todayPrompt.description}</p>
          )}
        </div>
      )}

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
  );
}
