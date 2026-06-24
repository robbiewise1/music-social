import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FeedItem, type FeedPost } from "@/app/_components/feed-item";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (follows ?? []).map((f) => f.following_id);
  const isEmptyFeed = followingIds.length === 0;

  const admin = createAdminClient();
  const baseQuery = admin
    .from("posts")
    .select(
      `id, caption, created_at,
       profiles:profiles!posts_user_id_fkey ( username, display_name, avatar_url ),
       songs ( title, artist, album, album_art_url, spotify_url )`
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: rawPosts, error: postsError } = isEmptyFeed
    ? await baseQuery
    : await baseQuery.in("user_id", [...followingIds, user.id]);

  if (postsError) console.error("Feed query error:", postsError);

  const posts = (rawPosts ?? []) as unknown as FeedPost[];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {isEmptyFeed && posts.length > 0 && (
        <p className="text-center text-xs text-zinc-400 mb-6">
          You&apos;re not following anyone yet — here&apos;s what everyone is
          posting.
        </p>
      )}

      {posts.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-zinc-400 text-sm">No posts yet.</p>
          <Link
            href="/compose"
            className="mt-3 inline-block text-sm text-zinc-900 underline underline-offset-2"
          >
            Be the first to post
          </Link>
        </div>
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
