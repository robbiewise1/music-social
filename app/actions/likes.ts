"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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
  }

  revalidatePath("/feed");
}
