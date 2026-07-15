"use client";

import { useState, useRef, useEffect } from "react";
import { togglePutOn } from "@/app/actions/put-ons";

function formatPutOners(putOners: string[]): string {
  if (putOners.length === 1) return putOners[0];
  if (putOners.length === 2) return `${putOners[0]} and ${putOners[1]}`;
  if (putOners.length === 3) return `${putOners[0]}, ${putOners[1]} and ${putOners[2]}`;
  return `${putOners[0]}, ${putOners[1]} and ${putOners.length - 2} others`;
}

function BulbIcon() {
  return (
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
  );
}

export function PutMeOnButton({
  postId,
  initialPutOn,
  initialCount,
  initialPutOners = [],
  readOnly = false,
}: {
  postId: string;
  initialPutOn: boolean;
  initialCount: number;
  initialPutOners?: string[];
  readOnly?: boolean;
}) {
  const [putOn, setPutOn] = useState(initialPutOn);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [showPutOners, setShowPutOners] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPutOners) return;
    function handleOutsideClick(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPutOners(false);
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [showPutOners]);

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

  if (readOnly) {
    return (
      <div ref={containerRef} className="inline-flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
          <BulbIcon />
          <span className="text-xs">New to me</span>
          {count > 0 && (
            <button
              onClick={() => setShowPutOners((v) => !v)}
              className="text-xs underline hover:text-[var(--color-primary)] transition-colors"
              aria-label="Show who was put on"
            >
              {count}
            </button>
          )}
        </div>
        {showPutOners && initialPutOners.length > 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">{formatPutOners(initialPutOners)}</p>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="inline-flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleClick}
          aria-label={putOn ? "Remove put on" : "Put me on"}
          className={`flex items-center gap-1.5 transition-colors ${
            putOn
              ? "text-violet-500 hover:text-violet-400"
              : "text-[var(--color-text-muted)] hover:text-violet-400"
          }`}
        >
          <BulbIcon />
          <span className="text-xs">New to me</span>
        </button>
        {count > 0 && (
          <button
            onClick={() => initialPutOners.length > 0 && setShowPutOners((v) => !v)}
            className="text-xs text-[var(--color-text-muted)] underline hover:text-[var(--color-primary)] transition-colors"
            aria-label="Show who was put on"
          >
            {count}
          </button>
        )}
      </div>
      {showPutOners && initialPutOners.length > 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">{formatPutOners(initialPutOners)}</p>
      )}
    </div>
  );
}
