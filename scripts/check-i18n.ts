/**
 * Verifies that every dictionary has exactly the same keys and the same {placeholders} as English.
 *   npm run test:i18n
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const dir = path.resolve(process.cwd(), "src/lib/i18n/dictionaries");
const load = (code: string) => JSON.parse(readFileSync(path.join(dir, `${code}.json`), "utf8")) as Record<string, unknown>;

function flatten(obj: Record<string, unknown>, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") for (const [k, v] of flatten(value as Record<string, unknown>, full)) out.set(k, v);
    else out.set(full, String(value));
  }
  return out;
}
const placeholders = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!))].sort().join(",");

const base = flatten(load("en"));
let problems = 0;
for (const code of ["kg", "ru"]) {
  const other = flatten(load(code));
  for (const key of base.keys()) {
    if (!other.has(key)) { console.log(`[${code}] missing key: ${key}`); problems++; }
    else if (placeholders(base.get(key)!) !== placeholders(other.get(key)!)) { console.log(`[${code}] placeholder mismatch: ${key}`); problems++; }
    else if (other.get(key)!.trim() === "") { console.log(`[${code}] empty: ${key}`); problems++; }
  }
  for (const key of other.keys()) if (!base.has(key)) { console.log(`[${code}] extra key: ${key}`); problems++; }
  const identical = [...base].filter(([k, v]) => other.get(k) === v && /[A-Za-z]{4,}/.test(v) && !/^(Cambridge|Wi-Fi|EduMaps\.kg|IB.*|Line\.kg)$/.test(v) && !k.startsWith("meta.siteName"));
  if (identical.length) console.log(`[${code}] ${identical.length} strings identical to English (untranslated?): ${identical.slice(0, 5).map(([k]) => k).join(", ")}`);
}
console.log(problems === 0 ? `i18n OK (${base.size} keys × 3 languages)` : `${problems} problem(s)`);
process.exit(problems === 0 ? 0 : 1);
