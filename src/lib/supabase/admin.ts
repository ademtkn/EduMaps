import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";

/**
 * Service-role client. It bypasses row level security, so it is used for exactly one thing:
 * turning a username into the email address Supabase Auth signs in with (`email_for_username`).
 * Never hand its results to the browser and never add other queries here.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (needed to sign in with a username).");
  return createSupabaseClient<Database>(supabaseEnv().url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** The email behind a username, or null. */
export async function emailForUsername(username: string): Promise<string | null> {
  try {
    const { data, error } = await createServiceClient().rpc("email_for_username", { p_username: username });
    return !error && typeof data === "string" && data ? data : null;
  } catch {
    // Missing server configuration and a failed lookup must never expose an address or crash the form.
    return null;
  }
}
