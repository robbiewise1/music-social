import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeaderboardTabs } from "./leaderboard-tabs";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Two separate ordered queries so neither "currently active" nor "all-time"
  // leaders are silently excluded by the other sort's LIMIT.
  const SELECT = "user_id, current_streak, longest_streak, profiles(username, display_name)";
  const [byCurrentRes, byLongestRes] = await Promise.all([
    supabase
      .from("streaks")
      .select(SELECT)
      .gt("current_streak", 0)
      .order("current_streak", { ascending: false })
      .limit(50),
    supabase
      .from("streaks")
      .select(SELECT)
      .gt("longest_streak", 0)
      .order("longest_streak", { ascending: false })
      .limit(50),
  ]);

  // Merge, keeping the first occurrence of each user (dedup by user_id)
  const seen = new Set<string>();
  const entries = [...(byCurrentRes.data ?? []), ...(byLongestRes.data ?? [])]
    .filter((row) => {
      if (seen.has(row.user_id)) return false;
      seen.add(row.user_id);
      return true;
    })
    .map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
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
