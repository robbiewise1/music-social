/** Returns the next Saturday as 'YYYY-MM-DD' given an Eastern calendar date string. */
export function nextSaturday(todayEastern: string): string {
  const [y, m, d] = todayEastern.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun … 6=Sat
  const daysUntil = dayOfWeek === 6 ? 7 : 6 - dayOfWeek;
  const sat = new Date(Date.UTC(y, m - 1, d + daysUntil));
  return sat.toISOString().slice(0, 10);
}
