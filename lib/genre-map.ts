export type GenreCategory =
  | "rock"
  | "pop"
  | "hiphop_rnb"
  | "electronic"
  | "country_folk"
  | "jazz_classical"
  | "latin_world"
  | "other";

export const GENRE_CATEGORY_LABELS: Record<GenreCategory, string> = {
  rock: "Rock",
  pop: "Pop",
  hiphop_rnb: "Hip-Hop/R&B",
  electronic: "Electronic",
  country_folk: "Country/Folk",
  jazz_classical: "Jazz/Classical",
  latin_world: "Latin/World",
  other: "Other",
};

// Categories checked in this order when breaking a tie in computeTopGenre —
// keep "other" last so a real genre always wins a tie against the fallback.
const CATEGORY_ORDER: GenreCategory[] = [
  "rock",
  "pop",
  "hiphop_rnb",
  "electronic",
  "country_folk",
  "jazz_classical",
  "latin_world",
  "other",
];

// Keyed by lowercased iTunes `primaryGenreName`. Anything not listed here
// falls back to "other" (see mapGenreToCategory).
const GENRE_LOOKUP: Record<string, GenreCategory> = {
  rock: "rock",
  alternative: "rock",
  metal: "rock",
  punk: "rock",
  grunge: "rock",
  "indie rock": "rock",

  pop: "pop",
  dance: "pop",
  disco: "pop",
  "adult contemporary": "pop",
  teen: "pop",
  "k-pop": "pop",
  "j-pop": "pop",
  "french pop": "pop",
  "german pop": "pop",

  "hip-hop/rap": "hiphop_rnb",
  "hip hop/rap": "hiphop_rnb",
  "r&b/soul": "hiphop_rnb",
  urban: "hiphop_rnb",

  electronic: "electronic",
  house: "electronic",
  techno: "electronic",
  dubstep: "electronic",
  ambient: "electronic",

  country: "country_folk",
  folk: "country_folk",
  americana: "country_folk",
  bluegrass: "country_folk",
  "singer/songwriter": "country_folk",

  jazz: "jazz_classical",
  classical: "jazz_classical",
  blues: "jazz_classical",
  vocal: "jazz_classical",
  "easy listening": "jazz_classical",
  opera: "jazz_classical",
  "new age": "jazz_classical",

  latin: "latin_world",
  latino: "latin_world",
  world: "latin_world",
  reggae: "latin_world",
  reggaeton: "latin_world",
  afrobeats: "latin_world",
};

export function mapGenreToCategory(
  rawGenre: string | null | undefined
): GenreCategory {
  if (!rawGenre) return "other";
  return GENRE_LOOKUP[rawGenre.trim().toLowerCase()] ?? "other";
}

export type GenreCount = { category: GenreCategory; count: number };

/**
 * Compute a user's all-time top genre category from the raw iTunes genre
 * strings of their song posts. Pure function of the multiset of genres —
 * ties are broken by a fixed canonical order (see CATEGORY_ORDER), not by
 * recency, so the result never depends on post fetch/sort order.
 */
export function computeTopGenre(
  rawGenres: (string | null | undefined)[]
): GenreCategory | null {
  if (!rawGenres.length) return null;

  const counts = new Map<GenreCategory, number>();
  for (const raw of rawGenres) {
    const category = mapGenreToCategory(raw);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  let best: GenreCategory | null = null;
  let bestCount = -1;
  for (const category of CATEGORY_ORDER) {
    const count = counts.get(category) ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = category;
    }
  }

  return best;
}
