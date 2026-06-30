import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { LeaderboardTabs } from "./leaderboard-tabs";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("streaks")
    .select(
      "user_id, current_streak, longest_streak, profiles(username, display_name)"
    )
    .gt("longest_streak", 0)
    .order("current_streak", { ascending: false })
    .limit(100);

  const entries = (rows ?? []).map((row) => {
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
