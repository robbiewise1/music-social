"use client";

import { useState, useRef, useEffect } from "react";
import { fetchAlbumReplies, addAlbumReply, type AlbumReply } from "@/app/actions/album-replies";

export function AlbumReplyButton({
  albumPostId,
  initialCount,
}: {
  albumPostId: string;
  initialCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<AlbumReply[] | null>(null);
  const [count, setCount] = useState(initialCount);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || replies !== null) return;
    fetchAlbumReplies(albumPostId).then((result) => {
      if (!("error" in result)) setReplies(result);
    });
  }, [open, albumPostId, replies]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    const body = text.trim();
    setSubmitError(null);
    setSubmitting(true);
    const result = await addAlbumReply(albumPostId, body);
    if (result?.error) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }
    setText("");
    const updated = await fetchAlbumReplies(albumPostId);
    if (!("error" in updated)) {
      setReplies(updated);
      setCount(updated.length);
    }
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close replies" : "Reply"}
        className={`flex items-center gap-1.5 transition-colors ${
          open ? "text-zinc-600" : "text-zinc-400 hover:text-zinc-600"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {count > 0 && <span className="text-xs text-zinc-400">{count}</span>}
      </button>

      {open && (
        <div className="space-y-2">
          {replies === null ? (
            <p className="text-xs text-zinc-400">Loading…</p>
          ) : replies.length === 0 ? (
            <p className="text-xs text-zinc-400">No replies yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {replies.map((r) => (
                <li key={r.id} className="text-xs text-zinc-600">
                  <span className="font-medium text-zinc-800">
                    {r.profiles?.display_name ?? r.profiles?.username ?? "Someone"}
                  </span>{" "}
                  {r.body}
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 150))}
              placeholder="Write a reply…"
              className="flex-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 transition-opacity"
            >
              {submitting ? "…" : "Send"}
            </button>
          </form>
          {submitError && <p className="text-xs text-rose-500">{submitError}</p>}
        </div>
      )}
    </div>
  );
}
