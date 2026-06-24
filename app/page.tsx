import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white px-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-zinc-900 mb-4">
        Music Club
      </h1>
      <p className="text-xl text-zinc-500 max-w-md mb-10">
        Share songs with friends. Respond to daily prompts. Discover what
        everyone&apos;s listening to.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="px-6 py-3 rounded-full bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded-full border border-zinc-200 text-zinc-900 font-medium hover:bg-zinc-50 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
