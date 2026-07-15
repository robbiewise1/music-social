import { getAuthUser } from "@/lib/supabase/server";
import { MobileNavLinks } from "./mobile-nav-links";

export async function MobileNav() {
  const user = await getAuthUser();
  if (!user) return null;

  return <MobileNavLinks />;
}
