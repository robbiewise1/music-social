import type { ReactElement } from "react";
import type { GenreCategory } from "@/lib/genre-map";

type IconProps = {
  className?: string;
};

/** Vinyl record — used as the wordmark mark and decorative accents. */
export function VinylIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="6.25" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" />
    </svg>
  );
}

/** Small waveform, used for the reminder / notification banner. */
export function WaveformIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 12h1.5M7 8v8M10.5 5v14M14 9v6M17.5 6v12M21 12h-.001"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Musical note, used as a small decorative element on cards. */
export function NoteIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M9 18V5.6a1 1 0 0 1 .78-.98l8-1.8A1 1 0 0 1 19 3.8V16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.5" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

/** Sparkle, used to flag new/social features. */
export function SparkleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 2.5 12.9 9l6.1 1.9-6.1 1.9L11 19.5 9.1 12.8 3 10.9 9.1 9 11 2.5Z" />
      <path d="M18.5 15.5 19.4 18l2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.5Z" opacity="0.7" />
    </svg>
  );
}

/** Lightning bolt — genre badge for the "rock" category. */
export function RockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13 2 7 13h4l-2 9 8-12h-5l2-8z" />
    </svg>
  );
}

/** Microphone — genre badge for the "pop" category. */
export function PopIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="3" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 11a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="9" y1="21" x2="15" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Headphones — genre badge for the "hip-hop/R&B" category. */
export function HipHopRnbIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** Pulse line — genre badge for the "electronic" category. */
export function ElectronicIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 12h3l2-6 3 12 2-9 2 3h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Acoustic guitar — genre badge for the "country/folk" category. */
export function CountryFolkIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <line x1="16" y1="3" x2="11.5" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="9" cy="18.5" r="3.3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="9.3" cy="17.8" r="1" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

/** Treble clef, used as the genre badge for the "jazz/classical" category. */
export function JazzClassicalIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M13 3c-2 1-3 3-2 5.5l2 5c1 2.5.5 4.5-1.5 5-1.5.4-2.8-.5-2.8-1.8 0-1 .8-1.7 1.8-1.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="13" y1="3" x2="13" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Globe — genre badge for the "latin/world" category. */
export function LatinWorldIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <ellipse cx="12" cy="12" rx="4" ry="9" stroke="currentColor" strokeWidth="1.6" />
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.5 7.5c3 1.5 12 1.5 15 0M4.5 16.5c3-1.5 12-1.5 15 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Fallback genre badge icon for the "other" category — reuses the plain note concept. */
export function OtherGenreIcon({ className }: IconProps) {
  return <NoteIcon className={className} />;
}

/** Looks up the genre badge icon component for a given genre category. */
export const GENRE_ICONS: Record<GenreCategory, (props: IconProps) => ReactElement> = {
  rock: RockIcon,
  pop: PopIcon,
  hiphop_rnb: HipHopRnbIcon,
  electronic: ElectronicIcon,
  country_folk: CountryFolkIcon,
  jazz_classical: JazzClassicalIcon,
  latin_world: LatinWorldIcon,
  other: OtherGenreIcon,
};
