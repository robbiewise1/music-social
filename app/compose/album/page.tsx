import { createAdminClient } from "@/lib/supabase/admin";
import { AlbumComposeForm } from "./album-compose-form";

function getThisWeekMonday(): string {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const [yr, mo, dy] = todayStr.split("-").map(Number);
  const today = new Date(Date.UTC(yr, mo - 1, dy));
  const dayOfWeek = today.getUTCDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(Date.UTC(yr, mo - 1, dy + daysToMonday));
  return thisMonday.toISOString().split("T")[0];
}

export default async function AlbumComposePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt_id?: string }>;
}) {
  const { prompt_id } = await searchParams;
  const admin = createAdminClient();
  const thisWeek = getThisWeekMonday();

  const { data: prompt } = prompt_id
    ? await admin.from("prompts").select("id, title, description").eq("id", prompt_id).maybeSingle()
    : await admin.from("prompts").select("id, title, description").eq("active_date", thisWeek).eq("prompt_type", "album_of_the_week").maybeSingle();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-8">Post an album</h1>
      <AlbumComposeForm thisWeekPrompt={prompt ?? null} />
    </main>
  );
}
