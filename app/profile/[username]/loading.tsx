function SkeletonPost() {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-zinc-200 shrink-0" />
          <div className="h-3.5 w-24 rounded bg-zinc-200" />
        </div>
        <div className="h-3 w-10 rounded bg-zinc-100" />
      </div>
      <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3">
        <div className="h-14 w-14 rounded bg-zinc-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 rounded bg-zinc-200" />
          <div className="h-3 w-24 rounded bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}

export default function ProfileLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 animate-pulse">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-zinc-200 shrink-0" />
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-zinc-200" />
            <div className="h-3.5 w-24 rounded bg-zinc-100" />
            <div className="h-3 w-40 rounded bg-zinc-100 mt-1" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <SkeletonPost />
        <SkeletonPost />
        <SkeletonPost />
      </div>
    </main>
  );
}
