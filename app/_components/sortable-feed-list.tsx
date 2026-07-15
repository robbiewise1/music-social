"use client";

import { useState } from "react";
import { FeedItem, type FeedPost } from "./feed-item";

type SortOrder = "recent" | "likes";

export function SortableFeedList({ posts }: { posts: FeedPost[] }) {
  const [sort, setSort] = useState<SortOrder>("recent");

  const sorted = [...posts].sort((a, b) => {
    if (sort === "likes") return (b.likeCount ?? 0) - (a.likeCount ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="w-full">
      {posts.length > 1 && (
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setSort("recent")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              sort === "recent"
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-accent)]/18 text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSort("likes")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              sort === "likes"
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-accent)]/18 text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
            }`}
          >
            Most Liked
          </button>
        </div>
      )}
      <div className="space-y-4">
        {sorted.map((post) => (
          <FeedItem key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
