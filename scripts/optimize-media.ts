/**
 * Shrinks pictures that are already in the media library (uploaded before automatic optimisation existed).
 *
 *   npm run media:optimize            shows what would be saved, changes nothing
 *   npm run media:optimize -- --apply converts the pictures and updates every page that uses them
 *
 * Each picture is converted to WebP (max 1600 px, hidden metadata removed), uploaded under a new name, every
 * reference to the old address is switched over, and only then is the old file deleted.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Database } from "../src/lib/database.types";
import { formatBytes } from "../src/lib/media/format";
import { optimizeImage } from "../src/lib/media/optimize";

config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

const apply = process.argv.includes("--apply");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (apply && !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url) && process.env.ALLOW_REMOTE_MEDIA !== "1") {
  console.error(`Refusing to change a non-local project (${url}). Set ALLOW_REMOTE_MEDIA=1 to confirm.`);
  process.exit(1);
}
const db: SupabaseClient<Database> = createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

/** Every column that can hold the address of a library picture. */
const REFERENCES = [
  ["schools", "logo_url"], ["schools", "cover_url"], ["school_media", "url"], ["articles", "cover_url"], ["advertisements", "image_url"], ["profiles", "avatar_url"],
] as const;

async function main() {
  const { data: files, error } = await db.from("media_files").select("*").in("mime_type", ["image/jpeg", "image/png", "image/webp", "image/avif"]).order("created_at");
  if (error) throw error;
  console.log(`${apply ? "Converting" : "Checking"} ${files?.length ?? 0} picture(s)${apply ? "" : " (dry run: add --apply to change them)"}\n`);

  let before = 0;
  let after = 0;
  let changed = 0;
  for (const file of files ?? []) {
    const download = await db.storage.from(file.bucket).download(file.path);
    if (download.error || !download.data) {
      console.log(`  ! ${file.path}: cannot download (${download.error?.message})`);
      continue;
    }
    const original = Buffer.from(await download.data.arrayBuffer());
    let result;
    try {
      result = await optimizeImage(original);
    } catch (e) {
      console.log(`  ! ${file.path}: ${e instanceof Error ? e.message : e}`);
      continue;
    }
    const unchanged = result.bytes === original || (file.mime_type === "image/webp" && result.outputBytes > original.length * 0.9);
    before += original.length;
    after += unchanged ? original.length : result.outputBytes;
    if (unchanged) {
      console.log(`  = ${file.path}  ${formatBytes(original.length)} (already small)`);
      continue;
    }
    console.log(`  ${apply ? "→" : "·"} ${file.path}  ${formatBytes(original.length)} → ${formatBytes(result.outputBytes)} (${result.width}×${result.height})`);
    if (!apply) continue;

    const now = new Date(file.created_at);
    const newPath = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;
    const up = await db.storage.from(file.bucket).upload(newPath, result.bytes, { contentType: "image/webp", cacheControl: "31536000" });
    if (up.error) {
      console.log(`    ! upload failed: ${up.error.message}`);
      continue;
    }
    const newUrl = db.storage.from(file.bucket).getPublicUrl(newPath).data.publicUrl;
    let failed = false;
    for (const [table, column] of REFERENCES) {
      const r = await (db.from(table) as never as { update: (v: object) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } }).update({ [column]: newUrl }).eq(column, file.public_url);
      if (r.error) {
        console.log(`    ! ${table}.${column}: ${r.error.message}`);
        failed = true;
      }
    }
    await db.from("school_media").update({ storage_path: newPath }).eq("storage_path", file.path);
    const upd = await db.from("media_files").update({ path: newPath, public_url: newUrl, mime_type: "image/webp", size_bytes: result.outputBytes }).eq("id", file.id);
    if (upd.error || failed) {
      console.log(`    ! kept the old file because something failed (${upd.error?.message ?? "reference update"})`);
      continue;
    }
    await db.storage.from(file.bucket).remove([file.path]);
    changed += 1;
  }
  if (before === 0) return console.log("Nothing to optimise.");
  console.log(`\n${apply ? `${changed} picture(s) converted. ` : ""}Total ${formatBytes(before)} → ${formatBytes(after)}${before ? ` (${Math.round((1 - after / before) * 100)}% smaller)` : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
