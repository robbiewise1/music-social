"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

export type AlbumReply = {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  like_count: number;
  liked_by_me: boolean;
  profiles: { display_name: string; username: string } | null;
};

export async function fetchAlbumReplies(
  albumPostId: string
): Promise<AlbumReply[] | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("album_post_comments")
    .select("id, body, created_at, parent_id, profiles(display_name, username)")
    .eq("album_post_id", albumPostId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  const comments = data ?? [];
  if (comments.length === 0) return [];

  const { data: likeRows } = await admin
    .from("album_comment_likes")
    .select("album_comment_id, user_id")
    .in(
      "album_comment_id",
      comments.map((c) => c.id)
    );

  const likeCounts = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const row of likeRows ?? []) {
    likeCounts.set(row.album_comment_id, (likeCounts.get(row.album_comment_id) ?? 0) + 1);
    if (user && row.user_id === user.id) likedByMe.add(row.album_comment_id);
  }

  return comments.map((c) => ({
    ...c,
    like_count: likeCounts.get(c.id) ?? 0,
    liked_by_me: likedByMe.has(c.id),
  })) as unknown as AlbumReply[];
}

export async function addAlbumReply(
  albumPostId: string,
  body: string,
  parentId: string | null = null
): Promise<{ error: string } | void> {
  if (!body.trim()) return { error: "Reply cannot be empty." };
  if (body.trim().length > 150) return { error: "Reply must be 150 characters or less." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("album_post_comments")
    .insert({ user_id: user.id, album_post_id: albumPostId, body: body.trim(), parent_id: parentId });

  if (error) return { error: error.message };

  const [{ data: post }, { data: commenter }, { data: parentComment }] = await Promise.all([
    admin.from("album_posts").select("user_id").eq("id", albumPostId).maybeSingle(),
    admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    parentId
      ? admin.from("album_post_comments").select("user_id").eq("id", parentId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const name = commenter?.display_name ?? "Someone";
  const preview = body.trim().length > 60 ? body.trim().slice(0, 57) + "…" : body.trim();
  const notified = new Set<string>([user.id]);

  if (parentComment?.user_id && !notified.has(parentComment.user_id)) {
    notified.add(parentComment.user_id);
    await sendPushToUser(parentComment.user_id, {
      title: "Music Club",
      body: `${name} replied: ${preview}`,
      url: "/prompt/album-of-the-week",
    });
  }

  if (post?.user_id && !notified.has(post.user_id)) {
    notified.add(post.user_id);
    await sendPushToUser(post.user_id, {
      title: "Music Club",
      body: `${name}: ${preview}`,
      url: "/prompt/album-of-the-week",
    });
  }
}

export async function toggleAlbumCommentLike(
  commentId: string,
  currentlyLiked: boolean
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  if (currentlyLiked) {
    await admin
      .from("album_comment_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("album_comment_id", commentId);
    return;
  }

  await admin.from("album_comment_likes").insert({ user_id: user.id, album_comment_id: commentId });

  const [{ data: comment }, { data: liker }] = await Promise.all([
    admin.from("album_post_comments").select("user_id").eq("id", commentId).maybeSingle(),
    admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);

  if (comment?.user_id && comment.user_id !== user.id) {
    const name = liker?.display_name ?? "Someone";
    await sendPushToUser(comment.user_id, {
      title: "Music Club",
      body: `${name} liked your reply`,
      url: "/prompt/album-of-the-week",
    });
  }
}
