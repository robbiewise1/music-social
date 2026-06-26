import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];
  const admin = createAdminClient();

  const [{ data: sotd }, { data: funPrompt }] = await Promise.all([
    admin
      .from("prompts")
      .select("id, title, description")
      .eq("active_date", today)
      .eq("prompt_type", "song_of_the_day")
      .maybeSingle(),
    admin
      .from("prompts")
      .select("id, title, description")
      .eq("active_date", today)
      .eq("prompt_type", "daily_fun")
      .maybeSingle(),
  ]);

  const [sotdCountRes, funCountRes] = await Promise.all([
    sotd
      ? admin
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("prompt_id", sotd.id)
      : Promise.resolve({ count: 0 }),
    funPrompt
      ? admin
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("prompt_id", funPrompt.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const sotdCount = sotdCountRes.count ?? 0;
  const funCount = funCountRes.count ?? 0;

  const formatted = new Date(today + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-xs text-zinc-400 mb-2 text-center uppercase tracking-widest">
        {formatted}
      </p>
      <h1 className="text-3xl font-bold text-zinc-900 mb-10 text-center">
        Today&apos;s prompts
      </h1>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/prompt/song-of-the-day"
          className="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-400 hover:shadow-md transition-all min-h-48"
        >
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">
              Song of the Day
            </p>
            <p className="text-lg font-semibold text-zinc-900 leading-snug">
              What are you listening to today?
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              {sotdCount === 0
                ? "No songs yet"
                : `${sotdCount} song${sotdCount === 1 ? "" : "s"} shared`}
            </p>
            <span className="text-zinc-300 group-hover:text-zinc-600 transition-colors text-lg">
              →
            </span>
          </div>
        </Link>

        <Link
          href="/prompt/daily-fun"
          className="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-400 hover:shadow-md transition-all min-h-48"
        >
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">
              Daily Prompt
            </p>
            <p className="text-lg font-semibold text-zinc-900 leading-snug">
              {funPrompt?.title ?? "Today's prompt"}
            </p>
            {funPrompt?.description && (
              <p className="mt-1 text-sm text-zinc-500">{funPrompt.description}</p>
            )}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              {funCount === 0
                ? "No responses yet"
                : `${funCount} response${funCount === 1 ? "" : "s"}`}
            </p>
            <span className="text-zinc-300 group-hover:text-zinc-600 transition-colors text-lg">
              →
            </span>
          </div>
        </Link>
      </div>
    </main>
  );
}
