"use client";

import { useState, useRef, useEffect } from "react";
import { toggleAlbumLike } from "@/app/actions/album-likes";

function formatLikers(likers: string[]): string {
  if (likers.length === 1) return likers[0];
  if (likers.length === 2) return `${likers[0]} and ${likers[1]}`;
  if (likers.length === 3) return `${likers[0]}, ${likers[1]} and ${likers[2]}`;
  return `${likers[0]}, ${likers[1]} and ${likers.length - 2} others`;
}

export function AlbumLikeButton({
  albumPostId,
  initialLiked,
  initialCount,
  initialLikers = [],
}: {
  albumPostId: string;
  initialLiked: boolean;
  initialCount: number;
  initialLikers?: string[];
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showLikers) return;
    function handleOutsideClick(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowLikers(false);
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [showLikers]);

  async function handleLike() {
    if (pending) return;
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setPending(true);
    const result = await toggleAlbumLike(albumPostId, prevLiked);
    setPending(false);
    if (result?.error) {
      setLiked(prevLiked);
      setCount(prevCount);
    }
  }

  return (
    <div ref={containerRef} className="inline-flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleLike}
          aria-label={liked ? "Unlike" : "Like"}
          className={`flex items-center transition-colors ${
            liked ? "text-rose-500 hover:text-rose-400" : "text-[var(--color-text-muted)] hover:text-rose-400"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        {count > 0 && (
          <button
            onClick={() => initialLikers.length > 0 && setShowLikers((v) => !v)}
            className="text-xs text-[var(--color-text-muted)] underline hover:text-[var(--color-primary)] transition-colors"
          >
            {count}
          </button>
        )}
      </div>
      {showLikers && initialLikers.length > 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">{formatLikers(initialLikers)}</p>
      )}
    </div>
  );
}
