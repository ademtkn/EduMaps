import "server-only";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "admin" | "moderator";

/** Verifies the caller's role against the database on every admin action (never trusts the client). */
export async function requireRole(allowed: StaffRole[]) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.from("users").select("role,is_banned").eq("id", auth.user.id).maybeSingle();
  if (!data || data.is_banned || !allowed.includes(data.role as StaffRole)) return null;
  return { supabase, user: auth.user, role: data.role as StaffRole };
}
