function SkeletonUser() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-zinc-200 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 rounded bg-zinc-200" />
          <div className="h-3 w-20 rounded bg-zinc-100" />
        </div>
      </div>
      <div className="h-7 w-16 rounded-full bg-zinc-100" />
    </div>
  );
}

export default function SearchLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="h-7 w-36 rounded bg-zinc-200 mb-6 animate-pulse" />
      <div className="h-10 w-full rounded-lg bg-zinc-100 mb-4 animate-pulse" />
      <div className="space-y-2">
        <SkeletonUser />
        <SkeletonUser />
        <SkeletonUser />
      </div>
    </main>
  );
}
