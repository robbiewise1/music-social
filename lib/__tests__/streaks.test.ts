import { describe, it, expect } from "vitest";
import { computeStreak } from "../streaks";

// All test posts use 16:00 UTC = noon EDT — safely within the Eastern day in all seasons.
const post = (date: string) => `${date}T16:00:00.000Z`;
const at = (date: string) => new Date(`${date}T16:00:00.000Z`);

describe("computeStreak", () => {
  it("returns zeros and null for an empty post list", () => {
    expect(computeStreak([])).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastPostDate: null,
    });
  });

  it("counts a single post today as a streak of 1", () => {
    const today = "2026-06-29";
    expect(computeStreak([post(today)], at(today))).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastPostDate: today,
    });
  });

  it("counts a single post yesterday as streak of 1 (still active)", () => {
    expect(computeStreak([post("2026-06-28")], at("2026-06-29"))).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastPostDate: "2026-06-28",
    });
  });

  it("resets current streak to 0 when last post was 2+ days ago", () => {
    const result = computeStreak([post("2026-06-27")], at("2026-06-29"));
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(1);
    expect(result.lastPostDate).toBe("2026-06-27");
  });

  it("counts 3 consecutive days ending today", () => {
    const result = computeStreak(
      [post("2026-06-27"), post("2026-06-28"), post("2026-06-29")],
      at("2026-06-29")
    );
    expect(result).toEqual({
      currentStreak: 3,
      longestStreak: 3,
      lastPostDate: "2026-06-29",
    });
  });

  it("counts 3 consecutive days ending yesterday", () => {
    const result = computeStreak(
      [post("2026-06-26"), post("2026-06-27"), post("2026-06-28")],
      at("2026-06-29")
    );
    expect(result).toEqual({
      currentStreak: 3,
      longestStreak: 3,
      lastPostDate: "2026-06-28",
    });
  });

  it("preserves longest streak after a missed day", () => {
    const result = computeStreak(
      [
        post("2026-06-10"), post("2026-06-11"), post("2026-06-12"),
        post("2026-06-13"), post("2026-06-14"),
        // gap — missed June 15–28
        post("2026-06-29"),
      ],
      at("2026-06-29")
    );
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(5);
  });

  it("deduplicates multiple posts on the same day", () => {
    const today = "2026-06-29";
    const result = computeStreak(
      [post(today), post(today), post(today)],
      at(today)
    );
    expect(result).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastPostDate: today,
    });
  });

  it("handles posts arriving in random order", () => {
    const result = computeStreak(
      [post("2026-06-29"), post("2026-06-27"), post("2026-06-28")],
      at("2026-06-29")
    );
    expect(result).toEqual({
      currentStreak: 3,
      longestStreak: 3,
      lastPostDate: "2026-06-29",
    });
  });

  it("finds the longest streak even when it is not the current one", () => {
    const result = computeStreak(
      [
        // 7-day run in the past
        post("2026-06-01"), post("2026-06-02"), post("2026-06-03"),
        post("2026-06-04"), post("2026-06-05"), post("2026-06-06"), post("2026-06-07"),
        // gap
        // current 2-day run
        post("2026-06-28"), post("2026-06-29"),
      ],
      at("2026-06-29")
    );
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(7);
  });

  it("assigns posts near midnight to the correct Eastern day", () => {
    // 2026-06-29T02:00Z = June 28 at 10pm EDT — Eastern date is June 28
    const result = computeStreak(
      ["2026-06-29T02:00:00.000Z"],
      at("2026-06-29") // now = June 29 Eastern
    );
    expect(result.currentStreak).toBe(1); // June 28 = yesterday → still active
    expect(result.lastPostDate).toBe("2026-06-28");
  });

  it("handles a long multi-gap history correctly", () => {
    const result = computeStreak(
      [
        post("2026-01-01"), post("2026-01-02"), post("2026-01-03"), // run of 3
        // gap
        post("2026-02-10"), post("2026-02-11"), post("2026-02-12"),
        post("2026-02-13"), post("2026-02-14"), // run of 5
        // gap
        post("2026-06-28"), post("2026-06-29"), // run of 2, active
      ],
      at("2026-06-29")
    );
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5);
    expect(result.lastPostDate).toBe("2026-06-29");
  });
});
