import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get Monday of the current week in EST
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
  const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysFromMonday);
  const activeDate = monday.toLocaleDateString("en-CA"); // YYYY-MM-DD

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("prompts")
    .select("id")
    .eq("prompt_type", "album_of_the_week")
    .eq("active_date", activeDate)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ seeded: false, reason: "already exists", activeDate });
  }

  const { error } = await admin.from("prompts").insert({
    title: "Album of the Week",
    description: "Share an album you've been listening to this week.",
    prompt_type: "album_of_the_week",
    active_date: activeDate,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ seeded: true, activeDate });
}
