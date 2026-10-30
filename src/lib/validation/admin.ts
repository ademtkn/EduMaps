import { z } from "zod";
import { AD_CUSTOMER_TYPES, AD_PLACEMENTS, MAX_DOCUMENTS, PLAN_LIMITS, PLANS, SCHOOL_TYPES } from "@/lib/constants";
import { EXTRA_PERIODS, FEE_PERIODS } from "@/lib/fees";
import { parseMapLink, type MapService } from "@/lib/map-links";
import { normalizeWhatsapp } from "@/lib/whatsapp";

const optionKey = z.string().regex(/^[a-z0-9_]{1,40}$/, "Invalid option");

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens").max(90);
const uuid = z.string().uuid();
const url = z.string().trim().url().regex(/^https?:\/\//i, "Must start with http:// or https://").max(500);
/** A latitude or longitude that may be left empty (an empty cell must never become 0). */
export const coordinate = (min: number, max: number) =>
  z.union([z.literal(""), z.null(), z.coerce.number().min(min).max(max)]).optional().transform((v) => (v === "" || v == null ? null : v));
export const optionalUrl = z.union([url, z.literal("")]).optional().transform((v) => v || null);
/** A Google Maps or 2GIS link, or empty. Anything else (another site, a look-alike host, plain text) is refused. */
export const mapLink = (service: MapService) =>
  z.string().optional().transform((raw, ctx) => {
    if (!raw?.trim()) return null;
    const result = parseMapLink(service, raw);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.error });
      return z.NEVER;
    }
    return result.url;
  });
export const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
export const optionalInt = (min: number, max: number) =>
  // The empty cases come first: z.coerce.number() would turn "" into 0, which would make a blank fee look like "Free".
  z.union([z.literal(""), z.null(), z.coerce.number().int().min(min).max(max)]).optional().transform((v) => (v === "" || v == null ? null : v));

/** {kg, ru, en}: blank languages are dropped; `en` is required when `requireEn` is set (the database enforces it). */
export function i18n(max: number, requireEn = false) {
  return z
    .object({ kg: z.string().max(max).optional(), ru: z.string().max(max).optional(), en: z.string().max(max).optional() })
    .transform((value) => {
      const out: Record<string, string> = {};
      for (const key of ["kg", "ru", "en"] as const) {
        const v = value[key]?.trim();
        if (v) out[key] = v;
      }
      return out;
    })
    .refine((v) => !requireEn || Boolean(v.en), { message: "English text is required" });
}
export const i18nOptional = (max: number) => i18n(max).transform((v) => (Object.keys(v).length ? v : null));

export const schoolPayloadSchema = z
  .object({
    id: uuid.optional().nullable(),
    slug,
    name: i18n(160, true),
    tagline: i18nOptional(200),
    about: i18nOptional(6000),
    city_id: uuid,
    school_type: z.enum(SCHOOL_TYPES),
    education_systems: z.array(optionKey),
    grade_from: z.coerce.number().int().min(0).max(11),
    grade_to: z.coerce.number().int().min(1).max(12),
    founded_year: optionalInt(1800, 2100),
    student_count: optionalInt(0, 100000),
    teacher_count: optionalInt(0, 10000),
    avg_class_size: optionalInt(1, 80),
    opening_time: z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM"), z.literal("")]).optional().transform((v) => v || null),
    closing_time: z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM"), z.literal("")]).optional().transform((v) => v || null),
    working_days: z.array(z.number().int().min(1).max(7)).default([]).transform((d) => [...new Set(d)].sort((a, b) => a - b)),
    schedule_notes: i18nOptional(300),
    fee_min: optionalInt(0, 100_000_000),
    fee_max: optionalInt(0, 100_000_000),
    fee_period: z.enum(FEE_PERIODS).default("month"),
    fee_billing_months: z.coerce.number().int().min(9).max(12).default(9),
    tuition_notes: i18nOptional(1000),
    has_scholarships: z.boolean(),
    scholarships: i18nOptional(1000),
    has_transportation: z.boolean(),
    transportation_info: i18nOptional(1000),
    has_boarding: z.boolean(),
    boarding_info: i18nOptional(1000),
    phone: optionalText(40),
    email: z.union([z.string().trim().email().max(120), z.literal("")]).optional().transform((v) => v || null),
    website: optionalUrl,
    whatsapp: z.string().trim().optional().default("").transform((v, ctx) => {
      if (!v) return null;
      const number = normalizeWhatsapp(v);
      if (!number) ctx.addIssue({ code: "custom", message: "Enter a valid phone number, e.g. +996 555 123 456" });
      return number;
    }),
    social: z.record(z.string(), z.union([url, z.literal("")])).transform((rec) => Object.fromEntries(Object.entries(rec).filter(([, v]) => v))),
    logo_url: optionalUrl,
    cover_url: optionalUrl,
    status: z.enum(["draft", "published", "archived"]),
    is_featured: z.boolean(),
    data_status: z.enum(["demo", "unverified", "verified"]).default("verified"),
    // The address is enough: without coordinates the school is listed with its address but not shown on the map.
    location: z
      .object({
        lat: coordinate(39, 44),
        lng: coordinate(69, 81),
        address: i18n(300, true),
        district: optionalText(80),
        google_maps_url: mapLink("google"),
        twogis_url: mapLink("twogis"),
      })
      .refine((l) => (l.lat == null) === (l.lng == null), { path: ["lng"], message: "Enter both latitude and longitude, or neither" })
      .nullable(),
    languages: z.array(z.object({ code: z.string().regex(/^[a-z]{2,3}$/, "Invalid language"), is_primary: z.boolean() })),
    programs: z.array(z.object({ kind: z.enum(["academic", "club", "sport"]), name: i18n(160, true), description: i18nOptional(500) })),
    facilities: z.array(z.object({ facility_key: optionKey, note: i18nOptional(200) })),
    fee_items: z
      .array(
        z
          .object({
            item_key: optionKey,
            included: z.boolean(),
            extra_amount: optionalInt(0, 100_000_000),
            extra_period: z.union([z.enum(EXTRA_PERIODS), z.literal(""), z.null()]).optional().transform((v) => v || null),
          })
          .refine((i) => i.included || (i.extra_amount == null) === (i.extra_period == null), { path: ["extra_amount"], message: "Enter both the amount and how often it is paid, or neither" })
      )
      .refine((items) => new Set(items.map((i) => i.item_key)).size === items.length, { message: "Each item can only be listed once" })
      .default([]),
    plan: z.enum(PLANS).default("free"),
    media: z.array(z.object({ kind: z.enum(["image", "video"]), url, storage_path: optionalText(300), caption: i18nOptional(200) })),
    documents: z
      .array(
        z.object({
          title: z.string().trim().min(2, "Give the document a title").max(120),
          url: z.string().trim().regex(/^https:\/\/[^\s]+$/i, "Use a full link that starts with https://").max(500),
        })
      )
      .max(MAX_DOCUMENTS, `At most ${MAX_DOCUMENTS} documents per school`)
      .default([]),
    faqs: z.array(z.object({ question: i18n(300, true), answer: i18n(2000, true) })),
  })
  .superRefine((v, ctx) => {
    const limits = PLAN_LIMITS[v.plan];
    const photos = v.media.filter((m) => m.kind === "image").length;
    const videos = v.media.filter((m) => m.kind === "video").length;
    if (photos > limits.photos) ctx.addIssue({ code: "custom", path: ["media"], message: `The ${v.plan === "pro" ? "Pro" : "Free"} plan allows ${limits.photos} gallery photos; this school has ${photos}. Remove some, or change the plan.` });
    if (videos > limits.videos) ctx.addIssue({ code: "custom", path: ["media"], message: `The ${v.plan === "pro" ? "Pro" : "Free"} plan allows ${limits.videos} video${limits.videos === 1 ? "" : "s"}; this school has ${videos}. Remove some, or change the plan.` });
  })
  .refine((v) => !v.opening_time || !v.closing_time || v.closing_time > v.opening_time, { path: ["closing_time"], message: "Closing time must be after opening time" })
  .refine((v) => v.grade_to >= v.grade_from, { path: ["grade_to"], message: "Last grade must be ≥ first grade" })
  .refine((v) => v.fee_min == null || v.fee_max == null || v.fee_max >= v.fee_min, { path: ["fee_max"], message: "Max must be ≥ min" });
export type SchoolPayload = z.output<typeof schoolPayloadSchema>;


export const articlePayloadSchema = z
  .object({
    id: uuid.optional().nullable(),
    slug,
    category_id: uuid,
    kind: z.enum(["article", "video", "guide"]),
    title: i18n(200, true),
    excerpt: i18nOptional(400),
    body: i18nOptional(60000),
    cover_url: optionalUrl,
    video_url: optionalUrl,
    tags: z.array(z.string().trim().toLowerCase().regex(/^[\p{L}\p{N}-]+$/u).max(30)).max(10),
    reading_minutes: z.coerce.number().int().min(1).max(120),
    status: z.enum(["draft", "published", "archived"]),
    is_featured: z.boolean(),
  })
  .refine((v) => v.kind !== "video" || Boolean(v.video_url), { path: ["video_url"], message: "A YouTube URL is required for videos" });
export type ArticlePayload = z.output<typeof articlePayloadSchema>;

export const categoryPayloadSchema = z.object({
  id: uuid.optional().nullable(),
  type: z.enum(["article", "community"]),
  slug,
  name: i18n(80, true),
  description: i18nOptional(300),
  sort_order: z.coerce.number().int().min(0).max(999),
});

export const adPayloadSchema = z
  .object({
    id: uuid.optional().nullable(),
    advertiser_name: z.string().trim().min(2).max(120),
    customer_type: z.enum(AD_CUSTOMER_TYPES),
    placement: z.enum(AD_PLACEMENTS),
    headline: i18n(120, true),
    body: i18nOptional(300),
    cta_label: i18nOptional(30),
    image_url: optionalUrl,
    target_url: url,
    target_languages: z.array(z.enum(["kg", "ru", "en"])),
    starts_at: z.string().min(1),
    ends_at: z.string().optional().transform((v) => v || null),
    is_active: z.boolean(),
  })
  .refine((v) => !v.ends_at || new Date(v.ends_at) > new Date(v.starts_at), { path: ["ends_at"], message: "End must be after start" });
export type AdPayload = z.output<typeof adPayloadSchema>;

/** A guest voice added by an administrator, with a record of how the person gave permission. */
export const guestVoiceSchema = z.object({
  id: uuid.optional().nullable(),
  author_name: z.string().trim().min(2, "Enter the person's name").max(80),
  author_title: optionalText(100),
  quote: i18n(400).refine((v) => Object.keys(v).length > 0, { message: "Write the opinion in at least one language" }),
  consent_note: z.string().trim().min(5, "Say how the person gave permission").max(300),
  status: z.enum(["pending", "published"]),
  is_demo: z.boolean().default(false),
});
export type GuestVoiceInput = z.input<typeof guestVoiceSchema>;

export const catalogItemSchema = z.object({
  type: z.enum(["system", "facility", "language", "fee"]),
  key: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(_[a-z0-9]+)*$/, "Use lowercase letters, numbers and underscores").max(40),
  isNew: z.boolean(),
  name: i18n(80, true),
  icon: z.string().trim().max(30).default("check"),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_active: z.boolean(),
});
