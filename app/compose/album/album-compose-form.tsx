"use client";

import { useState } from "react";
import { AlbumSearchInput } from "@/app/_components/album-search-input";
import { type AlbumResult } from "@/app/api/itunes/album-search/route";
import { createAlbumPost } from "@/app/actions/album-posts";

type Prompt = { id: string; title: string; description: string | null } | null;

export function AlbumComposeForm({ thisWeekPrompt }: { thisWeekPrompt: Prompt }) {
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumResult | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAlbum) return;
    setSubmitting(true);
    setError(null);
    const result = await createAlbumPost(selectedAlbum, caption, thisWeekPrompt?.id);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {thisWeekPrompt && (
        <div className="rounded-lg bg-[var(--color-surface-tint)] border border-[var(--color-accent)]/18 px-4 py-3">
          <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Album of the Week</p>
          <p className="text-sm font-medium text-[var(--color-text)]">{thisWeekPrompt.title}</p>
          {thisWeekPrompt.description && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{thisWeekPrompt.description}</p>
          )}
        </div>
      )}

      <AlbumSearchInput onSelect={setSelectedAlbum} selectedAlbum={selectedAlbum} />

      <div>
        <label htmlFor="caption" className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
          Caption <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
        </label>
        <textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Why this album?"
          className="w-full rounded-lg border border-[var(--color-accent)]/18 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
        />
        <p className="mt-1 text-right text-xs text-[var(--color-text-muted)]">{caption.length}/280</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!selectedAlbum || submitting}
        className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Posting…" : "Post"}
      </button>
    </form>
  );
}
