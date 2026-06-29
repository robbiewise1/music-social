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
          ? "border-zinc-900 bg-zinc-50"
          : "border-zinc-200 hover:border-zinc-400"
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
        <div className="w-12 h-12 rounded-md bg-zinc-200 flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">{album.title}</p>
        <p className="text-xs text-zinc-500 truncate">{album.artist}</p>
      </div>
    </button>
  );
}
