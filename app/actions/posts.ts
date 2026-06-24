"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { SongResult } from "@/app/api/spotify/search/route";

export async function createPost(
  song: SongResult,
  caption: string
): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data: songRow, error: songError } = await supabase
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

  const { error: postError } = await supabase.from("posts").insert({
    user_id: user.id,
    song_id: songRow.id,
    caption: caption.trim() || null,
  });

  if (postError) return { error: "Failed to create post." };

  redirect("/feed");
}
