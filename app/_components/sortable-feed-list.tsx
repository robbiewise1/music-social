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
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900"
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSort("likes")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              sort === "likes"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900"
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
