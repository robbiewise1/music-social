"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { SongResult } from "@/app/api/spotify/search/route";
import { recomputeUserStreak } from "@/lib/streaks.server";

export async function createPost(
  song: SongResult,
  caption: string,
  promptId?: string | null,
  promptType?: string | null
): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: songRow, error: songError } = await admin
    .from("songs")
    .upsert(
      {
        spotify_id: song.track_id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        album_art_url: song.album_art_url,
        spotify_url: song.track_url,
        preview_url: song.preview_url,
      },
      { onConflict: "spotify_id", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (songError || !songRow) return { error: "Failed to save song." };

  if (promptId) {
    const { data: existing, error: existingError } = await admin
      .from("posts")
      .select("id")
      .eq("user_id", user.id)
      .eq("prompt_id", promptId)
      .maybeSingle();

    if (existingError) return { error: "Failed to check for existing post." };

    if (existing) {
      const { error: updateError } = await admin
        .from("posts")
        .update({ song_id: songRow.id, caption: caption.trim() || null })
        .eq("id", existing.id);
      if (updateError) return { error: "Failed to update post." };
    } else {
      const { error: insertError } = await admin
        .from("posts")
        .insert({ user_id: user.id, song_id: songRow.id, caption: caption.trim() || null, prompt_id: promptId });
      if (insertError) return { error: "Failed to create post." };
    }
  } else {
    const { error: insertError } = await admin
      .from("posts")
      .insert({ user_id: user.id, song_id: songRow.id, caption: caption.trim() || null, prompt_id: null });
    if (insertError) return { error: "Failed to create post." };
  }

  await recomputeUserStreak(user.id);

  if (promptType === "song_of_the_day") redirect("/prompt/song-of-the-day");
  if (promptType === "daily_fun") redirect("/prompt/daily-fun");
  redirect("/feed");
}
