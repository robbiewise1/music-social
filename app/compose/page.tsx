import { createAdminClient } from "@/lib/supabase/admin";
import { ComposeForm } from "./compose-form";

export default async function ComposePage() {
  const today = new Date().toISOString().split("T")[0];
  const { data: prompt } = await createAdminClient()
    .from("prompts")
    .select("id, title, description")
    .eq("active_date", today)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8">New post</h1>
      <ComposeForm todayPrompt={prompt ?? null} />
    </main>
  );
}
