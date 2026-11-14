/** Repeatable, local-only import of sourced institutions. Default is validation/dry run; pass --apply to write. */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { z } from "zod";
import { normalizeWhatsapp } from "../src/lib/whatsapp";

config({ path: ".env.local", quiet: true });
const ROOT = path.resolve("data/research/2026-11-schools");
const apply = process.argv.includes("--apply");
const batch = process.argv.find((arg) => arg.startsWith("--batch="))?.slice(8);
const noMedia = process.argv.includes("--no-media");
const i18n = z.object({ kg: z.string(), ru: z.string(), en: z.string() });
const optionalI18n = i18n.nullable().transform((value) => value ?? { kg: "", ru: "", en: "" });
const media = z.object({ url: z.string().url(), source: z.string().url(), localPath: z.string().optional(), caption: i18n.optional() });
const schema = z.object({
  requestedName: z.string().nullable().optional(), slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(90),
  publishable: z.boolean().default(false),
  name: i18n.refine((n) => Object.values(n).every((s) => s.trim()), "Three language names required"),
  tagline: optionalI18n, about: optionalI18n,
  institutionKind: z.string(), schoolType: z.enum(["private", "international"]),
  city: z.object({ slug: z.string(), name: i18n, provinceSlug: z.string(), lat: z.number().optional(), lng: z.number().optional() }),
  address: optionalI18n,
  lat: z.number().min(39).max(44).nullable(), lng: z.number().min(69).max(81).nullable(),
  twoGisUrl: z.string().url().nullable(), phone: z.string().nullable(), whatsapp: z.string().nullable(),
  email: z.string().email().nullable(), website: z.string().url().nullable(), instagram: z.string().url().nullable(), facebook: z.string().url().nullable(),
  educationSystems: z.array(z.string()), gradeFrom: z.number().int().min(0).max(11).nullable(), gradeTo: z.number().int().min(0).max(12).nullable(),
  languages: z.array(z.enum(["kg", "ru", "en", "tr", "de", "zh", "fr", "ar"])),
  primaryLanguage: z.string().nullable().optional(),
  academicPrograms: z.array(z.object({ name: i18n, description: i18n.nullable().optional() })),
  logo: media.nullable(), photos: z.array(media).max(2),
  sources: z.array(z.object({ url: z.string().url(), title: z.string(), fields: z.array(z.string()), accessedAt: z.string() })).min(1),
  missing: z.array(z.string()), warnings: z.array(z.string()),
}).refine((s) => (s.lat === null) === (s.lng === null), "Coordinates must be a complete pair")
  .refine((s) => s.gradeFrom === null || s.gradeTo === null || s.gradeFrom <= s.gradeTo, "Invalid grade range");
type School = z.infer<typeof schema>;
type Asset = { sourceUrl: string; sourcePage: string; hash: string; storagePath: string; publicUrl: string; bytes: number };
type State = { schools: Record<string, { id: string; batch: string; importedAt: string; status: string; digest: string; managedLanguages?: string[] }>; assets: Record<string, Asset>; failures: { slug: string; item: string; error: string; at: string }[] };
async function main() {
const statePath = path.join(ROOT, "import-state.json");
const state: State = await readFile(statePath, "utf8").then(JSON.parse).catch(() => ({ schools: {}, assets: {}, failures: [] }));
const files = (await readdir(ROOT)).filter((f) => /^(bishkek-a|bishkek-b|tokmok|issyk-kul|karakol|naryn|jalal-abad|talas)\.json$/.test(f) && (!batch || f === `${batch}.json`)).sort();
const records: { school: School; file: string }[] = [];
for (const file of files) {
  const parsed = z.array(schema).safeParse(JSON.parse(await readFile(path.join(ROOT, file), "utf8")));
  if (!parsed.success) throw new Error(`${file}: ${JSON.stringify(parsed.error.issues)}`);
  for (const school of parsed.data) records.push({ school, file });
}
if (!files.length) throw new Error("No completed batch JSON files found.");
if (new Set(records.map((r) => r.school.slug)).size !== records.length) throw new Error("Duplicate school slug across batches.");
console.log(JSON.stringify({ mode: apply ? "apply-local" : "dry-run", files, records: records.length, publishable: records.filter((r) => r.school.publishable).length }));
if (!apply) process.exit(0);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("This importer only writes to loopback local Supabase.");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const must = <T>(r: { data: T; error: { message: string } | null }, label: string): T => { if (r.error) throw new Error(`${label}: ${r.error.message}`); return r.data; };
const persist = async () => {
  await writeFile(`${statePath}.tmp`, JSON.stringify(state, null, 2) + "\n");
  await rename(`${statePath}.tmp`, statePath);
};
const id = (slug: string, kind: string, index: number) => {
  const h = createHash("sha256").update(`edumaps-research-2026-11:${slug}:${kind}:${index}`).digest("hex").slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20)}`;
};

async function download(school: School, item: z.infer<typeof media>, kind: string): Promise<Asset | null> {
  const cacheKey = `${school.slug}/${kind}`;
  if (state.assets[cacheKey]?.sourceUrl === item.url) return state.assets[cacheKey];
  if (noMedia) return null;
  try {
    const remote = new URL(item.url);
    if (!/^https?:$/.test(remote.protocol) || remote.username || remote.password || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[|0\.)/.test(remote.hostname)) throw new Error("Refused non-public image URL");
    let body: Buffer;
    if (item.localPath) {
      const local = path.resolve(item.localPath);
      if (!local.startsWith(`${ROOT}${path.sep}`)) throw new Error("Local media must live inside the research directory");
      body = await readFile(local);
    } else {
      const response = await fetch(remote, { signal: AbortSignal.timeout(25_000), headers: { "User-Agent": "EduMaps school directory research", Referer: item.source } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (Number(response.headers.get("content-length")) > 12_000_000) throw new Error("Image exceeds12MB");
      body = Buffer.from(await response.arrayBuffer());
    }
    if (body.length > 12_000_000) throw new Error("Image exceeds12MB");
    // Some school galleries serve genuine HEIC originals; macOS can decode HEVC when bundled sharp cannot.
    if (body.subarray(4, 40).toString("ascii").match(/ftyp(?:heic|heix|hevc|hevx|mif1)/)) {
      const temporary = await mkdtemp(path.join(tmpdir(), "edumaps-media-"));
      try {
        const source = path.join(temporary, "source.heic");
        const converted = path.join(temporary, "converted.png");
        await writeFile(source, body);
        await promisify(execFile)("/usr/bin/sips", ["-s", "format", "png", source, "--out", converted]);
        body = await readFile(converted);
      } finally { await rm(temporary, { recursive: true, force: true }); }
    }
    const image = sharp(body, { limitInputPixels: 40_000_000 });
    const meta = await image.metadata();
    if (!meta.width || !meta.height || meta.width < 40 || meta.height < 40) throw new Error("Image is too small or invalid");
    const optimized = await image.rotate().resize({ width: kind === "logo" ? 512 : 1600, height: kind === "logo" ? 512 : 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
    const hash = createHash("sha256").update(optimized).digest("hex");
    if (kind !== "logo" && Object.entries(state.assets).some(([k, a]) => k.startsWith(`${school.slug}/photo-`) && k !== cacheKey && a.hash === hash)) throw new Error("Duplicate gallery photo");
    const storagePath = `research/2026-11/${school.slug}/${kind}-${hash.slice(0, 12)}.webp`;
    must(await db.storage.from("media").upload(storagePath, optimized, { contentType: "image/webp", upsert: true }), `upload ${cacheKey}`);
    await mkdir(path.join(ROOT, "assets", school.slug), { recursive: true });
    await writeFile(path.join(ROOT, "assets", school.slug, `${kind}.webp`), optimized);
    const asset = { sourceUrl: item.url, sourcePage: item.source, hash, storagePath, publicUrl: db.storage.from("media").getPublicUrl(storagePath).data.publicUrl, bytes: optimized.length };
    state.assets[cacheKey] = asset;
    await persist();
    return asset;
  } catch (error) {
    state.failures.push({ slug: school.slug, item: kind, error: String(error), at: new Date().toISOString() });
    await persist();
    console.log(`${school.slug}/${kind}: ${String(error)}`);
    return null;
  }
}

for (const { school: s, file } of records) {
  const old = must(await db.from("schools").select("*").eq("slug", s.slug).maybeSingle(), `read ${s.slug}`);
  if (old?.data_status === "verified" && !state.schools[s.slug]) throw new Error(`${s.slug}: existing confirmed profile needs manual reconciliation`);
  await mkdir(path.join(ROOT, "backups"), { recursive: true });
  const backupPath = path.join(ROOT, "backups", `${s.slug}.json`);
  if (old && !(await readFile(backupPath).then(() => true).catch(() => false))) {
    const children = {} as Record<string, unknown>;
    for (const table of ["school_locations", "school_languages", "school_programs", "school_media"]) children[table] = must(await db.from(table).select("*").eq("school_id", old.id), `backup ${table}`);
    await writeFile(backupPath, JSON.stringify({ school: old, children }, null, 2) + "\n");
  }
  let city = must(await db.from("cities").select("id").eq("slug", s.city.slug).maybeSingle(), `city ${s.city.slug}`);
  if (!city) {
    const province = must(await db.from("provinces").select("id").eq("slug", s.city.provinceSlug).single(), "province");
    const lat = s.city.lat ?? s.lat; const lng = s.city.lng ?? s.lng;
    if (lat == null || lng == null) throw new Error(`A sourced representative city map point is needed for ${s.city.slug}`);
    city = must(await db.from("cities").insert({ slug: s.city.slug, name: s.city.name, province_id: province.id, lat, lng, zoom: 12 }).select("id").single(), "create city");
  }
  if (s.city.slug === "jalal-abad") must(await db.from("cities").update({ name: s.city.name }).eq("id", city.id), "current city name");
  const social: Record<string, string> = { ...(old?.social as Record<string, string> ?? {}) };
  for (const [channel, address] of [["instagram", s.instagram], ["facebook", s.facebook]]) {
    if (address) social[channel!] = address;
    else delete social[channel!];
  }
  const row = {
    ...(old ? { id: old.id } : {}), slug: s.slug, name: s.name, tagline: s.tagline, about: s.about, city_id: city.id,
    school_type: s.schoolType, education_systems: s.educationSystems, grade_from: s.gradeFrom, grade_to: s.gradeTo,
    // These requested contact fields are authoritative: null retracts an earlier wrong-branch value.
    phone: s.phone, whatsapp: s.whatsapp ? normalizeWhatsapp(s.whatsapp) : null,
    email: s.email, website: s.website, social,
    data_status: "unverified", status: s.publishable ? "published" : "draft",
    ...(old?.logo_url?.includes(`/seed/schools/${s.slug}/`) ? { logo_url: null } : {}),
    ...(old?.cover_url?.includes(`/seed/schools/${s.slug}/`) ? { cover_url: null } : {}),
  };
  const saved = must(await db.from("schools").upsert(row, { onConflict: "slug" }).select("id,status").single(), `save ${s.slug}`);
  // Replace only the known seed illustrations, preserving every manually added photograph.
  const oldMedia = must(await db.from("school_media").select("id,url").eq("school_id", saved.id), "existing gallery");
  const seedIds = oldMedia.filter((m) => m.url.includes(`/seed/schools/${s.slug}/`)).map((m) => m.id);
  if (seedIds.length) must(await db.from("school_media").delete().in("id", seedIds), "remove seed illustrations");
  if (Object.values(s.address).some(Boolean) || s.twoGisUrl || s.lat !== null) {
    must(await db.from("school_locations").upsert({ school_id: saved.id, address: s.address, lat: s.lat, lng: s.lng, twogis_url: s.twoGisUrl }, { onConflict: "school_id" }), "location");
  }
  let managedLanguages = state.schools[s.slug]?.managedLanguages;
  if (!managedLanguages && state.schools[s.slug]) {
    // Adopt rows written by the earlier version of this same import, before ownership was recorded.
    const previousLanguages = must(await db.from("school_languages").select("language_code").eq("school_id", saved.id), "previous research languages");
    managedLanguages = previousLanguages.map((l) => l.language_code);
  }
  const outdatedLanguages = (managedLanguages ?? []).filter((code) => !s.languages.includes(code as School["languages"][number]));
  if (outdatedLanguages.length) must(await db.from("school_languages").delete().eq("school_id", saved.id).in("language_code", outdatedLanguages), "outdated research languages");
  if (s.languages.length) must(await db.from("school_languages").upsert(s.languages.map((code) => ({ school_id: saved.id, language_code: code, is_primary: s.primaryLanguage === code })), { onConflict: "school_id,language_code" }), "languages");
  const managedProgramIds = Array.from({ length: 50 }, (_, index) => id(s.slug, "program", index));
  const stalePrograms = managedProgramIds.slice(s.academicPrograms.length);
  if (stalePrograms.length) must(await db.from("school_programs").delete().eq("school_id", saved.id).in("id", stalePrograms), "outdated research programs");
  if (s.academicPrograms.length) must(await db.from("school_programs").upsert(s.academicPrograms.map((p, index) => ({ id: id(s.slug, "program", index), school_id: saved.id, kind: "academic", name: p.name, description: p.description ?? null, sort_order: index }))), "programs");
  state.schools[s.slug] = { id: saved.id, batch: file, importedAt: new Date().toISOString(), status: saved.status, digest: createHash("sha256").update(JSON.stringify(s)).digest("hex"), managedLanguages: s.languages };
  await persist();
  console.log(`${s.slug}: ${saved.status}, fields saved`);
  const logo = s.logo ? await download(s, s.logo, "logo") : null;
  const photos: Asset[] = [];
  for (let index = 0; index < s.photos.length; index++) {
    const photo = await download(s, s.photos[index]!, `photo-${index + 1}`);
    if (photo) {
      photos.push(photo);
      must(await db.from("school_media").upsert({ id: id(s.slug, "photo", index), school_id: saved.id, kind: "image", url: photo.publicUrl, storage_path: photo.storagePath, caption: s.photos[index]!.caption ?? s.name, sort_order: index }), "gallery");
    }
  }
  if (logo || photos[0]) must(await db.from("schools").update({ ...(logo ? { logo_url: logo.publicUrl } : {}), ...(photos[0] ? { cover_url: photos[0].publicUrl } : {}) }).eq("id", saved.id), "cover/logo");
  console.log(`${s.slug}: media ${logo ? 'logo ' : ''}${photos.length}/2 photos`);
}
await persist();
console.log(JSON.stringify({ imported: Object.keys(state.schools).length, assets: Object.keys(state.assets).length, failedAttempts: state.failures.length, state: statePath }));

}
main().catch((error) => { console.error(error); process.exitCode = 1; });
