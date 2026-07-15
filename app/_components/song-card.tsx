import type { SongResult } from "@/app/api/spotify/search/route";

type Props = {
  song: SongResult;
  onClick?: () => void;
  selected?: boolean;
};

export function SongCard({ song, onClick, selected }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
        onClick ? "cursor-pointer hover:bg-[var(--color-surface-tint)]" : "cursor-default"
      } ${selected ? "bg-[var(--color-surface-tint)] ring-1 ring-inset ring-[var(--color-accent)]/30" : ""}`}
    >
      {song.album_art_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={song.album_art_url}
          alt={song.album}
          width={48}
          height={48}
          className="shrink-0 rounded"
        />
      ) : (
        <div className="h-12 w-12 shrink-0 rounded bg-[var(--color-accent)]/20" />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--color-text)]">
          {song.title}
        </p>
        <p className="truncate text-sm text-[var(--color-text-muted)]">{song.artist}</p>
        <p className="truncate text-xs text-[var(--color-text-muted)]">{song.album}</p>
      </div>
    </button>
  );
}
