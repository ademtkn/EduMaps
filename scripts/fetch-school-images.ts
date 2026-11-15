/**
 * Fills the picture gap from the schools' own websites.
 *
 *   npx tsx scripts/fetch-school-images.ts                 # dry run: only reports what it finds
 *   npx tsx scripts/fetch-school-images.ts --apply --limit 20
 *
 * Instagram profile pages are behind a login wall and are not readable by a script, so this only
 * uses a school's own website: the `og:image` becomes the cover and the first image whose address or
 * alt text says "logo" becomes the logo. Nothing is generated and nothing is taken from a third
 * party. Every picture is shrunk to WebP and stored in the media bucket; the school row keeps the
 * public URL, and `data_status` stays `unverified` (a website banner is not an official submission).
 *
 * The run is deliberately slow (one request per site, 350 ms apart) and can be repeated: schools that
 * already have a cover and a logo are skipped, so an interrupted run resumes where it stopped.
 */
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

const APPLY = process.argv.includes("--apply");
const onlyIndex = process.argv.indexOf("--only");
const ONLY = onlyIndex !== -1 ? process.argv[onlyIndex + 1] : "both";
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? Number(process.argv[limitArg + 1]) || 50 : 50;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

type School = { id: string; slug: string; website: string | null; cover_url: string | null; logo_url: string | null };

const absolute = (src: string, base: string) => {
  try {
    return new URL(src, base).toString();
  } catch {
    return null;
  }
};

const metaImage = (html: string) => {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) return match[1];
  }
  return null;
};

const logoImage = (html: string) => {
  const tags = html.match(/<img[^>]+>/gi) ?? [];
  for (const tag of tags) {
    const src = /src=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!src) continue;
    const hint = `${src} ${/alt=["']([^"']*)["']/i.exec(tag)?.[1] ?? ""}`;
    if (/logo/i.test(hint)) return src;
  }
  return null;
};

async function fetchText(target: string): Promise<string | null> {
  try {
    const response = await fetch(target, { redirect: "follow", signal: AbortSignal.timeout(12_000), headers: { "user-agent": UA, accept: "text/html" } });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("html")) return null;
    return (await response.text()).slice(0, 600_000);
  } catch {
    return null;
  }
}

async function fetchImage(target: string): Promise<Buffer | null> {
  try {
    const response = await fetch(target, { redirect: "follow", signal: AbortSignal.timeout(15_000), headers: { "user-agent": UA, accept: "image/*" } });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (!/^image\/(jpeg|png|webp|avif)/.test(type)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) return null;
    return bytes;
  } catch {
    return null;
  }
}

/**
 * 1600 px wide, WebP, metadata stripped — the same result as an upload through the admin panel.
 * Small pictures are refused: a 60×60 icon is a favicon, not a logo, and a narrow banner is not a cover.
 */
async function prepare(bytes: Buffer | null, kind: "cover" | "logo") {
  if (!bytes || bytes.byteLength === 0) return null;
  try {
    const image = sharp(bytes, { failOn: "none" }).rotate();
    const meta = await image.metadata();
    if (!meta.width || !meta.height) return null;
    if (kind === "logo" && (meta.width < 96 || meta.height < 48)) return null;
    if (kind === "cover" && (meta.width < 600 || meta.height < 300)) return null;
    return await image.resize({ width: kind === "logo" ? 512 : 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch {
    return null;
  }
}

async function store(bytes: Buffer, slug: string): Promise<string | null> {
  const now = new Date();
  const file = `imports/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;
  const { error } = await db.storage.from("media").upload(file, bytes, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) {
    console.error(`   storage: ${error.message}`);
    return null;
  }
  const publicUrl = db.storage.from("media").getPublicUrl(file).data.publicUrl;
  await db.from("media_files").insert({ bucket: "media", path: file, public_url: publicUrl, mime_type: "image/webp", size_bytes: bytes.byteLength, alt: { en: slug } });
  return publicUrl;
}

async function main() {
  console.log(APPLY ? `APPLY — up to ${LIMIT} schools` : `DRY RUN — up to ${LIMIT} schools (add --apply to write)`);

  const { data, error } = await db
    .from("schools")
    .select("id,slug,website,cover_url,logo_url")
    .eq("status", "published")
    .not("website", "is", null)
    .neq("website", "")
    .order("slug")
    .limit(LIMIT);
  if (error) throw error;

  const schools = ((data ?? []) as School[]).filter((school) => !school.cover_url || !school.logo_url);
  console.log(`${schools.length} school(s) with a website and a missing picture\n`);

  const seen = new Set<string>();
  let covers = 0;
  let logos = 0;
  let skipped = 0;

  for (const school of schools) {
    const site = school.website!.startsWith("http") ? school.website! : `https://${school.website}`;
    const html = await fetchText(site);
    if (!html) {
      console.log(`${school.slug.padEnd(44)} site unreachable`);
      skipped += 1;
      await new Promise((r) => setTimeout(r, 350));
      continue;
    }

    const ogCandidate = metaImage(html);
    const logoCandidate = logoImage(html);
    const og = ogCandidate ? absolute(ogCandidate, site) : null;
    const logo = logoCandidate ? absolute(logoCandidate, site) : null;

    const found: string[] = [];
    if (ONLY !== "logo" && !school.cover_url && og && !seen.has(og)) {
      const prepared = await prepare(await fetchImage(og), "cover");
      if (prepared) seen.add(og);
      if (prepared) {
        found.push(`cover ${Math.round(prepared.byteLength / 1024)} KB`);
        if (APPLY) {
          const stored = await store(prepared, school.slug);
          if (stored) {
            await db.from("schools").update({ cover_url: stored }).eq("id", school.id);
            covers += 1;
          }
        } else covers += 1;
      }
    }
    if (ONLY !== "cover" && !school.logo_url && logo && !seen.has(logo)) {
      const prepared = await prepare(await fetchImage(logo), "logo");
      if (prepared) seen.add(logo);
      if (prepared) {
        found.push(`logo ${Math.round(prepared.byteLength / 1024)} KB`);
        if (APPLY) {
          const stored = await store(prepared, school.slug);
          if (stored) {
            await db.from("schools").update({ logo_url: stored }).eq("id", school.id);
            logos += 1;
          }
        } else logos += 1;
      }
    }

    console.log(`${school.slug.padEnd(44)} ${found.length ? found.join(" + ") : "no usable image"}`);
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`\ncovers: ${covers}, logos: ${logos}, sites without usable images: ${skipped}`);
  if (!APPLY) console.log("Nothing was written. Re-run with --apply to store these pictures.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
