"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function togglePutOn(
  postId: string,
  currentlyPutOn: boolean
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  if (currentlyPutOn) {
    await admin
      .from("put_ons")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
  } else {
    const { data: post } = await admin
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .maybeSingle();
    if (post?.user_id === user.id) return { error: "Can't put yourself on." };

    await admin.from("put_ons").insert({ user_id: user.id, post_id: postId });
  }

  revalidatePath("/leaderboard");
}
