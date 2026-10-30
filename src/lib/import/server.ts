import "server-only";
import { SCHOOL_WITH_CHILDREN, toFormValues } from "@/lib/admin-school-values";
import type { createClient } from "@/lib/supabase/server";
import { parseCsv } from "./csv";
import { assemble, changedFields, MAX_BYTES, norm, overlay, readRow, readTable, type ImportDefaults, type Lookups, type Named } from "./schools";

type Db = Awaited<ReturnType<typeof createClient>>;
type NameJson = { kg?: string; ru?: string; en?: string } | null;
const names = (n: NameJson) => [n?.en, n?.ru, n?.kg].filter((x): x is string => Boolean(x));

export async function loadLookups(db: Db): Promise<Lookups> {
  const [cities, systems, languages, facilities, feeItems] = await Promise.all([
    db.from("cities").select("id,slug,name"),
    db.from("education_systems").select("key,name"),
    db.from("language_options").select("code,name"),
    db.from("facility_types").select("key,name"),
    db.from("fee_items").select("key,name"),
  ]);
  return {
    cities: (cities.data ?? []).map((c) => ({ key: c.slug, id: c.id, names: names(c.name as NameJson) })),
    systems: (systems.data ?? []).map((s) => ({ key: s.key, names: names(s.name as NameJson) })),
    languages: (languages.data ?? []).map((l) => ({ key: l.code, names: names(l.name as NameJson) })),
    facilities: (facilities.data ?? []).map((f) => ({ key: f.key, names: names(f.name as NameJson) })),
    feeItems: (feeItems.data ?? []).map((f) => ({ key: f.key, names: names(f.name as NameJson) })),
  };
}

export type ImportMode = "create" | "update";
export type RowAction = "create" | "update" | "unchanged" | "skip" | "error";
export type AnalyzedRow = {
  line: number; name: string; slug: string; action: RowAction; errors: string[]; warnings: string[]; changes: string[];
  payload: Record<string, unknown> | null;
};
export type Analysis = { ok: true; rows: AnalyzedRow[]; ignored: string[]; delimiter: string } | { ok: false; error: string };

export async function analyze(db: Db, file: unknown, mode: ImportMode, defaults: ImportDefaults): Promise<Analysis> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a CSV file first." };
  if (file.size > MAX_BYTES) return { ok: false, error: "The file is larger than 2 MB. Split it into several files." };
  const text = await file.text();
  if (text.includes("\u0000")) return { ok: false, error: "This does not look like a CSV file. In Excel use File, Save as, CSV UTF-8." };
  const { rows: cells, delimiter } = parseCsv(text);
  const table = readTable(cells);
  if (table.error) return { ok: false, error: table.error };

  const lookups = await loadLookups(db);
  const read = table.records.map((r) => readRow(r.cells, r.line, lookups));
  const slugs = [...new Set(read.map((r) => r.slug).filter(Boolean))];
  const [{ data: existingRows }, { data: allSchools }] = await Promise.all([
    slugs.length ? db.from("schools").select(SCHOOL_WITH_CHILDREN).in("slug", slugs) : Promise.resolve({ data: [] }),
    db.from("schools").select("id,slug,name,city_id"),
  ]);
  const existing = new Map(((existingRows ?? []) as unknown as Parameters<typeof toFormValues>[0][]).map((s) => [s.slug, s]));
  const byNameCity = new Map((allSchools ?? []).map((s) => [`${norm((s.name as NameJson)?.en ?? "")}|${s.city_id}`, s.slug]));

  const seen = new Set<string>();
  const out: AnalyzedRow[] = read.map((row) => {
    const base = { line: row.line, name: row.name, slug: row.slug, errors: [] as string[], warnings: [] as string[], changes: [] as string[], payload: null as AnalyzedRow["payload"] };
    if (!row.slug) return { ...base, action: "error", errors: [...row.errors, "name_en or slug: needed to identify the school"] };
    if (seen.has(row.slug)) return { ...base, action: "error", errors: [`slug: “${row.slug}” appears more than once in this file`] };
    seen.add(row.slug);

    const saved = existing.get(row.slug);
    if (saved && mode === "create") {
      return { ...base, action: "skip", warnings: [`“${row.slug}” already exists. It was left as it is (choose “update existing schools” to change it)`] };
    }
    const baseValues = saved ? toFormValues(saved) : null;
    const result = assemble(row, baseValues, defaults);
    if (!saved) {
      const cityId = (row.partial.city_id as string | undefined) ?? "";
      const same = byNameCity.get(`${norm(row.name)}|${cityId}`);
      if (same && same !== row.slug) result.warnings.push(`a school with the same name already exists in this city (slug “${same}”): check this is not a duplicate`);
    }
    if (result.errors.length) return { ...base, action: "error", errors: result.errors, warnings: result.warnings };
    if (!baseValues) return { ...base, action: "create", warnings: result.warnings, payload: result.payload };
    const merged = overlay(baseValues, row.partial);
    const changes = changedFields(baseValues, merged);
    if (changes.length === 0) return { ...base, action: "unchanged", warnings: ["nothing in this row differs from the saved school"] };
    return { ...base, action: "update", warnings: result.warnings, changes, payload: result.payload };
  });
  return { ok: true, rows: out, ignored: table.ignored, delimiter };
}

export type { Named };
