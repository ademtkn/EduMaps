/**
 * Local-only import of the owner's institution spreadsheet (data/registry/2026-11-sheet/manifest.json,
 * produced by scripts/registry-normalize.py). Default is a dry run; --apply writes to local Supabase.
 *
 * New institutions are created as unverified listings; rows flagged "Kontrol edilecekler" in the sheet stay drafts.
 * Schools already on the site are only completed: empty fields are filled, researched values are never replaced.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

config({ path: ".env.local", quiet: true });
const ROOT = path.resolve("data/registry/2026-11-sheet");
const apply = process.argv.includes("--apply");
const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.slice(8) ?? Infinity);

const text = z.string().nullable();
const i18n = z.object({ kg: text, ru: text, en: text });
const record = z.object({
  key: z.string(), slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(90), existingSlug: z.string().nullable(),
  toCheck: z.boolean(), kind: z.enum(["Özel okul", "Anaokulu", "Kolej", "Medrese"]), level: text,
  name: i18n, about: i18n, city: z.string(), district: text, address: text, twoGisUrl: z.string().url().nullable(),
  lat: z.number().min(39).max(44).nullable(), lng: z.number().min(69).max(81).nullable(),
  phone: z.string().max(40).nullable(), email: z.string().email().nullable(),
  website: z.string().regex(/^https?:\/\//).nullable(), instagram: z.string().url().nullable(), facebook: z.string().url().nullable(),
  schoolType: z.enum(["private", "international"]), institutionKind: z.enum(["school", "kindergarten", "college", "madrasa"]),
  gradeFrom: z.number().int().min(0).max(11).nullable(), gradeTo: z.number().int().min(0).max(12).nullable(), gradesText: text,
  languages: z.array(z.enum(["kg", "ru", "en", "tr", "de", "zh", "fr", "ar"])),
  educationSystems: z.array(z.enum(["national", "ib", "cambridge", "american", "montessori", "waldorf", "turkish", "russian", "stem"])),
  facilities: z.array(z.string()), boarding: z.boolean(), foundedYear: z.number().int().min(1800).max(2100).nullable(),
  curriculum: text, highlights: text, achievements: text, licence: text, clubs: text, fees: text,
  sources: z.array(z.string()), checkedAt: z.string(),
}).refine((r) => (r.lat === null) === (r.lng === null), "coordinate pair")
  .refine((r) => r.name.en, "English name required");
type Rec = z.infer<typeof record> & { verdict?: Verdict };
// Results of the per-region verification agents (verify/<region>.json), see verify/INSTRUCTIONS.md.
const verdictSchema = z.object({
  key: z.string(), verdict: z.enum(["confirmed", "not_private", "closed", "duplicate", "unresolved"]),
  kind: z.enum(["school", "kindergarten", "college", "madrasa"]).optional(), ownership: z.string().optional(), operating: z.string().optional(),
  evidence: z.array(z.object({ url: z.string() }).passthrough()).default([]),
  corrections: z.object({
    phone: z.string().optional(), website: z.string().optional(), instagram: z.string().optional(), address: z.string().optional(),
    twoGisUrl: z.string().optional(), gradeFrom: z.number().int().optional(), gradeTo: z.number().int().optional(), languages: z.array(z.string()).optional(),
  }).partial().passthrough().default({}),
  note: z.string().optional(),
}).passthrough();
type Verdict = z.infer<typeof verdictSchema>;
const LANGS = ["kg", "ru", "en", "tr", "de", "zh", "fr", "ar"] as const;

/** Merge an agent's sourced verdict and corrections into a sheet record (only records this import created). */
function withVerdict(r: Rec, v: Verdict | undefined): Rec {
  if (!v || r.existingSlug) return r;
  const c = v.corrections;
  const out: Rec = { ...r, verdict: v };
  if (v.verdict === "confirmed") out.toCheck = false;
  if (v.kind) out.institutionKind = v.kind;
  if (c.phone && c.phone.length <= 40) out.phone = c.phone;
  if (c.website && /^https?:\/\//.test(c.website)) out.website = c.website;
  if (c.instagram && /^https:\/\//.test(c.instagram)) out.instagram = c.instagram;
  if (c.address) out.address = c.address;
  if (c.twoGisUrl && /^https:\/\/2gis\.kg\//.test(c.twoGisUrl)) out.twoGisUrl = c.twoGisUrl;
  if (c.gradeFrom !== undefined && c.gradeTo !== undefined && c.gradeFrom >= 0 && c.gradeFrom <= 11 && c.gradeTo <= 12 && c.gradeFrom <= c.gradeTo) { out.gradeFrom = c.gradeFrom; out.gradeTo = c.gradeTo; }
  if (c.languages?.length) out.languages = c.languages.filter((l): l is (typeof LANGS)[number] => (LANGS as readonly string[]).includes(l));
  return out;
}
function statusFor(r: Rec): "published" | "draft" | "archived" {
  const v = r.verdict;
  if (v && ["not_private", "closed", "duplicate"].includes(v.verdict)) return "archived";
  if (v?.verdict === "confirmed") {
    if (v.operating === "no") return "archived";
    // Private status from a 2021 directory alone does not show the place still operates: keep it for review.
    const staleOnly = v.operating !== "yes" && v.evidence.length > 0 && v.evidence.every((e) => e.url.includes("adresa-telefony"));
    return staleOnly ? "draft" : "published";
  }
  return r.toCheck ? "draft" : "published";
}
const city = z.object({ slug: z.string(), province: z.string(), name: z.object({ kg: z.string(), ru: z.string(), en: z.string() }), lat: z.number(), lng: z.number(), source: z.string().url() });
type State = { records: Record<string, { slug: string; id: string; mode: "created" | "completed"; filled: string[]; at: string; digest: string }>; cities: Record<string, string> };

const KIND_LABEL: Record<string, [string, string, string]> = {
  school: ["Жеке мектеп", "Частная школа", "Private school"],
  international: ["Эл аралык мектеп", "Международная школа", "International school"],
  schoolUnconfirmed: ["Мектеп", "Школа", "School"],
  kindergarten: ["Жеке бала бакча", "Частный детский сад", "Private kindergarten"],
  kindergartenUnconfirmed: ["Бала бакча", "Детский сад", "Kindergarten"],
  college: ["Колледж", "Колледж", "College"],
  madrasa: ["Медресе", "Медресе", "Madrasa"],
};
const INFO: { field: keyof Rec; kind: "academic" | "club"; name: { kg: string; ru: string; en: string } }[] = [
  { field: "curriculum", kind: "academic", name: { kg: "Окуу программасы", ru: "Учебная программа", en: "Curriculum" } },
  { field: "gradesText", kind: "academic", name: { kg: "Класстар / курак", ru: "Классы / возраст", en: "Grades / ages" } },
  { field: "highlights", kind: "academic", name: { kg: "Өзгөчөлүктөрү", ru: "Особенности", en: "Highlights" } },
  { field: "achievements", kind: "academic", name: { kg: "Жетишкендиктер", ru: "Достижения", en: "Achievements" } },
  { field: "licence", kind: "academic", name: { kg: "Лицензия жана аккредитация", ru: "Лицензия и аккредитация", en: "Licence and accreditation" } },
  { field: "clubs", kind: "club", name: { kg: "Ийримдер жана мүмкүнчүлүктөр", ru: "Кружки и возможности", en: "Clubs and facilities" } },
];

const uuid = (key: string, part: string) => {
  const h = createHash("sha256").update(`edumaps-registry-2026-11:${key}:${part}`).digest("hex").slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20)}`;
};
const compact = (v: { kg?: string | null; ru?: string | null; en?: string | null }) => {
  const out = Object.fromEntries(Object.entries(v).filter(([, s]) => s && s.trim())) as Record<string, string>;
  return Object.keys(out).length ? out : null;
};
const empty = (v: unknown) => v === null || v === undefined || v === "" || (typeof v === "object" && !Array.isArray(v) && !Object.values(v as object).some((x) => typeof x === "string" && x.trim()));

function tagline(r: Rec, cityName: { kg: string; ru: string; en: string }) {
  const label = r.kind === "Anaokulu" ? (r.toCheck ? KIND_LABEL.kindergartenUnconfirmed : KIND_LABEL.kindergarten)
    : r.kind === "Kolej" ? KIND_LABEL.college : r.kind === "Medrese" ? KIND_LABEL.madrasa
    : r.toCheck ? KIND_LABEL.schoolUnconfirmed : r.schoolType === "international" ? KIND_LABEL.international : KIND_LABEL.school;
  return { kg: `${label[0]} · ${cityName.kg}`, ru: `${label[1]} · ${cityName.ru}`, en: `${label[2]} · ${cityName.en}` };
}
const infoPrograms = (r: Rec, schoolId: string) => INFO.filter((i) => r[i.field] && !(i.field === "gradesText" && r.gradeFrom !== null))
  .map((i, index) => ({ id: uuid(r.key, `info-${i.field}`), school_id: schoolId, kind: i.kind, name: i.name, description: { en: r[i.field] as string }, sort_order: 50 + index }));

async function main() {
  const verdicts = new Map<string, Verdict>();
  for (const file of (await readdir(path.join(ROOT, "verify")).catch(() => [] as string[])).filter((f) => f.endsWith(".json") && !f.endsWith("-input.json"))) {
    for (const v of z.array(verdictSchema).parse(JSON.parse(await readFile(path.join(ROOT, "verify", file), "utf8")))) verdicts.set(v.key, v);
  }
  // Lead decisions that override an agent verdict, each with a written reason.
  const overrides: Record<string, Partial<Verdict> & { reason: string }> = await readFile(path.join(ROOT, "verify-overrides.json"), "utf8").then(JSON.parse).catch(() => ({}));
  for (const [k, o] of Object.entries(overrides)) { const v = verdicts.get(k); if (v) verdicts.set(k, { ...v, ...o, corrections: { ...v.corrections, ...(o.corrections ?? {}) }, note: `${v.note ?? ""} [override: ${o.reason}]` }); }
  const records = (z.array(record).parse(JSON.parse(await readFile(path.join(ROOT, "manifest.json"), "utf8"))) as Rec[]).slice(0, limit).map((r) => withVerdict(r, verdicts.get(r.key)));
  // Existing schools whose researched address disagrees with the sheet's 2GIS card keep their location untouched.
  const locationConflicts: Record<string, string> = await readFile(path.join(ROOT, "location-conflicts.json"), "utf8").then(JSON.parse).catch(() => ({}));
  const cities = z.array(city).parse(JSON.parse(await readFile(path.join(ROOT, "cities.json"), "utf8")));
  if (new Set(records.map((r) => r.slug)).size !== records.length) throw new Error("Duplicate slug in manifest");
  const summary = {
    mode: apply ? "apply-local" : "dry-run", records: records.length,
    complete: records.filter((r) => r.existingSlug).length,
    create: records.filter((r) => !r.existingSlug).length,
    publish: records.filter((r) => !r.existingSlug && statusFor(r) === "published").length,
    draft: records.filter((r) => !r.existingSlug && statusFor(r) === "draft").length,
    archive: records.filter((r) => !r.existingSlug && statusFor(r) === "archived").length,
    verdicts: verdicts.size,
  };
  console.log(JSON.stringify(summary));
  if (!apply) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("This importer only writes to loopback local Supabase.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const must = <T>(r: { data: T; error: { message: string } | null }, label: string): T => { if (r.error) throw new Error(`${label}: ${r.error.message}`); return r.data; };
  const statePath = path.join(ROOT, "import-state.json");
  const state: State = await readFile(statePath, "utf8").then(JSON.parse).catch(() => ({ records: {}, cities: {} }));
  const persist = async () => { await writeFile(`${statePath}.tmp`, JSON.stringify(state, null, 1) + "\n"); await rename(`${statePath}.tmp`, statePath); };
  await mkdir(path.join(ROOT, "backups"), { recursive: true });

  // Cities: reuse existing rows, create missing settlements at their sourced OpenStreetMap centre.
  const cityRows = new Map<string, { id: string; name: { kg: string; ru: string; en: string } }>();
  for (const c of must(await db.from("cities").select("id,slug,name"), "cities")) cityRows.set(c.slug, c as never);
  for (const slug of new Set(records.map((r) => r.city))) {
    if (cityRows.has(slug)) continue;
    const c = cities.find((x) => x.slug === slug);
    if (!c) throw new Error(`No sourced centre for city ${slug}`);
    const province = must(await db.from("provinces").select("id").eq("slug", c.province).single(), `province ${c.province}`);
    const row = must(await db.from("cities").insert({ slug, name: c.name, province_id: province.id, lat: c.lat, lng: c.lng, zoom: 13, sort_order: 20 }).select("id,slug,name").single(), `create city ${slug}`);
    cityRows.set(slug, row as never);
    state.cities[slug] = c.source;
    await persist();
  }

  let done = 0;
  for (const r of records) {
    const c = cityRows.get(r.city)!;
    const digest = createHash("sha256").update(JSON.stringify(r)).digest("hex");
    const prev = state.records[r.key];
    if (prev?.digest === digest) { done++; continue; }
    const social: Record<string, string> = {};
    if (r.instagram) social.instagram = r.instagram;
    if (r.facebook) social.facebook = r.facebook;

    if (r.existingSlug) {
      // Complete an existing school: fill only what is empty, keep a first-touch backup.
      const old = must(await db.from("schools").select("*").eq("slug", r.existingSlug).single(), `read ${r.existingSlug}`);
      const backup = path.join(ROOT, "backups", `${r.existingSlug}.json`);
      if (!(await readFile(backup).then(() => true).catch(() => false))) {
        const children: Record<string, unknown> = {};
        for (const t of ["school_locations", "school_languages", "school_programs", "school_facilities"]) children[t] = must(await db.from(t).select("*").eq("school_id", old.id), `backup ${t}`);
        await writeFile(backup, JSON.stringify({ school: old, children }, null, 1) + "\n");
      }
      const filled: string[] = prev?.filled ?? [];
      const patch: Record<string, unknown> = {};
      const fill = (col: string, value: unknown) => { if (!empty(value) && empty(old[col])) { patch[col] = value; if (!filled.includes(col)) filled.push(col); } };
      fill("phone", r.phone); fill("email", r.email); fill("website", r.website); fill("founded_year", r.foundedYear);
      fill("about", compact(r.about)); fill("tuition_notes", r.fees ? { en: r.fees } : null);
      if (old.grade_from === null && old.grade_to === null && r.gradeFrom !== null) { patch.grade_from = r.gradeFrom; patch.grade_to = r.gradeTo; filled.push("grades"); }
      if (!old.education_systems?.length && r.educationSystems.length) { patch.education_systems = r.educationSystems; filled.push("education_systems"); }
      if (old.institution_kind === "school" && r.institutionKind !== "school") { patch.institution_kind = r.institutionKind; filled.push("institution_kind"); }
      if (!old.has_boarding && r.boarding) { patch.has_boarding = true; filled.push("has_boarding"); }
      const oldSocial = (old.social ?? {}) as Record<string, string>;
      const addSocial = Object.fromEntries(Object.entries(social).filter(([k]) => !oldSocial[k]));
      if (Object.keys(addSocial).length) { patch.social = { ...oldSocial, ...addSocial }; filled.push(...Object.keys(addSocial).map((k) => `social.${k}`)); }
      if (Object.keys(patch).length) must(await db.from("schools").update(patch).eq("id", old.id), `complete ${r.existingSlug}`);

      const loc = must(await db.from("school_locations").select("*").eq("school_id", old.id).maybeSingle(), "location");
      if (locationConflicts[r.existingSlug]) {
        // Skipped on purpose; see location-conflicts.json.
      } else if (!loc) {
        if (r.address || r.twoGisUrl || r.lat !== null) {
          const a = r.address ?? "";
          must(await db.from("school_locations").insert({ school_id: old.id, address: { kg: a, ru: a, en: a }, district: r.district, lat: r.lat, lng: r.lng, twogis_url: r.twoGisUrl }), "insert location");
          filled.push("location");
        }
      } else {
        const lp: Record<string, unknown> = {};
        if (!loc.twogis_url?.includes("/firm/") && r.twoGisUrl?.includes("/firm/")) { lp.twogis_url = r.twoGisUrl; filled.push("twogis_url"); }
        if (loc.lat === null && r.lat !== null) { lp.lat = r.lat; lp.lng = r.lng; filled.push("coordinates"); }
        if (!loc.district && r.district) { lp.district = r.district; filled.push("district"); }
        if (empty(loc.address) && r.address) { lp.address = { kg: r.address, ru: r.address, en: r.address }; filled.push("address"); }
        if (Object.keys(lp).length) must(await db.from("school_locations").update(lp).eq("school_id", old.id), "complete location");
      }
      const langs = must(await db.from("school_languages").select("language_code").eq("school_id", old.id), "languages");
      if (!langs.length && r.languages.length && !r.toCheck) {
        must(await db.from("school_languages").insert(r.languages.map((code) => ({ school_id: old.id, language_code: code, is_primary: false }))), "add languages");
        filled.push("languages");
      }
      if (r.facilities.length) must(await db.from("school_facilities").upsert(r.facilities.map((f) => ({ school_id: old.id, facility_key: f })), { onConflict: "school_id,facility_key", ignoreDuplicates: true }), "facilities");
      const info = infoPrograms(r, old.id);
      if (info.length) { must(await db.from("school_programs").upsert(info), "info programs"); filled.push(...info.map((p) => `program:${p.name.en}`)); }
      state.records[r.key] = { slug: r.existingSlug, id: old.id, mode: "completed", filled: [...new Set(filled)], at: new Date().toISOString(), digest };
    } else {
      // Create (or refresh, on re-run) a sheet institution owned by this import.
      const existing = must(await db.from("schools").select("id").eq("slug", r.slug).maybeSingle(), `slug ${r.slug}`);
      if (existing && prev?.id !== existing.id) throw new Error(`${r.slug}: slug already used by a school this import does not own`);
      const row = {
        ...(existing ? { id: existing.id } : { id: uuid(r.key, "school") }),
        slug: r.slug, name: { kg: r.name.kg ?? r.name.en, ru: r.name.ru ?? r.name.en, en: r.name.en },
        tagline: tagline(r, c.name), about: compact(r.about), city_id: c.id, school_type: r.schoolType, institution_kind: r.institutionKind,
        education_systems: r.educationSystems, grade_from: r.gradeFrom, grade_to: r.gradeTo, founded_year: r.foundedYear,
        tuition_notes: r.fees ? { en: r.fees } : null, has_boarding: r.boarding,
        phone: r.phone, email: r.email, website: r.website, social,
        data_status: "unverified", status: statusFor(r),
      };
      const saved = must(await db.from("schools").upsert(row).select("id").single(), `save ${r.slug}`);
      if (r.address || r.twoGisUrl || r.lat !== null) {
        const a = r.address ?? "";
        must(await db.from("school_locations").upsert({ school_id: saved.id, address: { kg: a, ru: a, en: a }, district: r.district, lat: r.lat, lng: r.lng, twogis_url: r.twoGisUrl }, { onConflict: "school_id" }), "location");
      }
      must(await db.from("school_languages").delete().eq("school_id", saved.id), "reset languages");
      if (r.languages.length) must(await db.from("school_languages").insert(r.languages.map((code) => ({ school_id: saved.id, language_code: code, is_primary: false }))), "languages");
      must(await db.from("school_facilities").delete().eq("school_id", saved.id), "reset facilities");
      if (r.facilities.length) must(await db.from("school_facilities").insert(r.facilities.map((f) => ({ school_id: saved.id, facility_key: f }))), "facilities");
      must(await db.from("school_programs").delete().eq("school_id", saved.id), "reset programs");
      const info = infoPrograms(r, saved.id);
      if (info.length) must(await db.from("school_programs").insert(info), "programs");
      state.records[r.key] = { slug: r.slug, id: saved.id, mode: "created", filled: [], at: new Date().toISOString(), digest };
    }
    if (++done % 50 === 0) console.log(`${done}/${records.length}`);
    await persist();
  }
  await persist();
  const modes = Object.values(state.records).reduce<Record<string, number>>((a, s) => ({ ...a, [s.mode]: (a[s.mode] ?? 0) + 1 }), {});
  console.log(JSON.stringify({ done, ...modes, newCities: Object.keys(state.cities).length, state: statePath }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
