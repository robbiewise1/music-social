function SkeletonPost() {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-zinc-200 shrink-0" />
          <div className="h-3.5 w-24 rounded bg-zinc-200" />
          <div className="h-3 w-16 rounded bg-zinc-100" />
        </div>
        <div className="h-3 w-10 rounded bg-zinc-100" />
      </div>
      <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3">
        <div className="h-14 w-14 rounded bg-zinc-200 shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-3.5 w-36 rounded bg-zinc-200" />
          <div className="h-3 w-28 rounded bg-zinc-100" />
          <div className="h-3 w-20 rounded bg-zinc-100" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-50">
        <div className="h-3 w-8 rounded bg-zinc-100" />
      </div>
    </div>
  );
}

export default function FeedLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="space-y-4">
        <SkeletonPost />
        <SkeletonPost />
        <SkeletonPost />
      </div>
    </main>
  );
}
