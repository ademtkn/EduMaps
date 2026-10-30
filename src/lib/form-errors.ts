import type { Dictionary } from "@/lib/i18n/get-dictionary";

/** Translates a validation/action error code into the visitor's language. */
export function errorText(dict: Dictionary, code?: string): string | undefined {
  if (!code) return undefined;
  const map = dict.errors as Record<string, string>;
  return map[code] ?? map.invalid;
}
