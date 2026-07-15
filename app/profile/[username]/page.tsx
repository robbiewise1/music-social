import { getAuthUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { FeedItem, type FeedPost } from "@/app/_components/feed-item";
import { NotificationToggle } from "@/app/_components/notification-toggle";

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

  const user = await getAuthUser();

  const { data: rawPosts } = await admin
    .from("posts")
    .select(
      `id, caption, created_at,
       profiles:profiles!posts_user_id_fkey ( username, display_name, avatar_url ),
       songs ( title, artist, album, album_art_url, spotify_url ),
       prompt:prompts ( title, active_date )`
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = (rawPosts ?? []) as unknown as FeedPost[];

  // Fetch like data
  const postIds = posts.map((p) => p.id);
  const [{ data: allLikes }, { data: myLikes }] =
    postIds.length > 0
      ? await Promise.all([
          admin.from("likes").select("post_id, profiles(display_name)").in("post_id", postIds),
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

  const postsWithLikes = posts.map((p) => ({
    ...p,
    likeCount: likeCountMap.get(p.id) ?? 0,
    isLiked: likedSet.has(p.id),
    likers: likerNamesMap.get(p.id) ?? [],
  }));

  return (
    <main className="w-full mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[var(--color-accent)]/20 shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">
              {profile.display_name}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">@{profile.username}</p>
          </div>
        </div>
      </div>

      {user?.id === profile.id && (
        <div className="mb-8">
          <NotificationToggle />
        </div>
      )}

      {postsWithLikes.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--color-text-muted)]">No posts yet.</p>
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
