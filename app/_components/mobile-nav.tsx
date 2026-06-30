import { createClient } from "@/lib/supabase/server";
import { MobileNavLinks } from "./mobile-nav-links";

export async function MobileNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return <MobileNavLinks />;
}
