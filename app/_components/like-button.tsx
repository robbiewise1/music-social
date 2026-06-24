"use client";

import { useState } from "react";
import { toggleLike } from "@/app/actions/likes";

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setPending(true);

    const result = await toggleLike(postId, prevLiked);
    setPending(false);

    if (result?.error) {
      setLiked(prevLiked);
      setCount(prevCount);
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={liked ? "Unlike" : "Like"}
      className={`flex items-center gap-1.5 text-xs transition-colors ${
        liked
          ? "text-rose-500 hover:text-rose-400"
          : "text-zinc-400 hover:text-rose-400"
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
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
