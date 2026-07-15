import { PostSkeleton } from "@/app/_components/post-skeleton";

export default function AlbumOfTheWeekLoading() {
  return (
    <main className="w-full mx-auto max-w-2xl px-4 py-10 animate-pulse">
      <div className="h-3 w-16 rounded bg-[var(--color-surface-tint)] mb-8" />

      <div className="h-3 w-40 rounded bg-[var(--color-surface-tint)] mb-2" />
      <div className="h-7 w-72 rounded bg-[var(--color-accent)]/20 mb-8" />

      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </main>
  );
}
