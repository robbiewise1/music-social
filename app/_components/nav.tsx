import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
                href="/search"
                className="text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Find people
              </Link>
              <Link
                href="/compose"
                className="text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                + Post
              </Link>
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
