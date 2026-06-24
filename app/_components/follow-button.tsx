"use client";

import { useState } from "react";
import { followUser, unfollowUser } from "@/app/actions/follows";

type Props = {
  userId: string;
  initialFollowing: boolean;
};

export function FollowButton({ userId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const prev = following;
    setFollowing(!following);
    const result = following
      ? await unfollowUser(userId)
      : await followUser(userId);
    if (result.error) setFollowing(prev);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        following
          ? "border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
          : "bg-zinc-900 text-white hover:bg-zinc-700"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
