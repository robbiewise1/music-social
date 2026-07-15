import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PushPrompt } from "@/app/_components/push-prompt";
import { InstallPrompt } from "@/app/_components/install-prompt";
import { PromptCard } from "@/app/_components/prompt-card";
import { SparkleIcon } from "@/app/_components/music-icons";

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
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const thisWeek = getThisWeekMonday();
  const admin = createAdminClient();

  const [{ data: sotd }, { data: funPrompt }, { data: albumPrompt }, { data: streak }] = await Promise.all([
    admin.from("prompts").select("id, title, description").eq("active_date", today).eq("prompt_type", "song_of_the_day").maybeSingle(),
    admin.from("prompts").select("id, title, description").eq("active_date", today).eq("prompt_type", "daily_fun").maybeSingle(),
    admin.from("prompts").select("id, title, description").eq("active_date", thisWeek).eq("prompt_type", "album_of_the_week").maybeSingle(),
    admin.from("streaks").select("current_streak, last_post_date").eq("user_id", user.id).maybeSingle(),
  ]);

  const currentStreak = streak?.current_streak ?? 0;
  const postedToday = streak?.last_post_date === today;

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

      <div className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--color-accent)]/30 bg-gradient-to-br from-[var(--color-primary)]/18 via-[var(--color-accent)]/20 to-[var(--color-secondary)]/18 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
            <SparkleIcon className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
              Put Ons
              <span className="rounded-full bg-[var(--color-secondary)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                New
              </span>
            </p>
            <p className="max-w-md text-sm leading-relaxed text-[var(--color-text)]/80">
              Love a song you didn&apos;t know before? Tap <span className="font-medium">&ldquo;New to me&rdquo;</span> to credit the friend who put you on. The leaderboard now tracks who&apos;s putting people onto the most music — and who&apos;s discovering the most.
            </p>
          </div>
        </div>
      </div>

      <div className="relative mb-10 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-24 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[var(--color-primary)]/40 via-[var(--color-accent)]/45 to-[var(--color-secondary)]/40 blur-xl"
        />
        <p className="mb-2 text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
          {formatted}
        </p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-[var(--color-text)]">
          Today&apos;s prompts
        </h1>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-secondary)]/18 px-3 py-1 text-xs font-medium text-[var(--color-secondary-hover)]">
          {currentStreak > 0
            ? postedToday
              ? `🔥 ${currentStreak} day streak`
              : `🔥 ${currentStreak} day streak — post today to keep it alive!`
            : "Post a song today to start your streak!"}
        </p>
      </div>

      {isFriday && (
        <Link
          href="/shabbos"
          className="group mb-4 flex items-center justify-between rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-surface)] px-6 py-4 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-soft-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <div>
            <p className="mb-0.5 text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
              Shabbos Mode
            </p>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Schedule a song for tomorrow so your streak stays alive
            </p>
          </div>
          <span className="ml-4 shrink-0 text-lg text-[var(--color-text-muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]">
            →
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <PromptCard
          href="/prompt/song-of-the-day"
          category="song"
          label="Song of the Day"
          title="What are you listening to today?"
          count={sotdCount}
          itemNoun="song"
          cta="View songs →"
          className="min-h-48"
        />

        <PromptCard
          href="/prompt/daily-fun"
          category="fun"
          label="Prompt of the Day"
          title={funPrompt?.title ?? "Today's prompt"}
          description={funPrompt?.description}
          count={funCount}
          itemNoun="song"
          cta="View songs →"
          className="min-h-48"
        />
      </div>

      <PromptCard
        href="/prompt/album-of-the-week"
        category="album"
        label="Album of the Week"
        title={albumPrompt?.title ?? "What album are you loving this week?"}
        description={albumPrompt?.description}
        count={albumCount}
        itemNoun="album"
        cta="Open prompt →"
        className="w-full"
      />
    </main>
  );
}
