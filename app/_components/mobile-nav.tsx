import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export async function MobileNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 border-t border-zinc-100 bg-white z-20">
      <div className="flex items-center justify-around px-4 py-2 pb-4">
        <Link
          href="/feed"
          className="flex flex-col items-center gap-1 px-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>
      </div>
    </nav>
  );
}
