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

  const today = new Date().toISOString().split("T")[0];
  const { data: todayPrompt } = await admin
    .from("prompts")
    .select("id, title, active_date")
    .eq("active_date", today)
    .maybeSingle();

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

  // Fetch like counts and current user's likes in parallel
  const postIds = posts.map((p) => p.id);
  const [{ data: allLikes }, { data: myLikes }] =
    postIds.length > 0
      ? await Promise.all([
          admin.from("likes").select("post_id").in("post_id", postIds),
          admin
            .from("likes")
            .select("post_id")
            .eq("user_id", user.id)
            .in("post_id", postIds),
        ])
      : [{ data: [] }, { data: [] }];

  const likeCountMap = new Map<string, number>();
  for (const l of allLikes ?? []) {
    likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) ?? 0) + 1);
  }
  const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));

  const postsWithLikes = posts.map((p) => ({
    ...p,
    likeCount: likeCountMap.get(p.id) ?? 0,
    isLiked: likedSet.has(p.id),
  }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {todayPrompt && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-zinc-400 mb-0.5">Today&apos;s prompt</p>
            <p className="text-sm font-semibold text-zinc-900">{todayPrompt.title}</p>
          </div>
          <Link
            href={`/prompt/${todayPrompt.active_date}`}
            className="shrink-0 rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            See responses
          </Link>
        </div>
      )}

      {isEmptyFeed && posts.length > 0 && (
        <p className="text-center text-xs text-zinc-400 mb-6">
          You&apos;re not following anyone yet — here&apos;s what everyone is
          posting.
        </p>
      )}

      {postsWithLikes.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          {isEmptyFeed ? (
            <>
              <p className="text-2xl">👋</p>
              <p className="text-zinc-900 font-semibold">Welcome to Music Club</p>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                Follow some friends to see what they&apos;re listening to — or be
                the first to post a song.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  href="/search"
                  className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
                >
                  Find people to follow
                </Link>
                <Link
                  href="/compose"
                  className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  Post a song
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-zinc-400 text-sm">No posts yet.</p>
              <Link
                href="/compose"
                className="mt-1 inline-block text-sm text-zinc-900 underline underline-offset-2"
              >
                Be the first to post
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {postsWithLikes.map((post) => (
            <FeedItem key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
