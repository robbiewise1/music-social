"use client";

import { useState } from "react";
import Link from "next/link";
import { GENRE_ICONS } from "@/app/_components/music-icons";
import { GENRE_CATEGORY_LABELS, type GenreCategory } from "@/lib/genre-map";

type Entry = {
  userId: string;
  username: string;
  displayName: string;
  currentStreak: number;
  longestStreak: number;
  topGenre: GenreCategory | null;
};

type PutOnEntry = {
  userId: string;
  username: string;
  displayName: string;
  count: number;
  topGenre: GenreCategory | null;
};

const MEDALS = ["🥇", "🥈", "🥉"];

function GenreBadge({ topGenre }: { topGenre: GenreCategory | null }) {
  if (!topGenre) return null;
  const Icon = GENRE_ICONS[topGenre];
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] shrink-0">
      <Icon className="h-3 w-3 shrink-0" />
      {GENRE_CATEGORY_LABELS[topGenre]}
    </span>
  );
}

function RankedList({
  entries,
  currentUserId,
  statLabel,
}: {
  entries: PutOnEntry[];
  currentUserId: string;
  statLabel: (count: number) => string;
}) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
        No one yet — start discovering!
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const isMe = entry.userId === currentUserId;
        return (
          <Link
            key={entry.userId}
            href={`/profile/${entry.username}`}
            className={`flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-[var(--color-primary)]/30 ${
              isMe ? "border-[var(--color-primary)] bg-[var(--color-surface-tint)]" : "border-[var(--color-accent)]/12 bg-[var(--color-surface)]"
            }`}
          >
            <div className="w-7 flex items-center justify-center shrink-0">
              {i < 3 ? (
                <span className="text-xl">{MEDALS[i]}</span>
              ) : (
                <span className="text-sm font-medium text-[var(--color-text-muted)]">{i + 1}</span>
              )}
            </div>

            <div className="h-9 w-9 rounded-full bg-[var(--color-accent)]/20 shrink-0" />

            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)] truncate">
                <span className="truncate">{entry.displayName}</span>
                {isMe && (
                  <span className="text-xs font-normal text-[var(--color-text-muted)]">you</span>
                )}
                <GenreBadge topGenre={entry.topGenre} />
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">@{entry.username}</p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-[var(--color-text)] tabular-nums">
                {entry.count}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">{statLabel(entry.count)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function LeaderboardTabs({
  entries,
  currentUserId,
  topPutOns,
  topDiscoverers,
}: {
  entries: Entry[];
  currentUserId: string;
  topPutOns: PutOnEntry[];
  topDiscoverers: PutOnEntry[];
}) {
  const [view, setView] = useState<"current" | "longest" | "putons">("current");

  const sorted = [...entries].sort((a, b) =>
    view === "current"
      ? b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak
      : b.longestStreak - a.longestStreak || b.currentStreak - a.currentStreak
  );

  // Show top 5, but include everyone tied at 5th place.
  const cutoff = sorted[4] ? (view === "current" ? sorted[4].currentStreak : sorted[4].longestStreak) : 0;
  const visible = sorted.filter((e) =>
    (view === "current" ? e.currentStreak : e.longestStreak) >= cutoff
  );

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView("current")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            view === "current"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface-tint)] text-[var(--color-text-muted)] hover:bg-[var(--color-accent)]/20"
          }`}
        >
          🔥 Current Streak
        </button>
        <button
          onClick={() => setView("longest")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            view === "longest"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface-tint)] text-[var(--color-text-muted)] hover:bg-[var(--color-accent)]/20"
          }`}
        >
          🏆 All-Time Best
        </button>
        <button
          onClick={() => setView("putons")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            view === "putons"
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface-tint)] text-[var(--color-text-muted)] hover:bg-[var(--color-accent)]/20"
          }`}
        >
          🎧 Put Ons
        </button>
      </div>

      {view === "putons" ? (
        <div className="space-y-10">
          <div>
            <p className="text-base font-semibold text-[var(--color-text)] mb-0.5">Top Put Ons</p>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">Who put the most people onto new music</p>
            <RankedList
              entries={topPutOns}
              currentUserId={currentUserId}
              statLabel={(n) => n === 1 ? "put on" : "put ons"}
            />
          </div>
          <div>
            <p className="text-base font-semibold text-[var(--color-text)] mb-0.5">Top Discoverers</p>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">Who discovered the most new music</p>
            <RankedList
              entries={topDiscoverers}
              currentUserId={currentUserId}
              statLabel={(n) => n === 1 ? "song discovered" : "songs discovered"}
            />
          </div>
        </div>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--color-text-muted)]">
          No streaks yet — post a song to get on the board!
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((entry, i) => {
            const isMe = entry.userId === currentUserId;
            const streak =
              view === "current" ? entry.currentStreak : entry.longestStreak;
            return (
              <Link
                key={entry.userId}
                href={`/profile/${entry.username}`}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-[var(--color-primary)]/30 ${
                  isMe ? "border-[var(--color-primary)] bg-[var(--color-surface-tint)]" : "border-[var(--color-accent)]/12 bg-[var(--color-surface)]"
                }`}
              >
                <div className="w-7 flex items-center justify-center shrink-0">
                  {i < 3 ? (
                    <span className="text-xl">{MEDALS[i]}</span>
                  ) : (
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">
                      {i + 1}
                    </span>
                  )}
                </div>

                <div className="h-9 w-9 rounded-full bg-[var(--color-accent)]/20 shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)] truncate">
                    <span className="truncate">{entry.displayName}</span>
                    {isMe && (
                      <span className="text-xs font-normal text-[var(--color-text-muted)]">
                        you
                      </span>
                    )}
                    <GenreBadge topGenre={entry.topGenre} />
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">@{entry.username}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-[var(--color-text)] tabular-nums">
                    {streak}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
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
