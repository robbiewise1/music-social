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
      <div className="rounded-lg bg-[var(--color-surface-tint)] border border-[var(--color-accent)]/18 px-4 py-3">
        <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Auto-posts on</p>
        <p className="text-sm font-medium text-[var(--color-text)]">
          {formatDate(targetDate)} · noon Eastern
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SongSearchInput onSelect={setSelectedSong} selectedSong={selectedSong} />

        <div>
          <label
            htmlFor="caption"
            className="block text-sm font-medium text-[var(--color-text)] mb-1.5"
          >
            Caption{" "}
            <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Why this song?"
            className="w-full rounded-lg border border-[var(--color-accent)]/18 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
          <p className="mt-1 text-right text-xs text-[var(--color-text-muted)]">
            {caption.length}/280
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!selectedSong || submitting}
          className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
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
          className="w-full rounded-lg border border-[var(--color-accent)]/18 px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {cancelling ? "Cancelling…" : "Cancel scheduled post"}
        </button>
      )}
    </div>
  );
}
