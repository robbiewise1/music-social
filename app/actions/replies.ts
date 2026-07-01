"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

export type Reply = {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  like_count: number;
  liked_by_me: boolean;
  profiles: { display_name: string; username: string } | null;
};

export async function fetchReplies(postId: string): Promise<Reply[] | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("comments")
    .select("id, body, created_at, parent_id, profiles(display_name, username)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  const comments = data ?? [];
  if (comments.length === 0) return [];

  const { data: likeRows } = await admin
    .from("comment_likes")
    .select("comment_id, user_id")
    .in(
      "comment_id",
      comments.map((c) => c.id)
    );

  const likeCounts = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const row of likeRows ?? []) {
    likeCounts.set(row.comment_id, (likeCounts.get(row.comment_id) ?? 0) + 1);
    if (user && row.user_id === user.id) likedByMe.add(row.comment_id);
  }

  return comments.map((c) => ({
    ...c,
    like_count: likeCounts.get(c.id) ?? 0,
    liked_by_me: likedByMe.has(c.id),
  })) as unknown as Reply[];
}

export async function addReply(
  postId: string,
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
    .from("comments")
    .insert({ user_id: user.id, post_id: postId, body: body.trim(), parent_id: parentId });

  if (error) return { error: error.message };

  const [{ data: rawPost }, { data: commenter }, { data: parentComment }] = await Promise.all([
    admin
      .from("posts")
      .select("user_id, prompt:prompts ( active_date )")
      .eq("id", postId)
      .maybeSingle(),
    admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    parentId
      ? admin.from("comments").select("user_id").eq("id", parentId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const post = rawPost as unknown as { user_id: string; prompt: { active_date: string } | null } | null;

  const name = commenter?.display_name ?? "Someone";
  const preview = body.trim().length > 60 ? body.trim().slice(0, 57) + "…" : body.trim();
  const notified = new Set<string>([user.id]);
  const url = post?.prompt?.active_date ? `/prompt/${post.prompt.active_date}` : "/feed";

  if (parentComment?.user_id && !notified.has(parentComment.user_id)) {
    notified.add(parentComment.user_id);
    await sendPushToUser(parentComment.user_id, {
      title: "Music Club",
      body: `${name} replied: ${preview}`,
      url,
    });
  }

  if (post?.user_id && !notified.has(post.user_id)) {
    notified.add(post.user_id);
    await sendPushToUser(post.user_id, {
      title: "Music Club",
      body: `${name}: ${preview}`,
      url,
    });
  }
}

export async function toggleCommentLike(
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
    await admin.from("comment_likes").delete().eq("user_id", user.id).eq("comment_id", commentId);
    return;
  }

  await admin.from("comment_likes").insert({ user_id: user.id, comment_id: commentId });

  const [{ data: rawComment }, { data: liker }] = await Promise.all([
    admin
      .from("comments")
      .select("user_id, posts ( prompt:prompts ( active_date ) )")
      .eq("id", commentId)
      .maybeSingle(),
    admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);
  const comment = rawComment as unknown as {
    user_id: string;
    posts: { prompt: { active_date: string } | null } | null;
  } | null;

  if (comment?.user_id && comment.user_id !== user.id) {
    const name = liker?.display_name ?? "Someone";
    const activeDate = comment.posts?.prompt?.active_date;
    const url = activeDate ? `/prompt/${activeDate}` : "/feed";
    await sendPushToUser(comment.user_id, {
      title: "Music Club",
      body: `${name} liked your reply`,
      url,
    });
  }
}
