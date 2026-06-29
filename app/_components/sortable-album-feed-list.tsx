"use client";

import { useState } from "react";
import { AlbumFeedItem, type AlbumFeedPost } from "./album-feed-item";

type SortMode = "recent" | "liked";

export function SortableAlbumFeedList({ posts }: { posts: AlbumFeedPost[] }) {
  const [sort, setSort] = useState<SortMode>("recent");

  const sorted = [...posts].sort((a, b) => {
    if (sort === "liked") return b.likeCount - a.likeCount;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div>
      {posts.length >= 2 && (
        <div className="flex gap-2 mb-4">
          {(["recent", "liked"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSort(mode)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                sort === mode
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 text-zinc-500 hover:border-zinc-400"
              }`}
            >
              {mode === "recent" ? "Recent" : "Most Liked"}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-4">
        {sorted.map((post) => (
          <AlbumFeedItem key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
