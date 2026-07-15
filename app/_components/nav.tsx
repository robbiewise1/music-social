import { createClient, getAuthUser } from "@/lib/supabase/server";
import Link from "next/link";
import { VinylIcon } from "@/app/_components/music-icons";
import { NavLinks } from "@/app/_components/nav-links";

export async function Nav() {
  const user = await getAuthUser();

  let username: string | null = null;
  if (user) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-accent)]/20 bg-[var(--color-surface)]/90 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link
          href={user ? "/feed" : "/"}
          className="group flex items-center gap-1.5 rounded-md py-1 pr-1 font-semibold tracking-tight text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          <VinylIcon className="h-5 w-5 text-[var(--color-primary)] transition-transform duration-200 group-hover:rotate-45" />
          Music Club
        </Link>
        {user ? (
          <NavLinks username={username} />
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="rounded-md px-1 py-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              Sign up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
