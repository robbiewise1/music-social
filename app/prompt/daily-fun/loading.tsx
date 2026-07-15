import { PostSkeleton } from "@/app/_components/post-skeleton";

export default function DailyFunLoading() {
  return (
    <main className="w-full mx-auto max-w-2xl px-4 py-10 animate-pulse">
      <div className="h-3 w-16 rounded bg-zinc-100 mb-8" />

      <div className="flex gap-2 mb-10">
        <div className="h-9 w-36 rounded-full bg-zinc-200" />
        <div className="h-9 w-36 rounded-full bg-zinc-100" />
      </div>

      <div className="h-3 w-40 rounded bg-zinc-100 mb-2" />
      <div className="h-7 w-72 rounded bg-zinc-200 mb-8" />

      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </main>
  );
}
