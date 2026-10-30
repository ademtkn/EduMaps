"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { rateLimit } from "@/lib/security/rate-limit";
import { sanitizeLine, sanitizeMultiline } from "@/lib/security/sanitize";
import { detectSpam } from "@/lib/security/spam";
import { commentSchema, postSchema, profileSchema, reportSchema, reviewSchema } from "@/lib/validation/schemas";
import { fail, fromDatabaseError, fromZod, type ActionResult } from "./result";
import { getMember } from "./session";

function clean<T extends Record<string, unknown>>(input: unknown, multiline: string[], lines: string[]): T {
  const out: Record<string, unknown> = { ...(input && typeof input === "object" ? (input as Record<string, unknown>) : {}) };
  for (const key of multiline) if (typeof out[key] === "string") out[key] = sanitizeMultiline(out[key] as string);
  for (const key of lines) if (typeof out[key] === "string") out[key] = sanitizeLine(out[key] as string);
  return out as T;
}

export async function submitReviewAction(input: unknown): Promise<ActionResult<{ status: string }>> {
  const member = await getMember();
  if (!member) return fail("unauthenticated");

  const parsed = reviewSchema.safeParse(clean(input, ["body"], ["title"]));
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  if (v.website) return { ok: true, data: { status: "pending" } };

  if (!rateLimit(`review:${member.user.id}`, 6, 10 * 60_000).ok) return fail("rate_limited");
  if (detectSpam(`${v.title} ${v.body}`)) return fail("spam_detected");

  const nullable = (n: number | undefined) => (n && n >= 1 && n <= 5 ? n : null);
  const fields = {
    relationship: v.relationship,
    rating: v.rating,
    rating_teaching: nullable(v.ratingTeaching),
    rating_facilities: nullable(v.ratingFacilities),
    rating_safety: nullable(v.ratingSafety),
    rating_communication: nullable(v.ratingCommunication),
    title: v.title,
    body: v.body,
  };

  const { supabase, user } = member;
  const { data: existing } = await supabase
    .from("reviews").select("id").eq("school_id", v.schoolId).eq("user_id", user.id).maybeSingle();

  const result = existing
    ? await supabase.from("reviews").update(fields).eq("id", existing.id).select("status").single()
    : await supabase.from("reviews").insert({ ...fields, school_id: v.schoolId, user_id: user.id, body_hash: "" }).select("status").single();

  if (result.error) return fromDatabaseError(result.error);
  return { ok: true, data: { status: result.data.status } };
}

export async function deleteReviewAction(reviewId: string): Promise<ActionResult> {
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  if (!z.string().uuid().safeParse(reviewId).success) return fail("validation");
  const { error } = await member.supabase.from("reviews").delete().eq("id", reviewId).eq("user_id", member.user.id);
  if (error) return fromDatabaseError(error);
  revalidateTag("public-data");
  return { ok: true };
}

export async function toggleHelpfulAction(reviewId: string): Promise<ActionResult<{ helpful: boolean }>> {
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  if (!z.string().uuid().safeParse(reviewId).success) return fail("validation");
  if (!rateLimit(`vote:${member.user.id}`, 60, 60_000).ok) return fail("rate_limited");

  const { supabase, user } = member;
  const { data: existing } = await supabase
    .from("review_votes").select("review_id").eq("review_id", reviewId).eq("user_id", user.id).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("review_votes").delete().eq("review_id", reviewId).eq("user_id", user.id);
    return error ? fromDatabaseError(error) : { ok: true, data: { helpful: false } };
  }
  const { error } = await supabase.from("review_votes").insert({ review_id: reviewId, user_id: user.id, is_helpful: true });
  return error ? fromDatabaseError(error) : { ok: true, data: { helpful: true } };
}

export async function reportContentAction(input: unknown): Promise<ActionResult> {
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  const parsed = reportSchema.safeParse(clean(input, [], ["reason"]));
  if (!parsed.success) return fromZod(parsed.error);
  if (!rateLimit(`report:${member.user.id}`, 10, 60 * 60_000).ok) return fail("rate_limited");

  const { error } = await member.supabase.from("content_reports").insert({
    reporter_id: member.user.id,
    entity_type: parsed.data.entityType,
    entity_id: parsed.data.entityId,
    reason: parsed.data.reason,
  });
  // A second report of the same item by the same member is not an error from their point of view.
  if (error && error.code !== "23505") return fromDatabaseError(error);
  return { ok: true };
}

export async function submitPostAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  const parsed = postSchema.safeParse(clean(input, ["body"], ["title"]));
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  if (v.website) return { ok: true, data: { id: "" } };

  if (!rateLimit(`post:${member.user.id}`, 5, 10 * 60_000).ok) return fail("rate_limited");
  if (detectSpam(`${v.title} ${v.body}`)) return fail("spam_detected");

  const { data, error } = await member.supabase
    .from("community_posts")
    .insert({ category_id: v.categoryId, user_id: member.user.id, title: v.title, body: v.body, body_hash: "" })
    .select("id")
    .single();
  if (error) return fromDatabaseError(error);
  return { ok: true, data: { id: data.id } };
}

export async function deletePostAction(postId: string): Promise<ActionResult> {
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  if (!z.string().uuid().safeParse(postId).success) return fail("validation");
  const { error } = await member.supabase.from("community_posts").delete().eq("id", postId).eq("user_id", member.user.id);
  if (error) return fromDatabaseError(error);
  revalidateTag("public-data");
  return { ok: true };
}

export async function submitCommentAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  const parsed = commentSchema.safeParse(clean(input, ["body"], []));
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  if (v.website) return { ok: true, data: { id: "" } };

  if (!rateLimit(`comment:${member.user.id}`, 10, 5 * 60_000).ok) return fail("rate_limited");
  if (detectSpam(v.body)) return fail("spam_detected");

  const { data, error } = await member.supabase
    .from("community_comments")
    .insert({ post_id: v.postId, user_id: member.user.id, body: v.body })
    .select("id")
    .single();
  if (error) return fromDatabaseError(error);
  revalidateTag("public-data");
  return { ok: true, data: { id: data.id } };
}

export async function deleteCommentAction(commentId: string): Promise<ActionResult> {
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  if (!z.string().uuid().safeParse(commentId).success) return fail("validation");
  const { error } = await member.supabase.from("community_comments").delete().eq("id", commentId).eq("user_id", member.user.id);
  if (error) return fromDatabaseError(error);
  revalidateTag("public-data");
  return { ok: true };
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const member = await getMember();
  if (!member) return fail("unauthenticated");
  const parsed = profileSchema.safeParse(clean(input, ["bio"], ["displayName"]));
  if (!parsed.success) return fromZod(parsed.error);

  const { error } = await member.supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      bio: parsed.data.bio || null,
      city_id: parsed.data.cityId || null,
      preferred_lang: parsed.data.preferredLang,
    })
    .eq("user_id", member.user.id);
  if (error) return fromDatabaseError(error);
  return { ok: true };
}
