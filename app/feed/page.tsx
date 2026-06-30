import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PushPrompt } from "@/app/_components/push-prompt";
import { InstallPrompt } from "@/app/_components/install-prompt";

function getThisWeekMonday(): string {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const [yr, mo, dy] = todayStr.split("-").map(Number);
  const today = new Date(Date.UTC(yr, mo - 1, dy));
  const dayOfWeek = today.getUTCDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(Date.UTC(yr, mo - 1, dy + daysToMonday));
  return thisMonday.toISOString().split("T")[0];
}

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const thisWeek = getThisWeekMonday();
  const admin = createAdminClient();

  const [{ data: sotd }, { data: funPrompt }, { data: albumPrompt }] = await Promise.all([
    admin.from("prompts").select("id, title, description").eq("active_date", today).eq("prompt_type", "song_of_the_day").maybeSingle(),
    admin.from("prompts").select("id, title, description").eq("active_date", today).eq("prompt_type", "daily_fun").maybeSingle(),
    admin.from("prompts").select("id, title, description").eq("active_date", thisWeek).eq("prompt_type", "album_of_the_week").maybeSingle(),
  ]);

  const [sotdCountRes, funCountRes, albumCountRes] = await Promise.all([
    sotd
      ? admin.from("posts").select("id", { count: "exact", head: true }).eq("prompt_id", sotd.id)
      : Promise.resolve({ count: 0 }),
    funPrompt
      ? admin.from("posts").select("id", { count: "exact", head: true }).eq("prompt_id", funPrompt.id)
      : Promise.resolve({ count: 0 }),
    albumPrompt
      ? admin.from("album_posts").select("id", { count: "exact", head: true }).eq("prompt_id", albumPrompt.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const sotdCount = sotdCountRes.count ?? 0;
  const funCount = funCountRes.count ?? 0;
  const albumCount = albumCountRes.count ?? 0;

  const formatted = new Date(today + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const [ty, tm, td] = today.split("-").map(Number);
  const isFriday = new Date(Date.UTC(ty, tm - 1, td)).getUTCDay() === 5;

  return (
    <main className="w-full mx-auto max-w-2xl px-4 py-16">
      <InstallPrompt />
      <PushPrompt />
      <p className="text-xs text-zinc-400 mb-2 text-center uppercase tracking-widest">
        {formatted}
      </p>
      <h1 className="text-3xl font-bold text-zinc-900 mb-10 text-center">
        Today&apos;s prompts
      </h1>

      {isFriday && (
        <Link
          href="/shabbos"
          className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-6 py-4 mb-4 hover:border-zinc-400 hover:shadow-md transition-all"
        >
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-0.5">
              Shabbos Mode
            </p>
            <p className="text-sm font-semibold text-zinc-900">
              Schedule a song for tomorrow so your streak stays alive
            </p>
          </div>
          <span className="ml-4 text-zinc-300 group-hover:text-zinc-600 transition-colors text-lg shrink-0">
            →
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
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
              Prompt of the Day
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
                ? "No songs yet"
                : `${funCount} song${funCount === 1 ? "" : "s"} shared`}
            </p>
            <span className="text-zinc-300 group-hover:text-zinc-600 transition-colors text-lg">
              →
            </span>
          </div>
        </Link>
      </div>

      <Link
        href="/prompt/album-of-the-week"
        className="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-400 hover:shadow-md transition-all w-full"
      >
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">
            Album of the Week
          </p>
          <p className="text-lg font-semibold text-zinc-900 leading-snug">
            {albumPrompt?.title ?? "What album are you loving this week?"}
          </p>
          {albumPrompt?.description && (
            <p className="mt-1 text-sm text-zinc-500">{albumPrompt.description}</p>
          )}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            {albumCount === 0
              ? "No albums yet"
              : `${albumCount} album${albumCount === 1 ? "" : "s"} shared`}
          </p>
          <span className="text-zinc-300 group-hover:text-zinc-600 transition-colors text-lg">
            →
          </span>
        </div>
      </Link>
    </main>
  );
}
