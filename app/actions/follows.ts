"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function followUser(
  followingId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await createAdminClient().from("follows").insert({
    follower_id: user.id,
    following_id: followingId,
  });

  if (error) return { error: "Failed to follow." };
  revalidatePath("/search");
  revalidatePath("/feed");
  return {};
}

export async function unfollowUser(
  followingId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await createAdminClient()
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) return { error: "Failed to unfollow." };
  revalidatePath("/search");
  revalidatePath("/feed");
  return {};
}
