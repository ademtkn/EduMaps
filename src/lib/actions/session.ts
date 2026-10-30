import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Resolves the signed-in member for a server action, or null. Uses getUser() so the JWT is verified with Supabase. */
export async function getMember() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { supabase, user: data.user };
}
