import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { FeedItem, type FeedPost } from "@/app/_components/feed-item";
import { FollowButton } from "@/app/_components/follow-button";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [followersRes, followingRes, isFollowingRes, postsRes] =
    await Promise.all([
      admin
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id),
      admin
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.id),
      user
        ? admin
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id)
            .eq("following_id", profile.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      admin
        .from("posts")
        .select(
          `id, caption, created_at,
           profiles:profiles!posts_user_id_fkey ( username, display_name, avatar_url ),
           songs ( title, artist, album, album_art_url, spotify_url )`
        )
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const followerCount = followersRes.count ?? 0;
  const followingCount = followingRes.count ?? 0;
  const isFollowing = !!isFollowingRes.data;
  const posts = (postsRes.data ?? []) as unknown as FeedPost[];
  const isOwnProfile = user?.id === profile.id;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-zinc-200 shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              {profile.display_name}
            </h1>
            <p className="text-sm text-zinc-400">@{profile.username}</p>
            <div className="mt-1.5 flex gap-4 text-xs text-zinc-500">
              <span>
                <strong className="text-zinc-900">{followerCount}</strong>{" "}
                followers
              </span>
              <span>
                <strong className="text-zinc-900">{followingCount}</strong>{" "}
                following
              </span>
            </div>
          </div>
        </div>
        {user && !isOwnProfile && (
          <FollowButton userId={profile.id} initialFollowing={isFollowing} />
        )}
      </div>

      {posts.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400">No posts yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <FeedItem key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
