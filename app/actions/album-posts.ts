"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { AlbumResult } from "@/app/api/itunes/album-search/route";

export async function createAlbumPost(
  album: AlbumResult,
  caption: string,
  promptId?: string | null
): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: albumRow, error: albumError } = await admin
    .from("albums")
    .upsert(
      {
        itunes_collection_id: album.collection_id,
        title: album.title,
        artist: album.artist,
        album_art_url: album.album_art_url,
        apple_music_url: album.apple_music_url,
      },
      { onConflict: "itunes_collection_id", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (albumError || !albumRow) return { error: "Failed to save album." };

  if (promptId) {
    const { data: existing } = await admin
      .from("album_posts")
      .select("id")
      .eq("user_id", user.id)
      .eq("prompt_id", promptId)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await admin
        .from("album_posts")
        .update({ album_id: albumRow.id, caption: caption.trim() || null })
        .eq("id", existing.id);
      if (updateError) return { error: "Failed to update post." };
    } else {
      const { error: insertError } = await admin
        .from("album_posts")
        .insert({ user_id: user.id, album_id: albumRow.id, caption: caption.trim() || null, prompt_id: promptId });
      if (insertError) return { error: "Failed to create post." };
    }
  } else {
    const { error: insertError } = await admin
      .from("album_posts")
      .insert({ user_id: user.id, album_id: albumRow.id, caption: caption.trim() || null, prompt_id: null });
    if (insertError) return { error: "Failed to create post." };
  }

  redirect("/prompt/album-of-the-week");
}
