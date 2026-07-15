import { getAuthUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { UserSearchInput } from "@/app/_components/user-search-input";
import { FollowButton } from "@/app/_components/follow-button";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  type Profile = {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };

  let profiles: Profile[] = [];
  let followingIds = new Set<string>();

  if (q?.trim()) {
    const [profilesRes, followsRes] = await Promise.all([
      admin
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .neq("id", user.id)
        .limit(20),
      admin
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id),
    ]);

    profiles = (profilesRes.data ?? []) as Profile[];
    followingIds = new Set((followsRes.data ?? []).map((f) => f.following_id));
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Find people</h1>

      <Suspense>
        <UserSearchInput />
      </Suspense>

      <div className="mt-4">
        {q?.trim() && profiles.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">
            No users found for &ldquo;{q}&rdquo;.
          </p>
        )}

        {profiles.length > 0 && (
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-accent)]/12 bg-[var(--color-surface)] p-4"
              >
                <Link
                  href={`/profile/${profile.username}`}
                  className="flex items-center gap-3 min-w-0"
                >
                  <div className="h-9 w-9 rounded-full bg-[var(--color-accent)]/20 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {profile.display_name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">@{profile.username}</p>
                  </div>
                </Link>
                <FollowButton
                  userId={profile.id}
                  initialFollowing={followingIds.has(profile.id)}
                />
              </div>
            ))}
          </div>
        )}

        {!q?.trim() && (
          <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">
            Type a name or username above to search.
          </p>
        )}
      </div>
    </main>
  );
}
