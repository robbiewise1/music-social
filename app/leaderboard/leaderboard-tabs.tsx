"use client";

import { useState } from "react";
import Link from "next/link";

type Entry = {
  userId: string;
  username: string;
  displayName: string;
  currentStreak: number;
  longestStreak: number;
};

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardTabs({
  entries,
  currentUserId,
}: {
  entries: Entry[];
  currentUserId: string;
}) {
  const [view, setView] = useState<"current" | "longest">("current");

  const sorted = [...entries].sort((a, b) =>
    view === "current"
      ? b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak
      : b.longestStreak - a.longestStreak || b.currentStreak - a.currentStreak
  );

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView("current")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            view === "current"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          }`}
        >
          🔥 Current Streak
        </button>
        <button
          onClick={() => setView("longest")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            view === "longest"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          }`}
        >
          🏆 All-Time Best
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400">
          No streaks yet — post a song to get on the board!
        </p>
      ) : (
        <div className="space-y-2">
          {sorted.map((entry, i) => {
            const isMe = entry.userId === currentUserId;
            const streak =
              view === "current" ? entry.currentStreak : entry.longestStreak;
            return (
              <Link
                key={entry.userId}
                href={`/profile/${entry.username}`}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-zinc-300 ${
                  isMe ? "border-zinc-900 bg-zinc-50" : "border-zinc-100 bg-white"
                }`}
              >
                <div className="w-7 flex items-center justify-center shrink-0">
                  {i < 3 ? (
                    <span className="text-xl">{MEDALS[i]}</span>
                  ) : (
                    <span className="text-sm font-medium text-zinc-400">
                      {i + 1}
                    </span>
                  )}
                </div>

                <div className="h-9 w-9 rounded-full bg-zinc-200 shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {entry.displayName}
                    {isMe && (
                      <span className="ml-2 text-xs font-normal text-zinc-400">
                        you
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-400">@{entry.username}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-zinc-900 tabular-nums">
                    {streak}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {streak === 1 ? "day" : "days"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
