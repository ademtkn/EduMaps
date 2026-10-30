/**
 * Checks for image optimisation, gallery limits and document links (no database needed).
 *   npm run test:media
 */
import sharp from "sharp";
import { MAX_DOCUMENTS, PLAN_LIMITS } from "../src/lib/constants";
import { documentHost } from "../src/lib/documents";
import { EMPTY_SCHOOL } from "../src/lib/admin-defaults";
import { MAX_EDGE, MediaError, optimizeImage } from "../src/lib/media/optimize";
import { schoolPayloadSchema } from "../src/lib/validation/admin";

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  ✔ ${name}`);
  } else {
    failed += 1;
    console.log(`  ✖ ${name}${detail ? `  → ${detail}` : ""}`);
  }
}

/** A noisy picture, so that JPEG cannot shrink it to nothing (like a real photograph). */
async function photo(width: number, height: number, extra: (s: sharp.Sharp) => sharp.Sharp = (s) => s) {
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = (i * 31 + ((i >> 7) ^ (i >> 3)) * 17) & 255;
  return extra(sharp(raw, { raw: { width, height, channels: 3 } })).jpeg({ quality: 95 }).toBuffer();
}

async function main() {
  console.log("\nImage optimisation");
  const big = await photo(3600, 2400, (s) => s.withExif({ IFD0: { Copyright: "Secret Owner", Make: "Camera Co" } }));
  check("the test photo is large and carries hidden metadata", big.length > 1_000_000 && Boolean((await sharp(big).metadata()).exif));
  const out = await optimizeImage(big);
  const meta = await sharp(out.bytes).metadata();
  check("converted to WebP", meta.format === "webp" && out.mime === "image/webp" && out.ext === "webp");
  check("shrunk to at most 1600 px on the long side, keeping proportions", Math.max(meta.width!, meta.height!) === MAX_EDGE && Math.abs(meta.width! / meta.height! - 1.5) < 0.01, `${meta.width}x${meta.height}`);
  check("much smaller than the original", out.outputBytes < big.length * 0.5, `${big.length} → ${out.outputBytes}`);
  check("hidden metadata (camera, copyright, GPS) is removed", !meta.exif && !meta.xmp && !meta.iptc && out.strippedMetadata);

  const portrait = await photo(1200, 1800, (s) => s.withMetadata({ orientation: 6 }));
  const upright = await optimizeImage(portrait);
  const uMeta = await sharp(upright.bytes).metadata();
  check("a photo taken sideways is turned upright (orientation tag applied, not kept)", uMeta.width === 1600 && uMeta.height === 1067 && (uMeta.orientation ?? 1) === 1, `${uMeta.width}x${uMeta.height}`);

  const small = await sharp({ create: { width: 300, height: 200, channels: 3, background: "#2a7" } }).png().toBuffer();
  const smallOut = await optimizeImage(small);
  const smallMeta = await sharp(smallOut.bytes).metadata();
  check("a small picture is not enlarged", smallMeta.width === 300 && smallMeta.height === 200);

  const transparent = await sharp({ create: { width: 200, height: 200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.4 } } }).png().toBuffer();
  check("transparency (logos) survives", (await sharp((await optimizeImage(transparent)).bytes).metadata()).hasAlpha === true);

  const tidy = await sharp({ create: { width: 400, height: 300, channels: 3, background: "#369" } }).webp().toBuffer();
  const tidyOut = await optimizeImage(tidy);
  check("a small WebP without hidden data is kept as it is (not compressed twice)", tidyOut.bytes.equals(tidy));

  const rejects = async (bytes: Buffer, pattern: RegExp) => {
    try {
      await optimizeImage(bytes);
      return false;
    } catch (e) {
      return e instanceof MediaError && pattern.test(e.message);
    }
  };
  check("a file that is not a picture is refused", await rejects(Buffer.from("this is not an image at all"), /could not be read/));
  check("an SVG is refused", await rejects(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>'), /could not be read|Only JPEG/));
  const huge = await sharp({ create: { width: 7000, height: 7000, channels: 3, background: "#000" } }).png({ compressionLevel: 9 }).toBuffer();
  check("a picture of more than about 40 million pixels is refused", await rejects(huge, /too large/));

  console.log("\nGallery and document limits");
  const base = { ...structuredClone(EMPTY_SCHOOL), name: { en: "Limits" }, slug: "limits", city_id: "11111111-1111-4111-8111-111111111111", education_systems: ["national"], location: null };
  const photos = (n: number) => Array.from({ length: n }, (_, i) => ({ kind: "image" as const, url: `https://example.com/p${i}.webp`, storage_path: "", caption: {} }));
  const videos = (n: number) => Array.from({ length: n }, (_, i) => ({ kind: "video" as const, url: `https://www.youtube.com/watch?v=abcdefghij${i}`, storage_path: "", caption: {} }));
  const ok = (plan: "free" | "pro", p: number, v: number) => schoolPayloadSchema.safeParse({ ...base, plan, media: [...photos(p), ...videos(v)] });
  check("a Free school may show 2 photos and 1 video", ok("free", 2, 1).success);
  const freeTooMany = ok("free", 3, 0);
  check("a third photo on a Free school is refused with a clear message", !freeTooMany.success && freeTooMany.error.issues.some((i) => /Free plan allows 2 gallery photos; this school has 3/.test(i.message)));
  check("a second video on a Free school is refused", !ok("free", 0, 2).success);
  check("a Pro school may show 10 photos and 5 videos", ok("pro", PLAN_LIMITS.pro.photos, PLAN_LIMITS.pro.videos).success);
  check("an eleventh photo or a sixth video on a Pro school is refused", !ok("pro", 11, 0).success && !ok("pro", 0, 6).success);
  check("a school without a plan is treated as Free", !schoolPayloadSchema.safeParse({ ...base, media: photos(3) }).success);
  const docs = (n: number) => Array.from({ length: n }, (_, i) => ({ title: `Document ${i}`, url: `https://drive.google.com/file/d/${i}/view` }));
  check(`${MAX_DOCUMENTS} documents are accepted, one more is refused`, schoolPayloadSchema.safeParse({ ...base, documents: docs(MAX_DOCUMENTS) }).success && !schoolPayloadSchema.safeParse({ ...base, documents: docs(MAX_DOCUMENTS + 1) }).success);
  check("a document link must start with https://", !schoolPayloadSchema.safeParse({ ...base, documents: [{ title: "Rules", url: "http://example.com/rules.pdf" }] }).success && !schoolPayloadSchema.safeParse({ ...base, documents: [{ title: "Rules", url: "javascript:alert(1)" }] }).success);
  check("a document needs a title", !schoolPayloadSchema.safeParse({ ...base, documents: [{ title: "", url: "https://example.com/a.pdf" }] }).success);

  console.log("\nDocument link labels");
  check("well-known drives are named", documentHost("https://drive.google.com/file/d/1/view") === "Google Drive" && documentHost("https://docs.google.com/document/d/1") === "Google Drive" && documentHost("https://www.dropbox.com/s/x/a.pdf") === "Dropbox" && documentHost("https://1drv.ms/b/abc") === "OneDrive" && documentHost("https://disk.yandex.ru/i/abc") === "Yandex Disk");
  check("other links show their site", documentHost("https://www.school-example.kg/files/rules.pdf") === "school-example.kg" && documentHost("not a link") === "");

  console.log(`\n${failed === 0 ? "All" : `${passed}/${passed + failed}`} media checks ${failed === 0 ? `passed (${passed})` : "passed — FAILURES above"}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
