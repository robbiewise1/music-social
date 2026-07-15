import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { NoteIcon, VinylIcon, WaveformIcon } from "@/app/_components/music-icons";

type Category = "song" | "fun" | "album";

const ACCENT: Record<Category, { var: string; Icon: (props: { className?: string }) => ReactNode }> = {
  song: { var: "--color-song", Icon: VinylIcon },
  fun: { var: "--color-fun", Icon: NoteIcon },
  album: { var: "--color-album", Icon: WaveformIcon },
};

type Props = {
  href: string;
  category: Category;
  label: string;
  title: string;
  description?: string | null;
  count: number;
  itemNoun: string;
  cta: string;
  className?: string;
};

export function PromptCard({
  href,
  category,
  label,
  title,
  description,
  count,
  itemNoun,
  cta,
  className = "",
}: Props) {
  const { var: colorVar, Icon } = ACCENT[category];
  const color = `var(${colorVar})`;

  return (
    <Link
      href={href}
      style={{ "--card-accent": color } as CSSProperties}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-accent)]/15 bg-[var(--color-surface)] p-6 pt-7 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--card-accent)]/40 hover:shadow-[var(--shadow-soft-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--card-accent)] focus-visible:ring-offset-2 ${className}`}
    >
      <span
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ backgroundColor: "var(--card-accent)" }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--card-accent)" }}
        >
          {label}
        </p>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: "linear-gradient(135deg, color-mix(in oklab, var(--card-accent) 38%, transparent), color-mix(in oklab, var(--card-accent) 16%, transparent))",
            color: "var(--card-accent)",
          }}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-2">
        <p className="text-lg font-semibold leading-snug text-[var(--color-text)]">
          {title}
        </p>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text)]">
          {count === 0 ? `No ${itemNoun}s yet` : `${count} ${itemNoun}${count === 1 ? "" : "s"} shared`}
        </p>
        <span
          className="flex items-center gap-1 text-sm font-medium transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: "var(--card-accent)" }}
        >
          {cta}
        </span>
      </div>
    </Link>
  );
}
