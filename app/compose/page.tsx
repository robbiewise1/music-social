import { createAdminClient } from "@/lib/supabase/admin";
import { ComposeForm } from "./compose-form";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt_id?: string }>;
}) {
  const { prompt_id } = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  const admin = createAdminClient();

  const { data: prompt } = prompt_id
    ? await admin
        .from("prompts")
        .select("id, title, description, prompt_type")
        .eq("id", prompt_id)
        .maybeSingle()
    : await admin
        .from("prompts")
        .select("id, title, description, prompt_type")
        .eq("active_date", today)
        .eq("prompt_type", "song_of_the_day")
        .maybeSingle();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">New post</h1>
      <ComposeForm todayPrompt={prompt ?? null} />
    </main>
  );
}
