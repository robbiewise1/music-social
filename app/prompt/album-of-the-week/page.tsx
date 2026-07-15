import { getAuthUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { type AlbumFeedPost } from "@/app/_components/album-feed-item";
import { SortableAlbumFeedList } from "@/app/_components/sortable-album-feed-list";
import { fetchCommentCounts } from "@/lib/comment-counts.server";

const ALBUM_POST_SELECT = `id, caption, created_at, user_id,
  profiles:profiles!album_posts_user_id_fkey ( username, display_name, avatar_url ),
  albums ( title, artist, album_art_url, apple_music_url )`;

type AlbumPostWithUser = AlbumFeedPost & { user_id: string };

type WeekSectionData = {
  prompt: { id: string; title: string; description: string | null } | null;
  posts: AlbumFeedPost[];
  userPosted: boolean;
};

function getWeekStrings() {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const [yr, mo, dy] = todayStr.split("-").map(Number);
  const today = new Date(Date.UTC(yr, mo - 1, dy));
  const dayOfWeek = today.getUTCDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(Date.UTC(yr, mo - 1, dy + daysToMonday));
  const lastMonday = new Date(Date.UTC(yr, mo - 1, dy + daysToMonday - 7));
  return {
    thisWeek: thisMonday.toISOString().split("T")[0],
    lastWeek: lastMonday.toISOString().split("T")[0],
  };
}

function formatWeek(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const end = new Date(dateStr + "T00:00:00");
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${d.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

async function fetchWeekSection(
  weekStart: string,
  userId: string | undefined
): Promise<WeekSectionData> {
  const admin = createAdminClient();

  const { data: prompt } = await admin
    .from("prompts")
    .select("id, title, description")
    .eq("active_date", weekStart)
    .eq("prompt_type", "album_of_the_week")
    .maybeSingle();

  if (!prompt) return { prompt: null, posts: [], userPosted: false };

  const { data: rawPosts } = await admin
    .from("album_posts")
    .select(ALBUM_POST_SELECT)
    .eq("prompt_id", prompt.id)
    .order("created_at", { ascending: false });

  const posts = (rawPosts ?? []) as unknown as AlbumPostWithUser[];
  const postIds = posts.map((p) => p.id);

  const [{ data: allLikes }, { data: myLikes }, replyCountMap] =
    postIds.length > 0
      ? await Promise.all([
          admin.from("album_post_likes").select("album_post_id, profiles(display_name)").in("album_post_id", postIds),
          userId
            ? admin.from("album_post_likes").select("album_post_id").eq("user_id", userId).in("album_post_id", postIds)
            : Promise.resolve({ data: [] }),
          fetchCommentCounts("album_post", postIds),
        ])
      : [{ data: [] }, { data: [] }, new Map<string, number>()];

  const likeCountMap = new Map<string, number>();
  const likerNamesMap = new Map<string, string[]>();
  for (const l of (allLikes ?? []) as unknown as { album_post_id: string; profiles: { display_name: string } | null }[]) {
    likeCountMap.set(l.album_post_id, (likeCountMap.get(l.album_post_id) ?? 0) + 1);
    if (l.profiles?.display_name) {
      const names = likerNamesMap.get(l.album_post_id) ?? [];
      names.push(l.profiles.display_name);
      likerNamesMap.set(l.album_post_id, names);
    }
  }
  const likedSet = new Set((myLikes ?? []).map((l) => (l as { album_post_id: string }).album_post_id));

  const postsWithLikes = posts.map((p) => ({
    ...p,
    likeCount: likeCountMap.get(p.id) ?? 0,
    isLiked: likedSet.has(p.id),
    likers: likerNamesMap.get(p.id) ?? [],
    replyCount: replyCountMap.get(p.id) ?? 0,
    currentUserId: userId ?? null,
  }));

  const userPosted = userId ? posts.some((p) => p.user_id === userId) : false;

  return { prompt, posts: postsWithLikes, userPosted };
}

export default async function AlbumOfTheWeekPage() {
  const { thisWeek, lastWeek } = getWeekStrings();

  const user = await getAuthUser();

  const [thisWeekData, lastWeekData] = await Promise.all([
    fetchWeekSection(thisWeek, user?.id),
    fetchWeekSection(lastWeek, user?.id),
  ]);

  return (
    <main className="w-full mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/feed" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
          ← Home
        </Link>
      </div>

      <div className="flex gap-2 mb-10 flex-wrap">
        <span className="px-4 py-2 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium">
          Album of the Week
        </span>
        <Link href="/prompt/song-of-the-day" className="px-4 py-2 rounded-full border border-[var(--color-accent)]/18 text-[var(--color-text-muted)] text-sm font-medium hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors">
          Song of the Day
        </Link>
        <Link href="/prompt/daily-fun" className="px-4 py-2 rounded-full border border-[var(--color-accent)]/18 text-[var(--color-text-muted)] text-sm font-medium hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors">
          Daily Prompt
        </Link>
      </div>

      {thisWeekData.prompt ? (
        <section className="mb-14 w-full">
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-widest mb-1">
            This Week · {formatWeek(thisWeek)}
          </p>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">{thisWeekData.prompt.title}</h2>
          {thisWeekData.prompt.description && (
            <p className="text-sm text-[var(--color-text-muted)] mb-6">{thisWeekData.prompt.description}</p>
          )}
          {user && (
            <Link
              href={`/compose/album?prompt_id=${thisWeekData.prompt.id}`}
              className="inline-block mb-8 rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              {thisWeekData.userPosted ? "Change your album" : "+ Post your album"}
            </Link>
          )}
          {thisWeekData.posts.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">No albums yet — be the first!</p>
          ) : (
            <SortableAlbumFeedList posts={thisWeekData.posts} />
          )}
        </section>
      ) : (
        <section className="mb-14 w-full">
          <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">No album prompt this week yet.</p>
        </section>
      )}

      {lastWeekData.prompt && (
        <>
          <hr className="border-[var(--color-accent)]/12 mb-14" />
          <section className="mb-14 w-full">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-widest mb-1">
              Last Week · {formatWeek(lastWeek)}
            </p>
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-1">{lastWeekData.prompt.title}</h2>
            {lastWeekData.prompt.description && (
              <p className="text-sm text-[var(--color-text-muted)] mb-6">{lastWeekData.prompt.description}</p>
            )}
            {lastWeekData.posts.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">No albums posted last week.</p>
            ) : (
              <SortableAlbumFeedList posts={lastWeekData.posts} />
            )}
          </section>
        </>
      )}
    </main>
  );
}
