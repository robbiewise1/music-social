"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

export type AlbumReply = {
  id: string;
  body: string;
  created_at: string;
  profiles: { display_name: string; username: string } | null;
};

export async function fetchAlbumReplies(albumPostId: string): Promise<AlbumReply[] | { error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("album_post_comments")
    .select("id, body, created_at, profiles(display_name, username)")
    .eq("album_post_id", albumPostId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return (data ?? []) as unknown as AlbumReply[];
}

export async function addAlbumReply(
  albumPostId: string,
  body: string
): Promise<{ error: string } | void> {
  if (!body.trim()) return { error: "Reply cannot be empty." };
  if (body.trim().length > 150) return { error: "Reply must be 150 characters or less." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("album_post_comments")
    .insert({ user_id: user.id, album_post_id: albumPostId, body: body.trim() });

  if (error) return { error: error.message };

  const [{ data: post }, { data: commenter }] = await Promise.all([
    admin.from("album_posts").select("user_id").eq("id", albumPostId).maybeSingle(),
    admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);

  if (post?.user_id && post.user_id !== user.id) {
    const name = commenter?.display_name ?? "Someone";
    const preview = body.trim().length > 60 ? body.trim().slice(0, 57) + "…" : body.trim();
    await sendPushToUser(post.user_id, {
      title: "Music Club",
      body: `${name}: ${preview}`,
      url: "/prompt/album-of-the-week",
    });
  }
}
