import { describe, it, expect } from "vitest";
import { mapGenreToCategory, computeTopGenre } from "../genre-map";

describe("mapGenreToCategory", () => {
  it("maps rock-adjacent genres to rock", () => {
    expect(mapGenreToCategory("Rock")).toBe("rock");
    expect(mapGenreToCategory("Alternative")).toBe("rock");
    expect(mapGenreToCategory("Punk")).toBe("rock");
  });

  it("maps pop-adjacent genres to pop", () => {
    expect(mapGenreToCategory("Pop")).toBe("pop");
    expect(mapGenreToCategory("Dance")).toBe("pop");
  });

  it("maps hip-hop and R&B genres to hiphop_rnb", () => {
    expect(mapGenreToCategory("Hip-Hop/Rap")).toBe("hiphop_rnb");
    expect(mapGenreToCategory("R&B/Soul")).toBe("hiphop_rnb");
  });

  it("maps electronic-adjacent genres to electronic", () => {
    expect(mapGenreToCategory("Electronic")).toBe("electronic");
    expect(mapGenreToCategory("House")).toBe("electronic");
  });

  it("maps country/folk genres to country_folk", () => {
    expect(mapGenreToCategory("Country")).toBe("country_folk");
    expect(mapGenreToCategory("Singer/Songwriter")).toBe("country_folk");
  });

  it("maps jazz/classical-adjacent genres to jazz_classical", () => {
    expect(mapGenreToCategory("Jazz")).toBe("jazz_classical");
    expect(mapGenreToCategory("Classical")).toBe("jazz_classical");
    expect(mapGenreToCategory("Blues")).toBe("jazz_classical");
  });

  it("maps latin/world genres to latin_world", () => {
    expect(mapGenreToCategory("Latino")).toBe("latin_world");
    expect(mapGenreToCategory("Reggae")).toBe("latin_world");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(mapGenreToCategory("  rock  ")).toBe("rock");
    expect(mapGenreToCategory("HIP-HOP/RAP")).toBe("hiphop_rnb");
  });

  it("falls back to other for unrecognized genres", () => {
    expect(mapGenreToCategory("Christian & Gospel")).toBe("other");
    expect(mapGenreToCategory("Some Made Up Genre")).toBe("other");
  });

  it("falls back to other for null/undefined", () => {
    expect(mapGenreToCategory(null)).toBe("other");
    expect(mapGenreToCategory(undefined)).toBe("other");
  });
});

describe("computeTopGenre", () => {
  it("returns null for an empty list", () => {
    expect(computeTopGenre([])).toBeNull();
  });

  it("returns the only category for a single genre", () => {
    expect(computeTopGenre(["Rock"])).toBe("rock");
  });

  it("picks the clear majority regardless of input order", () => {
    const genres = ["Pop", "Rock", "Pop", "Pop", "Alternative"];
    expect(computeTopGenre(genres)).toBe("pop");
    expect(computeTopGenre([...genres].reverse())).toBe("pop");
  });

  it("breaks exact ties using the fixed canonical order", () => {
    // rock and pop both appear twice — rock wins since it comes first in
    // CATEGORY_ORDER, independent of which appeared first in the input.
    expect(computeTopGenre(["Pop", "Rock", "Pop", "Rock"])).toBe("rock");
  });

  it("prefers a real genre over other in a tie", () => {
    // "other" is checked last, so a tie against it always loses.
    expect(computeTopGenre(["Rock", "Some Made Up Genre"])).toBe("rock");
  });

  it("folds null/unmapped entries into the other bucket", () => {
    const genres = [null, "Christian & Gospel", undefined, "Comedy"];
    expect(computeTopGenre(genres)).toBe("other");
  });

  it("handles a large mixed history correctly", () => {
    const genres = [
      "Rock", "Rock", "Rock", "Rock",
      "Pop", "Pop",
      "Hip-Hop/Rap",
      "Jazz", "Classical",
      null,
    ];
    expect(computeTopGenre(genres)).toBe("rock");
  });
});
