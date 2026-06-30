"use client";

import { useState } from "react";
import { togglePutOn } from "@/app/actions/put-ons";

export function PutMeOnButton({
  postId,
  initialPutOn,
  initialCount,
}: {
  postId: string;
  initialPutOn: boolean;
  initialCount: number;
}) {
  const [putOn, setPutOn] = useState(initialPutOn);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    const prevPutOn = putOn;
    const prevCount = count;
    setPutOn(!putOn);
    setCount(putOn ? count - 1 : count + 1);
    setPending(true);

    const result = await togglePutOn(postId, prevPutOn);
    setPending(false);

    if (result?.error) {
      setPutOn(prevPutOn);
      setCount(prevCount);
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={putOn ? "Remove put on" : "Put me on"}
      className={`flex items-center gap-1.5 transition-colors ${
        putOn
          ? "text-violet-500 hover:text-violet-400"
          : "text-zinc-400 hover:text-violet-400"
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
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      </svg>
      <span className="text-xs">Put me on</span>
      {count > 0 && (
        <span className="text-xs text-zinc-400">{count}</span>
      )}
    </button>
  );
}
