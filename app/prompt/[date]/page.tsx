import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { type FeedPost } from "@/app/_components/feed-item";
import { SortableFeedList } from "@/app/_components/sortable-feed-list";

const POST_SELECT = `id, caption, created_at, user_id,
  profiles:profiles!posts_user_id_fkey ( username, display_name, avatar_url ),
  songs ( title, artist, album, album_art_url, spotify_url )`;

type PostWithUser = FeedPost & { user_id: string };

export default async function PromptPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const admin = createAdminClient();

  const [{ data: sotd }, { data: funPrompt }] = await Promise.all([
    admin
      .from("prompts")
      .select("id, title, description")
      .eq("active_date", date)
      .eq("prompt_type", "song_of_the_day")
      .maybeSingle(),
    admin
      .from("prompts")
      .select("id, title, description")
      .eq("active_date", date)
      .eq("prompt_type", "daily_fun")
      .maybeSingle(),
  ]);

  if (!sotd && !funPrompt) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: rawSotdPosts }, { data: rawFunPosts }] = await Promise.all([
    sotd
      ? admin
          .from("posts")
          .select(POST_SELECT)
          .eq("prompt_id", sotd.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    funPrompt
      ? admin
          .from("posts")
          .select(POST_SELECT)
          .eq("prompt_id", funPrompt.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const sotdPosts = (rawSotdPosts ?? []) as unknown as PostWithUser[];
  const funPosts = (rawFunPosts ?? []) as unknown as PostWithUser[];

  const allPostIds = [...sotdPosts, ...funPosts].map((p) => p.id);

  const [{ data: allLikes }, { data: myLikes }, { data: allReplies }, { data: allPutOns }, { data: myPutOns }] =
    allPostIds.length > 0
      ? await Promise.all([
          admin.from("likes").select("post_id, profiles(display_name)").in("post_id", allPostIds),
          user
            ? admin.from("likes").select("post_id").eq("user_id", user.id).in("post_id", allPostIds)
            : Promise.resolve({ data: [] }),
          admin.from("comments").select("post_id").in("post_id", allPostIds),
          admin.from("put_ons").select("post_id, profiles(display_name)").in("post_id", allPostIds),
          user
            ? admin.from("put_ons").select("post_id").eq("user_id", user.id).in("post_id", allPostIds)
            : Promise.resolve({ data: [] }),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const likeCountMap = new Map<string, number>();
  const likerNamesMap = new Map<string, string[]>();
  for (const l of (allLikes ?? []) as unknown as { post_id: string; profiles: { display_name: string } | null }[]) {
    likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) ?? 0) + 1);
    if (l.profiles?.display_name) {
      const names = likerNamesMap.get(l.post_id) ?? [];
      names.push(l.profiles.display_name);
      likerNamesMap.set(l.post_id, names);
    }
  }
  const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));

  const replyCountMap = new Map<string, number>();
  for (const c of (allReplies ?? []) as { post_id: string }[]) {
    replyCountMap.set(c.post_id, (replyCountMap.get(c.post_id) ?? 0) + 1);
  }

  const putOnCountMap = new Map<string, number>();
  const putOnerNamesMap = new Map<string, string[]>();
  for (const p of (allPutOns ?? []) as unknown as { post_id: string; profiles: { display_name: string } | null }[]) {
    putOnCountMap.set(p.post_id, (putOnCountMap.get(p.post_id) ?? 0) + 1);
    if (p.profiles?.display_name) {
      const names = putOnerNamesMap.get(p.post_id) ?? [];
      names.push(p.profiles.display_name);
      putOnerNamesMap.set(p.post_id, names);
    }
  }
  const putOnSet = new Set((myPutOns ?? []).map((p) => p.post_id));

  function withLikes(posts: PostWithUser[]) {
    return posts.map((p) => ({
      ...p,
      likeCount: likeCountMap.get(p.id) ?? 0,
      isLiked: likedSet.has(p.id),
      likers: likerNamesMap.get(p.id) ?? [],
      replyCount: replyCountMap.get(p.id) ?? 0,
      putOnCount: putOnCountMap.get(p.id) ?? 0,
      isPutOn: putOnSet.has(p.id),
      putOners: putOnerNamesMap.get(p.id) ?? [],
      isOwnPost: user ? p.user_id === user.id : false,
    }));
  }

  const sotdWithLikes = withLikes(sotdPosts);
  const funWithLikes = withLikes(funPosts);

  const userPostedSotd = user ? sotdPosts.some((p) => p.user_id === user.id) : false;
  const userPostedFun = user ? funPosts.some((p) => p.user_id === user.id) : false;

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const isToday = date === today;

  const formatted = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="w-full mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/feed" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
          ← Home
        </Link>
        <p className="text-xs text-zinc-400">{formatted}</p>
      </div>

      {sotd && (
        <section className="mb-12">
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Song of the Day</h1>
          {sotd.description && (
            <p className="text-sm text-zinc-500 mb-6">{sotd.description}</p>
          )}
          {isToday && (
            <Link
              href={`/compose?prompt_id=${sotd.id}`}
              className="inline-block mb-8 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              {userPostedSotd ? "Change your song" : "+ Post your song"}
            </Link>
          )}
          {sotdWithLikes.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-400">
              No songs yet — be the first!
            </p>
          ) : (
            <SortableFeedList posts={sotdWithLikes} />
          )}
        </section>
      )}

      {funPrompt && (
        <>
          {sotd && <hr className="border-zinc-100 mb-12" />}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">{funPrompt.title}</h2>
            {funPrompt.description && (
              <p className="text-sm text-zinc-500 mb-6">{funPrompt.description}</p>
            )}
            {isToday && (
              <Link
                href={`/compose?prompt_id=${funPrompt.id}`}
                className="inline-block mb-8 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
              >
                {userPostedFun ? "Change your response" : "+ Post your response"}
              </Link>
            )}
            {funWithLikes.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-400">
                No responses yet — be the first!
              </p>
            ) : (
              <SortableFeedList posts={funWithLikes} />
            )}
          </section>
        </>
      )}
    </main>
  );
}
