import Link from "next/link";
import { InstallPrompt } from "./_components/install-prompt";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-surface)] px-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-[var(--color-text)] mb-4">
        Music Club
      </h1>
      <p className="text-xl text-[var(--color-text-muted)] max-w-md mb-10">
        Share songs with friends. Respond to daily prompts. Discover what
        everyone&apos;s listening to.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="px-6 py-3 rounded-full bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded-full border border-[var(--color-accent)]/18 text-[var(--color-text)] font-medium hover:bg-[var(--color-surface-tint)] transition-colors"
        >
          Sign in
        </Link>
      </div>
      <div className="mt-8 w-full max-w-sm text-left">
        <InstallPrompt />
      </div>
    </main>
  );
}
