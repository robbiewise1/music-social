import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeaderboardTabs } from "./leaderboard-tabs";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const easternFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoEastern = easternFormatter.format(threeDaysAgo);

  // Two separate ordered queries so neither "currently active" nor "all-time"
  // leaders are silently excluded by the other sort's LIMIT.
  // Current streak tab only shows users active in the last 3 days.
  const SELECT = "user_id, current_streak, longest_streak, last_post_date";
  const [byCurrentRes, byLongestRes] = await Promise.all([
    supabase
      .from("streaks")
      .select(SELECT)
      .gt("current_streak", 0)
      .gte("last_post_date", threeDaysAgoEastern)
      .order("current_streak", { ascending: false })
      .limit(50),
    supabase
      .from("streaks")
      .select(SELECT)
      .gt("longest_streak", 0)
      .order("longest_streak", { ascending: false })
      .limit(50),
  ]);

  // Merge, deduped by user_id (current first so it wins on overlap)
  const seen = new Set<string>();
  const streakRows = [...(byCurrentRes.data ?? []), ...(byLongestRes.data ?? [])].filter(
    (row) => {
      if (seen.has(row.user_id)) return false;
      seen.add(row.user_id);
      return true;
    }
  );

  // Fetch profiles separately to avoid relying on a FK relationship
  const userIds = streakRows.map((r) => r.user_id);
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", userIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  const entries = streakRows.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      userId: row.user_id as string,
      username: (profile?.username ?? "") as string,
      displayName: (profile?.display_name ?? "") as string,
      currentStreak: row.current_streak as number,
      longestStreak: row.longest_streak as number,
    };
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Leaderboard</h1>
      <p className="text-sm text-zinc-400 mb-8">
        Who&apos;s been posting every day?
      </p>
      <LeaderboardTabs entries={entries} currentUserId={user.id} />
    </main>
  );
}
