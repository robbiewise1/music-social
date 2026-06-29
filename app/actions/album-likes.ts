"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendPushToUser } from "@/lib/push";

export async function toggleAlbumLike(
  albumPostId: string,
  currentlyLiked: boolean
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  if (currentlyLiked) {
    await admin
      .from("album_post_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("album_post_id", albumPostId);
  } else {
    await admin.from("album_post_likes").insert({ user_id: user.id, album_post_id: albumPostId });

    const [{ data: post }, { data: liker }] = await Promise.all([
      admin.from("album_posts").select("user_id").eq("id", albumPostId).maybeSingle(),
      admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    ]);

    if (post?.user_id && post.user_id !== user.id) {
      const name = liker?.display_name ?? "Someone";
      await sendPushToUser(post.user_id, {
        title: "Music Club",
        body: `${name} liked your album`,
        url: "/prompt/album-of-the-week",
      });
    }
  }

  revalidatePath("/prompt/album-of-the-week");
}
