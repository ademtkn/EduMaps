import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";

/**
 * Cookie-less anonymous client for public, cacheable pages (ISR). It can only see what the
 * anonymous role may see, so published content only. `fresh` bypasses the data cache (writes, counters).
 */
export function createPublicClient(options: { fresh?: boolean } = {}) {
  const { url, anonKey } = supabaseEnv();
  return createSupabaseClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) =>
        options.fresh
          ? fetch(input, { ...init, cache: "no-store" })
          : fetch(input, { ...init, next: { revalidate: 300, tags: ["public-data"] } }),
    },
  });
}
