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

  // Use INSERT + conditional UPDATE instead of a plain upsert so we never
  // blindly overwrite a 'published' row (TOCTOU: the Saturday cron could fire
  // between the old read-check and the write).
  const { error: insertError } = await admin.from("scheduled_posts").insert({
    user_id: user.id,
    song_id: songRow.id,
    target_date: targetDate,
    caption: caption.trim() || null,
    status: "pending",
  });

  if (!insertError) {
    // Fresh insert succeeded — done.
    redirect("/shabbos");
  }

  if (insertError.code !== "23505") {
    // Unexpected error (not a uniqueness conflict).
    return { error: "Failed to schedule post." };
  }

  // Row already exists — update it, but only if it hasn't been published yet.
  const { data: updated, error: updateError } = await admin
    .from("scheduled_posts")
    .update({
      song_id: songRow.id,
      caption: caption.trim() || null,
      status: "pending",
      published_at: null,
    })
    .eq("user_id", user.id)
    .eq("target_date", targetDate)
    .neq("status", "published")
    .select("id");

  if (updateError) return { error: "Failed to schedule post." };

  if (!updated?.length) {
    // 0 rows updated means the row exists but is already 'published'.
    return {
      error:
        "Your Shabbos song for this Saturday was already posted. You can edit the post directly from your profile.",
    };
  }

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

  const { data: updated, error } = await admin
    .from("scheduled_posts")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("target_date", targetDate)
    .eq("status", "pending")
    .select("id");

  if (error) return { error: "Failed to cancel scheduled post." };

  if (!updated?.length) {
    // 0 rows — cron already published or cancelled it.
    return {
      error: "Could not cancel — your post may have already been published.",
    };
  }

  redirect("/shabbos");
}
