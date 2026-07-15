function SkeletonUser() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--color-accent)]/12 bg-[var(--color-surface)] p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-[var(--color-accent)]/20 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 rounded bg-[var(--color-accent)]/20" />
          <div className="h-3 w-20 rounded bg-[var(--color-surface-tint)]" />
        </div>
      </div>
      <div className="h-7 w-16 rounded-full bg-[var(--color-surface-tint)]" />
    </div>
  );
}

export default function SearchLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="h-7 w-36 rounded bg-[var(--color-accent)]/20 mb-6 animate-pulse" />
      <div className="h-10 w-full rounded-lg bg-[var(--color-surface-tint)] mb-4 animate-pulse" />
      <div className="space-y-2">
        <SkeletonUser />
        <SkeletonUser />
        <SkeletonUser />
      </div>
    </main>
  );
}
