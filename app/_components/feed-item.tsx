import Link from "next/link";
import { LikeButton } from "./like-button";
import { CommentThread } from "./comment-thread";
import { PutMeOnButton } from "./put-me-on-button";
import { GENRE_ICONS } from "./music-icons";
import { GENRE_CATEGORY_LABELS, mapGenreToCategory } from "@/lib/genre-map";

export type FeedPost = {
  id: string;
  caption: string | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  songs: {
    title: string;
    artist: string;
    album: string;
    album_art_url: string | null;
    spotify_url: string;
    genre?: string | null;
  } | null;
  prompt?: {
    title: string;
    active_date: string;
  } | null;
  likeCount?: number;
  isLiked?: boolean;
  likers?: string[];
  replyCount?: number;
  putOnCount?: number;
  isPutOn?: boolean;
  putOners?: string[];
  isOwnPost?: boolean;
  currentUserId?: string | null;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const tz = { timeZone: "America/New_York" };
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...tz });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", ...tz });
  return `${date} · ${time}`;
}

export function FeedItem({ post }: { post: FeedPost }) {
  const { profiles: profile, songs: song } = post;
  const songGenre = song?.genre ? mapGenreToCategory(song.genre) : null;
  const GenreIcon = songGenre ? GENRE_ICONS[songGenre] : null;

  return (
    <article className="rounded-xl border border-[var(--color-accent)]/12 bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3 gap-2">
        <Link
          href={`/profile/${profile?.username}`}
          className="flex flex-1 min-w-0 flex-wrap items-center gap-x-2 gap-y-1 hover:opacity-80 transition-opacity"
        >
          <div className="h-7 w-7 rounded-full bg-[var(--color-accent)]/20 shrink-0" />
          <span className="text-sm font-medium text-[var(--color-text)] truncate">
            {profile?.display_name ?? profile?.username ?? "Unknown"}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] truncate">@{profile?.username}</span>
        </Link>
        <span className="text-xs text-[var(--color-text-muted)] shrink-0">{formatDate(post.created_at)}</span>
      </div>

      {post.prompt && (
        <Link
          href={`/prompt/${post.prompt.active_date}`}
          className="inline-flex items-center gap-1 mb-3 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          <span className="text-[var(--color-text-muted)]">▶</span>
          {post.prompt.title}
        </Link>
      )}

      {song && (
        <a
          href={song.spotify_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-tint)] p-3 hover:bg-[var(--color-surface-tint)] transition-colors group"
        >
          {song.album_art_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={song.album_art_url}
              alt={song.album}
              width={56}
              height={56}
              className="shrink-0 rounded"
            />
          ) : (
            <div className="h-14 w-14 shrink-0 rounded bg-[var(--color-accent)]/20" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--color-text)]">
              {song.title}
            </p>
            <p className="truncate text-sm text-[var(--color-text-muted)]">{song.artist}</p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">{song.album}</p>
            {GenreIcon && songGenre && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                <GenreIcon className="h-3 w-3 shrink-0" />
                {GENRE_CATEGORY_LABELS[songGenre]}
              </span>
            )}
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      )}

      {post.caption && (
        <p className="mt-3 whitespace-pre-line text-sm text-[var(--color-text)]">{post.caption}</p>
      )}

      <div className="mt-3 pt-3 border-t border-[var(--color-accent)]/10 flex items-start gap-5">
        <LikeButton
          postId={post.id}
          initialLiked={post.isLiked ?? false}
          initialCount={post.likeCount ?? 0}
          initialLikers={post.likers ?? []}
        />
        <CommentThread
          target={{ type: "post", id: post.id }}
          initialCount={post.replyCount ?? 0}
          currentUserId={post.currentUserId ?? null}
        />
        <PutMeOnButton
          postId={post.id}
          initialPutOn={post.isPutOn ?? false}
          initialCount={post.putOnCount ?? 0}
          initialPutOners={post.putOners ?? []}
          readOnly={post.isOwnPost ?? false}
        />
      </div>
    </article>
  );
}
