export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastPostDate: string | null; // 'YYYY-MM-DD' in Eastern time, null if no posts
};

/** Days between two 'YYYY-MM-DD' strings. Positive when a > b. */
function dateDiffDays(a: string, b: string): number {
  const parse = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(a) - parse(b)) / 86_400_000);
}

/**
 * Compute streak data from UTC ISO post timestamps.
 * Day boundaries use Eastern time (America/Toronto, DST-aware via Intl).
 * Pass `now` to make tests deterministic.
 */
export function computeStreak(
  postTimestamps: string[],
  now: Date = new Date()
): StreakData {
  if (!postTimestamps.length) {
    return { currentStreak: 0, longestStreak: 0, lastPostDate: null };
  }

  const toEasternDate = (ts: string) =>
    new Date(ts).toLocaleDateString("en-CA", { timeZone: "America/Toronto" });

  // Distinct Eastern calendar dates, sorted descending
  const dates = [...new Set(postTimestamps.map(toEasternDate))].sort().reverse();

  // Walk dates finding consecutive runs. dates[0] is most recent, so runs[0]
  // will be the length of the run that contains the most recent post date.
  const runs: number[] = [];
  let runLen = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dateDiffDays(dates[i - 1], dates[i]) === 1) {
      runLen++;
    } else {
      runs.push(runLen);
      runLen = 1;
    }
  }
  runs.push(runLen);

  const longestStreak = Math.max(...runs);

  const today = now.toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
  const [ty, tm, td] = today.split("-").map(Number);
  const yesterday = new Date(Date.UTC(ty, tm - 1, td - 1)).toISOString().slice(0, 10);

  // Streak is live only if the most recent post was today or yesterday.
  // If the user missed a full calendar day, streak resets to 0 (longest is preserved).
  const currentStreak =
    dates[0] === today || dates[0] === yesterday ? runs[0] : 0;

  return { currentStreak, longestStreak, lastPostDate: dates[0] };
}
