import { createClient, getAuthUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { LeaderboardTabs } from "./leaderboard-tabs";

export default async function LeaderboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const admin = createAdminClient();

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
  const [byCurrentRes, byLongestRes, putOnsRes] = await Promise.all([
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
    admin.from("put_ons").select("user_id, post_id").limit(5000),
  ]);

  // Merge streak rows, deduped by user_id (current first so it wins on overlap)
  const seen = new Set<string>();
  const streakRows = [...(byCurrentRes.data ?? []), ...(byLongestRes.data ?? [])].filter(
    (row) => {
      if (seen.has(row.user_id)) return false;
      seen.add(row.user_id);
      return true;
    }
  );

  // Fetch profiles for streak entries
  const streakUserIds = streakRows.map((r) => r.user_id);
  const { data: streakProfiles } = streakUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", streakUserIds)
    : { data: [] };

  const profileMap = new Map(
    (streakProfiles ?? []).map((p) => [p.id, p])
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

  // Build put-on leaderboards from raw put_ons rows
  const allPutOns = (putOnsRes.data ?? []) as { user_id: string; post_id: string }[];

  // "Most Music Discovered": count by the person who clicked put me on (user_id)
  const discoveredMap = new Map<string, number>();
  for (const row of allPutOns) {
    discoveredMap.set(row.user_id, (discoveredMap.get(row.user_id) ?? 0) + 1);
  }

  // "Most Put Ons Received": need the post owner's user_id
  const uniquePostIds = [...new Set(allPutOns.map((r) => r.post_id))];
  const { data: postOwnerRows } = uniquePostIds.length
    ? await admin.from("posts").select("id, user_id").in("id", uniquePostIds)
    : { data: [] };

  const postOwnerMap = new Map((postOwnerRows ?? []).map((p) => [p.id as string, p.user_id as string]));

  const receivedMap = new Map<string, number>();
  for (const row of allPutOns) {
    const ownerId = postOwnerMap.get(row.post_id);
    if (ownerId) receivedMap.set(ownerId, (receivedMap.get(ownerId) ?? 0) + 1);
  }

  // Fetch profiles for all put-on participants
  const putOnUserIds = [...new Set([...receivedMap.keys(), ...discoveredMap.keys()])];
  const { data: putOnProfiles } = putOnUserIds.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", putOnUserIds)
    : { data: [] };

  const putOnProfileMap = new Map((putOnProfiles ?? []).map((p) => [p.id as string, p]));

  function topEntries(countMap: Map<string, number>) {
    const sorted = [...countMap.entries()]
      .map(([userId, count]) => {
        const profile = putOnProfileMap.get(userId);
        return {
          userId,
          username: (profile?.username ?? "") as string,
          displayName: (profile?.display_name ?? "") as string,
          count,
        };
      })
      .sort((a, b) => b.count - a.count);
    const cutoff = sorted[4]?.count ?? 0;
    return sorted.filter((e) => e.count >= cutoff);
  }

  const topPutOns = topEntries(receivedMap);
  const topDiscoverers = topEntries(discoveredMap);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Leaderboard</h1>
      <p className="text-sm text-zinc-400 mb-8">
        Who&apos;s been posting every day?
      </p>
      <LeaderboardTabs
        entries={entries}
        currentUserId={user.id}
        topPutOns={topPutOns}
        topDiscoverers={topDiscoverers}
      />
    </main>
  );
}
