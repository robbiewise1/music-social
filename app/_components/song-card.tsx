import Image from "next/image";
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
        onClick ? "cursor-pointer hover:bg-zinc-50" : "cursor-default"
      } ${selected ? "bg-zinc-100 ring-1 ring-inset ring-zinc-300" : ""}`}
    >
      {song.album_art_url ? (
        <Image
          src={song.album_art_url}
          alt={song.album}
          width={48}
          height={48}
          className="shrink-0 rounded"
        />
      ) : (
        <div className="h-12 w-12 shrink-0 rounded bg-zinc-200" />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900">
          {song.title}
        </p>
        <p className="truncate text-sm text-zinc-500">{song.artist}</p>
        <p className="truncate text-xs text-zinc-400">{song.album}</p>
      </div>
    </button>
  );
}
