"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { SongResult } from "@/app/api/spotify/search/route";

/** Returns the next Saturday as 'YYYY-MM-DD' (Eastern calendar). */
export function nextSaturday(todayEastern: string): string {
  const [y, m, d] = todayEastern.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun … 6=Sat
  const daysUntil = dayOfWeek === 6 ? 7 : 6 - dayOfWeek;
  const sat = new Date(Date.UTC(y, m - 1, d + daysUntil));
  return sat.toISOString().slice(0, 10);
}

export async function scheduleShabbosPost(
  song: SongResult,
  caption: string
): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  // Upsert song into shared cache (same pattern as createPost)
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

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
  });
  const targetDate = nextSaturday(today);

  // Guard: don't overwrite an already-published scheduled post
  const { data: existing } = await admin
    .from("scheduled_posts")
    .select("status")
    .eq("user_id", user.id)
    .eq("target_date", targetDate)
    .maybeSingle();

  if (existing?.status === "published") {
    return {
      error:
        "Your Shabbos song for this Saturday was already posted. You can edit the post directly.",
    };
  }

  const { error: scheduleError } = await admin.from("scheduled_posts").upsert(
    {
      user_id: user.id,
      song_id: songRow.id,
      target_date: targetDate,
      caption: caption.trim() || null,
      status: "pending",
      published_at: null,
    },
    { onConflict: "user_id,target_date" }
  );

  if (scheduleError) return { error: "Failed to schedule post." };

  redirect("/shabbos");
}

export async function cancelShabbosPost(
  targetDate: string
): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  const { error } = await admin
    .from("scheduled_posts")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("target_date", targetDate)
    .eq("status", "pending");

  if (error) return { error: "Failed to cancel scheduled post." };

  redirect("/shabbos");
}
