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
