import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
  }

  return (
    <header className="border-b border-zinc-100 bg-white sticky top-0 z-10">
      <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link
          href={user ? "/feed" : "/"}
          className="font-semibold text-zinc-900 tracking-tight"
        >
          Music Club
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link
                href="/leaderboard"
                className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
                Leaderboard
              </Link>
              {username && (
                <Link
                  href={`/profile/${username}`}
                  className="text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Profile
                </Link>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-zinc-900 px-4 py-1.5 text-white hover:bg-zinc-700 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
