import { type AlbumResult } from "@/app/api/itunes/album-search/route";

export function AlbumCard({
  album,
  selected,
  onSelect,
}: {
  album: AlbumResult;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        selected
          ? "border-[var(--color-primary)] bg-[var(--color-surface-tint)]"
          : "border-[var(--color-accent)]/18 hover:border-[var(--color-primary)]/40"
      }`}
    >
      {album.album_art_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={album.album_art_url}
          alt={album.title}
          width={48}
          height={48}
          className="rounded-md object-cover flex-shrink-0 w-12 h-12"
        />
      ) : (
        <div className="w-12 h-12 rounded-md bg-[var(--color-accent)]/20 flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-text)] truncate">{album.title}</p>
        <p className="text-xs text-[var(--color-text-muted)] truncate">{album.artist}</p>
      </div>
    </button>
  );
}
