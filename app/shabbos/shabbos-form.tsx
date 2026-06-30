"use client";

import { useState } from "react";
import { SongSearchInput } from "@/app/_components/song-search-input";
import { type SongResult } from "@/app/api/spotify/search/route";
import { scheduleShabbosPost, cancelShabbosPost } from "@/app/actions/shabbos";

type Props = {
  targetDate: string; // 'YYYY-MM-DD'
  initialSong: SongResult | null;
  initialCaption: string;
  hasPending: boolean;
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function ShabbosForm({
  targetDate,
  initialSong,
  initialCaption,
  hasPending,
}: Props) {
  const [selectedSong, setSelectedSong] = useState<SongResult | null>(
    initialSong
  );
  const [caption, setCaption] = useState(initialCaption);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSong) return;
    setSubmitting(true);
    setError(null);
    const result = await scheduleShabbosPost(selectedSong, caption);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    const result = await cancelShabbosPost(targetDate);
    if (result?.error) {
      setError(result.error);
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3">
        <p className="text-xs text-zinc-400 mb-0.5">Auto-posts on</p>
        <p className="text-sm font-medium text-zinc-900">
          {formatDate(targetDate)} · noon Eastern
        </p>
      </div>

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
          {submitting
            ? "Saving…"
            : hasPending
            ? "Update scheduled song"
            : "Schedule for Shabbos"}
        </button>
      </form>

      {hasPending && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {cancelling ? "Cancelling…" : "Cancel scheduled post"}
        </button>
      )}
    </div>
  );
}
