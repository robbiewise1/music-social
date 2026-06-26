import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { FeedItem, type FeedPost } from "@/app/_components/feed-item";

const POST_SELECT = `id, caption, created_at, user_id,
  profiles:profiles!posts_user_id_fkey ( username, display_name, avatar_url ),
  songs ( title, artist, album, album_art_url, spotify_url )`;

type PostWithUser = FeedPost & { user_id: string };
type PromptType = "song_of_the_day" | "daily_fun";

function getDateStrings() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const yesterday = y.toISOString().split("T")[0];
  return { today, yesterday };
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

async function fetchDaySection(
  date: string,
  promptType: PromptType,
  userId: string | undefined
) {
  const admin = createAdminClient();

  const { data: prompt } = await admin
    .from("prompts")
    .select("id, title, description")
    .eq("active_date", date)
    .eq("prompt_type", promptType)
    .maybeSingle();

  if (!prompt) return { prompt: null, posts: [], userPosted: false };

  const { data: rawPosts } = await admin
    .from("posts")
    .select(POST_SELECT)
    .eq("prompt_id", prompt.id)
    .order("created_at", { ascending: false });

  const posts = (rawPosts ?? []) as unknown as PostWithUser[];
  const postIds = posts.map((p) => p.id);

  const [{ data: allLikes }, { data: myLikes }] =
    postIds.length > 0
      ? await Promise.all([
          admin.from("likes").select("post_id").in("post_id", postIds),
          userId
            ? admin
                .from("likes")
                .select("post_id")
                .eq("user_id", userId)
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

  const userPosted = userId ? posts.some((p) => p.user_id === userId) : false;

  return { prompt, posts: postsWithLikes, userPosted };
}

export async function PromptTypeFeed({
  promptType,
}: {
  promptType: PromptType;
}) {
  const { today, yesterday } = getDateStrings();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [todayData, yesterdayData] = await Promise.all([
    fetchDaySection(today, promptType, user?.id),
    fetchDaySection(yesterday, promptType, user?.id),
  ]);

  const actionLabel = "Post your song";
  const changeLabel = "Change your song";
  const emptyLabel = "No songs yet — be the first!";

  function DaySection({
    dateStr,
    label,
    data,
    isToday,
  }: {
    dateStr: string;
    label: string;
    data: Awaited<ReturnType<typeof fetchDaySection>>;
    isToday: boolean;
  }) {
    if (!data.prompt) return null;

    return (
      <section className="mb-14">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1">
          {label} · {formatDate(dateStr)}
        </p>
        <h2 className="text-2xl font-bold text-zinc-900 mb-1">
          {data.prompt.title}
        </h2>
        {data.prompt.description && (
          <p className="text-sm text-zinc-500 mb-6">{data.prompt.description}</p>
        )}
        {isToday && user && (
          <Link
            href={`/compose?prompt_id=${data.prompt.id}`}
            className="inline-block mb-8 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            {data.userPosted ? changeLabel : `+ ${actionLabel}`}
          </Link>
        )}
        {data.posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">{emptyLabel}</p>
        ) : (
          <div className="space-y-4">
            {data.posts.map((post) => (
              <FeedItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    );
  }

  const otherType = promptType === "song_of_the_day" ? "daily_fun" : "song_of_the_day";
  const otherHref = promptType === "song_of_the_day" ? "/prompt/daily-fun" : "/prompt/song-of-the-day";
  const otherLabel = promptType === "song_of_the_day" ? "Prompt of the Day" : "Song of the Day";
  const currentLabel = promptType === "song_of_the_day" ? "Song of the Day" : "Prompt of the Day";

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/feed"
          className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          ← Home
        </Link>
      </div>

      <div className="flex gap-2 mb-10">
        <span className="px-4 py-2 rounded-full bg-zinc-900 text-white text-sm font-medium">
          {currentLabel}
        </span>
        <Link
          href={otherHref}
          className="px-4 py-2 rounded-full border border-zinc-200 text-zinc-500 text-sm font-medium hover:border-zinc-400 hover:text-zinc-900 transition-colors"
        >
          {otherLabel}
        </Link>
      </div>

      <DaySection
        dateStr={today}
        label="Today"
        data={todayData}
        isToday={true}
      />

      {yesterdayData.prompt && (
        <>
          <hr className="border-zinc-100 mb-14" />
          <DaySection
            dateStr={yesterday}
            label="Yesterday"
            data={yesterdayData}
            isToday={false}
          />
        </>
      )}
    </main>
  );
}
