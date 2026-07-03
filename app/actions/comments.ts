"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

export type CommentTarget = { type: "post" | "album_post"; id: string };

export type Comment = {
  id: string;
  user_id: string;
  body: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  parent_id: string | null;
  like_count: number;
  liked_by_me: boolean;
  profiles: { display_name: string; username: string } | null;
};

function targetColumn(type: CommentTarget["type"]) {
  return type === "post" ? "post_id" : "album_post_id";
}

async function resolveTargetUrl(
  admin: ReturnType<typeof createAdminClient>,
  target: CommentTarget
): Promise<{ url: string; ownerId: string }> {
  if (target.type === "post") {
    const { data } = await admin
      .from("posts")
      .select("user_id, prompt:prompts ( active_date )")
      .eq("id", target.id)
      .maybeSingle();
    const post = data as unknown as { user_id: string; prompt: { active_date: string } | null } | null;
    return {
      url: post?.prompt?.active_date ? `/prompt/${post.prompt.active_date}` : "/feed",
      ownerId: post?.user_id ?? "",
    };
  }
  const { data } = await admin.from("album_posts").select("user_id").eq("id", target.id).maybeSingle();
  return { url: "/prompt/album-of-the-week", ownerId: data?.user_id ?? "" };
}

export async function fetchComments(target: CommentTarget): Promise<Comment[] | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("comments")
    .select(
      "id, user_id, body, created_at, edited_at, deleted_at, parent_id, profiles!comments_user_id_fkey(display_name, username)"
    )
    .eq(targetColumn(target.type), target.id)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: likeRows } = await admin
    .from("comment_likes")
    .select("comment_id, user_id")
    .in(
      "comment_id",
      rows.map((c) => c.id)
    );

  const likeCounts = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const row of likeRows ?? []) {
    likeCounts.set(row.comment_id, (likeCounts.get(row.comment_id) ?? 0) + 1);
    if (user && row.user_id === user.id) likedByMe.add(row.comment_id);
  }

  return rows.map((c) => ({
    ...c,
    body: c.deleted_at ? null : c.body,
    like_count: likeCounts.get(c.id) ?? 0,
    liked_by_me: likedByMe.has(c.id),
  })) as unknown as Comment[];
}

export async function addComment(
  target: CommentTarget,
  body: string,
  parentId: string | null = null
): Promise<{ error: string } | void> {
  if (!body.trim()) return { error: "Comment cannot be empty." };
  if (body.trim().length > 150) return { error: "Comment must be 150 characters or less." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();
  const { error } = await admin.from("comments").insert({
    user_id: user.id,
    [targetColumn(target.type)]: target.id,
    body: body.trim(),
    parent_id: parentId,
  });

  if (error) return { error: error.message };

  const [{ url, ownerId }, { data: commenter }, { data: parentComment }] = await Promise.all([
    resolveTargetUrl(admin, target),
    admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    parentId
      ? admin.from("comments").select("user_id").eq("id", parentId).maybeSingle()
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
      url,
    });
  }

  if (ownerId && !notified.has(ownerId)) {
    notified.add(ownerId);
    await sendPushToUser(ownerId, {
      title: "Music Club",
      body: `${name}: ${preview}`,
      url,
    });
  }
}

export async function editComment(commentId: string, body: string): Promise<{ error: string } | void> {
  if (!body.trim()) return { error: "Comment cannot be empty." };
  if (body.trim().length > 150) return { error: "Comment must be 150 characters or less." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("comments")
    .update({ body: body.trim(), edited_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("id");

  if (error) return { error: "Failed to edit comment." };
  if (!updated?.length) return { error: "Comment not found." };
}

export async function deleteComment(commentId: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("id");

  if (error) return { error: "Failed to delete comment." };
  if (!updated?.length) return { error: "Comment not found." };
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

  const { data: comment } = await admin
    .from("comments")
    .select("user_id, post_id, album_post_id, deleted_at")
    .eq("id", commentId)
    .maybeSingle();
  if (!comment || comment.deleted_at) return { error: "Comment not found." };

  await admin.from("comment_likes").insert({ user_id: user.id, comment_id: commentId });

  if (comment.user_id === user.id) return;

  const target: CommentTarget = comment.post_id
    ? { type: "post", id: comment.post_id }
    : { type: "album_post", id: comment.album_post_id as string };
  const [{ url }, { data: liker }] = await Promise.all([
    resolveTargetUrl(admin, target),
    admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);

  const name = liker?.display_name ?? "Someone";
  await sendPushToUser(comment.user_id, {
    title: "Music Club",
    body: `${name} liked your comment`,
    url,
  });
}
