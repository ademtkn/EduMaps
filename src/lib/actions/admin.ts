"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import type { Database } from "@/lib/database.types";
import { MediaError, optimizeImage } from "@/lib/media/optimize";
import { sanitizeLine, sanitizeMultiline } from "@/lib/security/sanitize";
import { rateLimit } from "@/lib/security/rate-limit";
import { adPayloadSchema, articlePayloadSchema, catalogItemSchema, categoryPayloadSchema, guestVoiceSchema, schoolPayloadSchema } from "@/lib/validation/admin";
import { resolveMapLink } from "@/lib/map-links-resolve";
import type { MapService } from "@/lib/map-links";
import { requireRole } from "./admin-auth";

export type AdminResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

const fail = (error: string, fieldErrors?: Record<string, string>): AdminResult<never> => ({ ok: false, error, fieldErrors });
const uuid = z.string().uuid();

function zodFail(error: z.ZodError): AdminResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[issue.path.join(".") || "_"] ??= issue.message;
  const first = error.issues[0];
  return fail(`${first?.path.join(".") || "form"}: ${first?.message ?? "Invalid input"}`, fieldErrors);
}

function dbFail(error: { message: string; code?: string }): AdminResult<never> {
  if (error.code === "23505") return fail("That slug (or value) is already in use.");
  if (error.code === "23503") return fail("This record is still referenced by other data.");
  if (error.code === "42501") return fail("You do not have permission to do that.");
  return fail(error.message);
}

const refreshPublic = () => revalidateTag("public-data");

// ---------------------------------------------------------------------------
// Schools
// ---------------------------------------------------------------------------
export async function saveSchoolAction(input: unknown): Promise<AdminResult<{ id: string }>> {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return fail("Not authorized.");
  const parsed = schoolPayloadSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const { data, error } = await ctx.supabase.rpc("admin_save_school", { p: parsed.data as never });
  if (error) return dbFail(error);
  // data_status is stored outside the RPC payload contract.
  await ctx.supabase.from("schools").update({ data_status: parsed.data.data_status }).eq("id", data as string);
  refreshPublic();
  revalidatePath("/admin/schools");
  return { ok: true, data: { id: data as string } };
}

export async function deleteSchoolAction(id: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("schools").delete().eq("id", id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/schools");
  return { ok: true };
}

export async function setSchoolStatusAction(id: string, status: "draft" | "published" | "archived"): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("schools").update({ status }).eq("id", id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/schools");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Review and community moderation (admins and moderators)
// ---------------------------------------------------------------------------
const moderationInput = z.object({
  id: uuid,
  status: z.enum(["pending", "published", "rejected", "hidden"]).optional(),
  note: z.string().trim().max(500).optional(),
  flagged: z.boolean().optional(),
  pinned: z.boolean().optional(),
});

export async function moderateReviewAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireRole(["admin", "moderator"]);
  if (!ctx) return fail("Not authorized.");
  const parsed = moderationInput.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const { id, status, note, flagged } = parsed.data;

  const patch: Database["public"]["Tables"]["reviews"]["Update"] = {};
  if (status) patch.status = status;
  if (note !== undefined) patch.moderation_note = sanitizeLine(note) || null;
  if (flagged !== undefined) patch.is_flagged = flagged;
  const { error } = await ctx.supabase.from("reviews").update(patch).eq("id", id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function editReviewAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireRole(["admin", "moderator"]);
  if (!ctx) return fail("Not authorized.");
  const parsed = z.object({ id: uuid, title: z.string().trim().min(3).max(120), body: z.string().trim().min(30).max(3000) }).safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const { error } = await ctx.supabase
    .from("reviews")
    .update({ title: sanitizeLine(parsed.data.title), body: sanitizeMultiline(parsed.data.body) })
    .eq("id", parsed.data.id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function deleteReviewAdminAction(id: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin", "moderator"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("reviews").delete().eq("id", id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function moderatePostAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireRole(["admin", "moderator"]);
  if (!ctx) return fail("Not authorized.");
  const parsed = moderationInput.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const { id, status, note, flagged, pinned } = parsed.data;

  const patch: Database["public"]["Tables"]["community_posts"]["Update"] = {};
  if (status) patch.status = status;
  if (note !== undefined) patch.moderation_note = sanitizeLine(note) || null;
  if (flagged !== undefined) patch.is_flagged = flagged;
  if (pinned !== undefined) patch.is_pinned = pinned;
  const { error } = await ctx.supabase.from("community_posts").update(patch).eq("id", id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/community");
  return { ok: true };
}

export async function deletePostAdminAction(id: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin", "moderator"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("community_posts").delete().eq("id", id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/community");
  return { ok: true };
}

export async function moderateCommentAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireRole(["admin", "moderator"]);
  if (!ctx) return fail("Not authorized.");
  const parsed = z.object({ id: uuid, status: z.enum(["published", "hidden"]).optional(), flagged: z.boolean().optional() }).safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const patch: Database["public"]["Tables"]["community_comments"]["Update"] = {};
  if (parsed.data.status) patch.status = parsed.data.status;
  if (parsed.data.flagged !== undefined) patch.is_flagged = parsed.data.flagged;
  const { error } = await ctx.supabase.from("community_comments").update(patch).eq("id", parsed.data.id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/community");
  return { ok: true };
}

export async function deleteCommentAdminAction(id: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin", "moderator"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("community_comments").delete().eq("id", id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/community");
  return { ok: true };
}

export async function resolveReportsAction(entityType: "review" | "post" | "comment", entityId: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin", "moderator"]);
  if (!ctx || !uuid.safeParse(entityId).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("content_reports").update({ is_resolved: true }).eq("entity_type", entityType).eq("entity_id", entityId);
  if (error) return dbFail(error);
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/community");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Articles, videos and categories
// ---------------------------------------------------------------------------
export async function saveArticleAction(input: unknown): Promise<AdminResult<{ id: string }>> {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return fail("Not authorized.");
  const parsed = articlePayloadSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const { id, ...v } = parsed.data;

  const existing = id ? (await ctx.supabase.from("articles").select("status,published_at").eq("id", id).maybeSingle()).data : null;
  const publishedAt = v.status === "published" ? (existing?.published_at ?? new Date().toISOString()) : (existing?.published_at ?? null);
  const row = { ...v, published_at: publishedAt, author_id: ctx.user.id };

  const result = id
    ? await ctx.supabase.from("articles").update({ ...row, author_id: undefined }).eq("id", id).select("id").single()
    : await ctx.supabase.from("articles").insert(row).select("id").single();
  if (result.error) return dbFail(result.error);
  refreshPublic();
  revalidatePath("/admin/articles");
  return { ok: true, data: { id: result.data.id } };
}

export async function deleteArticleAction(id: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("articles").delete().eq("id", id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/articles");
  return { ok: true };
}

export async function saveCategoryAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return fail("Not authorized.");
  const parsed = categoryPayloadSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const { id, type, ...row } = parsed.data;
  const table = type === "article" ? "article_categories" : "community_categories";
  const result = id ? await ctx.supabase.from(table).update(row).eq("id", id) : await ctx.supabase.from(table).insert(row);
  if (result.error) return dbFail(result.error);
  refreshPublic();
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategoryAction(type: "article" | "community", id: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from(type === "article" ? "article_categories" : "community_categories").delete().eq("id", id);
  if (error) return error.code === "23503" ? fail("This category still has content. Move or delete it first.") : dbFail(error);
  refreshPublic();
  revalidatePath("/admin/categories");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Advertisements
// ---------------------------------------------------------------------------
export async function saveAdAction(input: unknown): Promise<AdminResult<{ id: string }>> {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return fail("Not authorized.");
  const parsed = adPayloadSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const { id, starts_at, ends_at, ...rest } = parsed.data;
  const row = { ...rest, starts_at: new Date(starts_at).toISOString(), ends_at: ends_at ? new Date(ends_at).toISOString() : null };

  const result = id
    ? await ctx.supabase.from("advertisements").update(row).eq("id", id).select("id").single()
    : await ctx.supabase.from("advertisements").insert(row).select("id").single();
  if (result.error) return dbFail(result.error);
  refreshPublic();
  revalidatePath("/admin/ads");
  return { ok: true, data: { id: result.data.id } };
}

export async function setAdActiveAction(id: string, active: boolean): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("advertisements").update({ is_active: active }).eq("id", id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/ads");
  return { ok: true };
}

export async function deleteAdAction(id: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("advertisements").delete().eq("id", id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/ads");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Users, languages
// ---------------------------------------------------------------------------
export async function setUserRoleAction(id: string, role: "user" | "moderator" | "admin"): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(id).success || !["user", "moderator", "admin"].includes(role)) return fail("Not authorized.");
  if (id === ctx.user.id) return fail("You cannot change your own role.");
  const { error } = await ctx.supabase.from("users").update({ role }).eq("id", id);
  if (error) return dbFail(error);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserBanAction(id: string, banned: boolean, reason?: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  if (id === ctx.user.id) return fail("You cannot ban yourself.");
  const { error } = await ctx.supabase
    .from("users")
    .update({ is_banned: banned, ban_reason: banned ? sanitizeLine(reason ?? "").slice(0, 300) || null : null })
    .eq("id", id);
  if (error) return dbFail(error);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setLanguageEnabledAction(code: string, enabled: boolean): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !["kg", "ru", "en"].includes(code)) return fail("Not authorized.");
  const { data: lang } = await ctx.supabase.from("languages").select("is_default").eq("code", code).maybeSingle();
  if (lang?.is_default && !enabled) return fail("The default language cannot be disabled.");
  const { error } = await ctx.supabase.from("languages").update({ is_enabled: enabled }).eq("code", code);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/languages");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Media library
// ---------------------------------------------------------------------------
const SIGNATURES: { mime: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/webp", ext: "webp", test: (b) => b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45 },
  { mime: "image/avif", ext: "avif", test: (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 },
];

/** Uploads an image to the public media bucket after checking size and magic bytes (the declared MIME type is not trusted). */
export async function uploadMediaAction(formData: FormData): Promise<AdminResult<{ url: string; id: string; inputBytes: number; outputBytes: number }>> {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return fail("Not authorized.");
  if (!rateLimit(`upload:${ctx.user.id}`, 60, 10 * 60_000).ok) return fail("Too many uploads. Please wait a moment.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Choose an image file.");
  if (file.size > 8 * 1024 * 1024) return fail("Images must be 8 MB or smaller.");

  const original = new Uint8Array(await file.arrayBuffer());
  if (!SIGNATURES.some((s) => s.test(original))) return fail("Only JPEG, PNG, WebP and AVIF images are accepted.");
  // Shrink to web size, convert to WebP and remove hidden metadata (camera, GPS) before anything is stored.
  let image: Awaited<ReturnType<typeof optimizeImage>>;
  try {
    image = await optimizeImage(original);
  } catch (error) {
    return fail(error instanceof MediaError ? error.message : "This file could not be processed as an image.");
  }
  const bytes = image.bytes;
  const type = { mime: image.mime, ext: image.ext };

  const now = new Date();
  const path = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${type.ext}`;
  const { error } = await ctx.supabase.storage.from("media").upload(path, bytes, { contentType: type.mime, cacheControl: "31536000" });
  if (error) return fail(error.message);

  const publicUrl = ctx.supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  const altText = sanitizeLine(String(formData.get("alt") ?? "")).slice(0, 200);
  const { data, error: insertError } = await ctx.supabase
    .from("media_files")
    .insert({ bucket: "media", path, public_url: publicUrl, mime_type: type.mime, size_bytes: image.outputBytes, alt: altText ? { en: altText } : null, uploaded_by: ctx.user.id })
    .select("id")
    .single();
  if (insertError) {
    await ctx.supabase.storage.from("media").remove([path]);
    return dbFail(insertError);
  }
  revalidatePath("/admin/media");
  return { ok: true, data: { url: publicUrl, id: data.id, inputBytes: image.inputBytes, outputBytes: image.outputBytes } };
}

export async function deleteMediaAction(id: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  const { data } = await ctx.supabase.from("media_files").select("bucket,path").eq("id", id).maybeSingle();
  if (!data) return fail("File not found.");
  await ctx.supabase.storage.from(data.bucket).remove([data.path]);
  const { error } = await ctx.supabase.from("media_files").delete().eq("id", id);
  if (error) return dbFail(error);
  revalidatePath("/admin/media");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// School options: education systems, facilities, languages of instruction
// ---------------------------------------------------------------------------
const OPTION_TABLES = { system: "education_systems", facility: "facility_types", language: "language_options", fee: "fee_items" } as const;

export async function saveCatalogItemAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return fail("Not authorized.");
  const parsed = catalogItemSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const { type, key, isNew, name, icon, sort_order, is_active } = parsed.data;
  if (type === "language" && !/^[a-z]{2,3}$/.test(key)) return fail("Language codes are 2–3 letters, e.g. ky, de.");

  const db = ctx.supabase;
  let error: { message: string; code?: string } | null = null;
  if (type === "system") {
    const row = { name, sort_order, is_active };
    ({ error } = isNew ? await db.from("education_systems").insert({ key, ...row }) : await db.from("education_systems").update(row).eq("key", key));
  } else if (type === "facility") {
    const row = { name, icon, sort_order, is_active };
    ({ error } = isNew ? await db.from("facility_types").insert({ key, ...row }) : await db.from("facility_types").update(row).eq("key", key));
  } else if (type === "fee") {
    const row = { name, icon, sort_order, is_active };
    ({ error } = isNew ? await db.from("fee_items").insert({ key, ...row }) : await db.from("fee_items").update(row).eq("key", key));
  } else {
    const row = { name, sort_order, is_active };
    ({ error } = isNew ? await db.from("language_options").insert({ code: key, ...row }) : await db.from("language_options").update(row).eq("code", key));
  }
  if (error) return error.code === "23505" ? fail("An option with that key already exists.") : dbFail(error);
  refreshPublic();
  revalidatePath("/admin/options");
  return { ok: true };
}

export async function deleteCatalogItemAction(type: keyof typeof OPTION_TABLES, key: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !(type in OPTION_TABLES) || !/^[a-z0-9_]{1,40}$/.test(key)) return fail("Not authorized.");
  const { error } =
    type === "system" ? await ctx.supabase.from("education_systems").delete().eq("key", key)
    : type === "facility" ? await ctx.supabase.from("facility_types").delete().eq("key", key)
    : type === "fee" ? await ctx.supabase.from("fee_items").delete().eq("key", key)
    : await ctx.supabase.from("language_options").delete().eq("code", key);
  if (error) {
    if (error.code === "23503" || /in_use/.test(error.message)) return fail("Schools still use this option. Hide it instead, or remove it from those schools first.");
    return dbFail(error);
  }
  refreshPublic();
  revalidatePath("/admin/options");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Contact messages (admins only)
// ---------------------------------------------------------------------------
export async function setContactStatusAction(id: string, status: "new" | "read" | "resolved"): Promise<AdminResult> {
  const ctx = await requireRole(["admin", "moderator"]);
  if (!ctx || !uuid.safeParse(id).success || !["new", "read", "resolved"].includes(status)) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("contact_messages").update({ status }).eq("id", id);
  if (error) return dbFail(error);
  revalidatePath("/admin/messages");
  return { ok: true };
}

export async function deleteContactMessageAction(id: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("contact_messages").delete().eq("id", id);
  if (error) return dbFail(error);
  revalidatePath("/admin/messages");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Correction requests (admins only)
// ---------------------------------------------------------------------------
const note = z.string().trim().max(1000).optional();

export async function setCorrectionStatusAction(id: string, status: "new" | "reviewing" | "applied" | "rejected", adminNote?: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin", "moderator"]);
  if (!ctx || !uuid.safeParse(id).success || !["new", "reviewing", "applied", "rejected"].includes(status) || !note.safeParse(adminNote).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("correction_requests").update({ status, ...(adminNote !== undefined ? { admin_note: sanitizeMultiline(adminNote) || null } : {}) }).eq("id", id);
  if (error) return dbFail(error);
  revalidatePath("/admin/corrections");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Opinions about EduMaps.kg shown on the home page (admins only)
// ---------------------------------------------------------------------------
export async function setTestimonialStatusAction(id: string, status: "pending" | "published" | "rejected", adminNote?: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(id).success || !["pending", "published", "rejected"].includes(status) || !note.safeParse(adminNote).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("site_testimonials").update({ status, ...(adminNote !== undefined ? { admin_note: sanitizeMultiline(adminNote) || null } : {}) }).eq("id", id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/testimonials");
  return { ok: true };
}

export async function saveGuestVoiceAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx) return fail("Not authorized.");
  const parsed = guestVoiceSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const v = parsed.data;
  const row = { kind: "invited" as const, author_name: v.author_name, author_title: v.author_title, quote: v.quote, consent_note: v.consent_note, status: v.status, is_demo: v.is_demo };
  const { error } = v.id ? await ctx.supabase.from("site_testimonials").update(row).eq("id", v.id).eq("kind", "invited") : await ctx.supabase.from("site_testimonials").insert(row);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/testimonials");
  return { ok: true };
}

export async function deleteTestimonialAction(id: string): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(id).success) return fail("Not authorized.");
  const { error } = await ctx.supabase.from("site_testimonials").delete().eq("id", id);
  if (error) return dbFail(error);
  refreshPublic();
  revalidatePath("/admin/testimonials");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// School introduction campaign
// ---------------------------------------------------------------------------
const OUTREACH_STATUSES = ["sent", "replied", "confirmed", "declined"] as const;
const OUTREACH_CHANNELS = ["whatsapp", "email", "both"] as const;

/** Records where a school stands in the introduction campaign. `status: null` puts it back to "not contacted". */
export async function setOutreachAction(
  schoolId: string,
  input: { status: (typeof OUTREACH_STATUSES)[number] | null; channel?: (typeof OUTREACH_CHANNELS)[number] | null; note?: string },
): Promise<AdminResult> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || !uuid.safeParse(schoolId).success) return fail("Not authorized.");
  if (input.status !== null && !OUTREACH_STATUSES.includes(input.status)) return fail("Choose a valid status.");
  if (input.channel && !OUTREACH_CHANNELS.includes(input.channel)) return fail("Choose a valid channel.");
  const note = sanitizeMultiline(input.note ?? "").slice(0, 500);

  if (input.status === null) {
    const { error } = await ctx.supabase.from("school_outreach").delete().eq("school_id", schoolId);
    if (error) return dbFail(error);
  } else {
    const { data: existing } = await ctx.supabase.from("school_outreach").select("contacted_at").eq("school_id", schoolId).maybeSingle();
    const { error } = await ctx.supabase.from("school_outreach").upsert({
      school_id: schoolId,
      status: input.status,
      channel: input.channel ?? null,
      note: note || null,
      contacted_at: existing?.contacted_at ?? new Date().toISOString(),
      updated_by: ctx.user.id,
    });
    if (error) return dbFail(error);
  }
  revalidatePath("/admin/outreach");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Map links pasted into the school form
// ---------------------------------------------------------------------------
/** Checks a Google Maps or 2GIS link and reads its coordinates (following a short link when needed). Nothing is saved. */
export async function readMapLinkAction(service: MapService, raw: string): Promise<AdminResult<{ url: string; lat: number | null; lng: number | null; short: boolean }>> {
  const ctx = await requireRole(["admin"]);
  if (!ctx || (service !== "google" && service !== "twogis") || typeof raw !== "string") return fail("Not authorized.");
  if (!rateLimit(`maplink:${ctx.user.id}`, 60, 60_000).ok) return fail("Too many links checked in a minute. Wait a little and try again.");
  const result = await resolveMapLink(service, raw.slice(0, 1000));
  if (!result.ok) return fail(result.error);
  return { ok: true, data: { url: result.url, lat: result.coords?.lat ?? null, lng: result.coords?.lng ?? null, short: result.short } };
}
