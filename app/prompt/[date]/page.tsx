import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FeedItem, type FeedPost } from "@/app/_components/feed-item";

export default async function PromptPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const admin = createAdminClient();

  const { data: prompt } = await admin
    .from("prompts")
    .select("id, title, description, active_date")
    .eq("active_date", date)
    .single();

  if (!prompt) notFound();

  const { data: rawPosts } = await admin
    .from("posts")
    .select(
      `id, caption, created_at,
       profiles:profiles!posts_user_id_fkey ( username, display_name, avatar_url ),
       songs ( title, artist, album, album_art_url, spotify_url )`
    )
    .eq("prompt_id", prompt.id)
    .order("created_at", { ascending: false });

  const posts = (rawPosts ?? []) as unknown as FeedPost[];

  // Get current user (optional — page is public)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const postIds = posts.map((p) => p.id);
  const [{ data: allLikes }, { data: myLikes }] =
    postIds.length > 0
      ? await Promise.all([
          admin.from("likes").select("post_id").in("post_id", postIds),
          user
            ? admin
                .from("likes")
                .select("post_id")
                .eq("user_id", user.id)
                .in("post_id", postIds)
            : Promise.resolve({ data: [] }),
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

  const formatted = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs text-zinc-400 mb-1">{formatted}</p>
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">{prompt.title}</h1>
      {prompt.description && (
        <p className="text-sm text-zinc-500 mb-6">{prompt.description}</p>
      )}

      <Link
        href="/compose"
        className="inline-block mb-8 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
      >
        + Post your response
      </Link>

      {postsWithLikes.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400">
          No responses yet — be the first!
        </p>
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
