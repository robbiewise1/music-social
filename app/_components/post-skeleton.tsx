export function PostSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-accent)]/12 bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-[var(--color-accent)]/20 shrink-0" />
          <div className="h-3.5 w-24 rounded bg-[var(--color-accent)]/20" />
          <div className="h-3 w-16 rounded bg-[var(--color-surface-tint)]" />
        </div>
        <div className="h-3 w-10 rounded bg-[var(--color-surface-tint)]" />
      </div>
      <div className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-tint)] p-3">
        <div className="h-14 w-14 rounded bg-[var(--color-accent)]/20 shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-3.5 w-36 rounded bg-[var(--color-accent)]/20" />
          <div className="h-3 w-28 rounded bg-[var(--color-surface-tint)]" />
          <div className="h-3 w-20 rounded bg-[var(--color-surface-tint)]" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--color-accent)]/10">
        <div className="h-3 w-8 rounded bg-[var(--color-surface-tint)]" />
      </div>
    </div>
  );
}
