export default function FeedLoading() {
  return (
    <main className="w-full mx-auto max-w-2xl px-4 py-16 animate-pulse">
      <div className="mb-6 h-20 rounded-2xl bg-[var(--color-surface-tint)]" />

      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="h-3 w-32 rounded bg-[var(--color-surface-tint)]" />
        <div className="h-8 w-56 rounded bg-[var(--color-surface-tint)]" />
        <div className="h-6 w-40 rounded-full bg-[var(--color-surface-tint)]" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="min-h-48 rounded-2xl border border-[var(--color-accent)]/10 bg-[var(--color-surface-tint)]" />
        <div className="min-h-48 rounded-2xl border border-[var(--color-accent)]/10 bg-[var(--color-surface-tint)]" />
      </div>

      <div className="h-48 w-full rounded-2xl border border-[var(--color-accent)]/10 bg-[var(--color-surface-tint)]" />
    </main>
  );
}
