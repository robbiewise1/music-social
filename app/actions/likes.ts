"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendPushToUser } from "@/lib/push";

export async function toggleLike(
  postId: string,
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
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
  } else {
    await admin.from("likes").insert({ user_id: user.id, post_id: postId });

    const [{ data: post }, { data: liker }] = await Promise.all([
      admin.from("posts").select("user_id").eq("id", postId).maybeSingle(),
      admin.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    ]);

    if (post?.user_id && post.user_id !== user.id) {
      const name = liker?.display_name ?? "Someone";
      await sendPushToUser(post.user_id, {
        title: "Music Club",
        body: `${name} liked your song`,
        url: "/feed",
      });
    }
  }

  revalidatePath("/feed");
}
