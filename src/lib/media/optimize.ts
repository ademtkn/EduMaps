import sharp, { type Metadata } from "sharp";

/**
 * Every image that enters the media library goes through here: it is turned upright, shrunk to a sensible
 * size, converted to WebP and stripped of hidden metadata (camera model, GPS position, owner name).
 * A 5 MB phone photo typically becomes 100 to 300 KB.
 */
export const MAX_EDGE = 1600;
export const WEBP_QUALITY = 80;
/** Largest picture accepted, in pixels (about 6000 x 6000). Protects the server from decompression bombs. */
export const MAX_PIXELS = 40_000_000;
export { LARGE_BYTES } from "./format";
import { LARGE_BYTES } from "./format";

export class MediaError extends Error {}

export type OptimizedImage = {
  bytes: Buffer;
  mime: "image/webp";
  ext: "webp";
  width: number;
  height: number;
  inputBytes: number;
  outputBytes: number;
  /** True when hidden metadata (EXIF, GPS) was present in the original and has been removed. */
  strippedMetadata: boolean;
};

const ACCEPTED = new Set(["jpeg", "png", "webp", "heif"]);

export async function optimizeImage(input: Uint8Array | Buffer): Promise<OptimizedImage> {
  const source = Buffer.isBuffer(input) ? input : Buffer.from(input);
  let meta: Metadata;
  try {
    meta = await sharp(source, { limitInputPixels: MAX_PIXELS, failOn: "error" }).metadata();
  } catch (error) {
    const text = error instanceof Error ? error.message : "";
    if (/pixel limit|too large/i.test(text)) throw new MediaError("This picture is too large (more than about 6000 × 6000 pixels). Reduce it and try again.");
    throw new MediaError("This file could not be read as an image.");
  }
  if (!meta.format || !ACCEPTED.has(meta.format)) throw new MediaError("Only JPEG, PNG, WebP and AVIF images are accepted.");
  if (meta.format === "heif" && meta.compression !== "av1") throw new MediaError("HEIC photos from iPhones are not supported. Export the photo as JPEG and try again.");
  if (!meta.width || !meta.height) throw new MediaError("This file could not be read as an image.");

  const hadMetadata = Boolean(meta.exif || meta.xmp || meta.iptc);
  // Already a small WebP without hidden data: keep it as it is rather than compress it a second time.
  if (meta.format === "webp" && !hadMetadata && Math.max(meta.width, meta.height) <= MAX_EDGE && (meta.pages ?? 1) === 1 && source.length <= LARGE_BYTES) {
    return { bytes: source, mime: "image/webp", ext: "webp", width: meta.width, height: meta.height, inputBytes: source.length, outputBytes: source.length, strippedMetadata: false };
  }

  try {
    const { data, info } = await sharp(source, { limitInputPixels: MAX_PIXELS, failOn: "error" })
      .rotate() // honour the camera orientation, then the orientation tag is dropped with the other metadata
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    return { bytes: data, mime: "image/webp", ext: "webp", width: info.width, height: info.height, inputBytes: source.length, outputBytes: data.length, strippedMetadata: hadMetadata };
  } catch {
    throw new MediaError("This file could not be processed as an image.");
  }
}

