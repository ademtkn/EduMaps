import { z } from "zod";
import { LANGS } from "@/lib/i18n/config";

/**
 * Validation schemas shared by client forms (react-hook-form) and server actions.
 * Error messages are dictionary keys under `errors.*`, translated at render time.
 */
const requiredText = (min: number, max: number) =>
  z.string({ message: "required" }).trim().min(min, { message: min <= 1 ? "required" : "too_short" }).max(max, { message: "too_long" });

const uuid = z.string({ message: "required" }).uuid({ message: "invalid" });
const honeypot = z.string().max(0, { message: "invalid" }).optional();
const optionalRating = z.coerce.number().int().min(0).max(5);

export const loginSchema = z.object({
  email: z.string({ message: "required" }).trim().toLowerCase().email({ message: "invalid_email" }).max(254),
  password: z.string({ message: "required" }).min(1, { message: "required" }).max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  displayName: requiredText(2, 60),
  email: z.string({ message: "required" }).trim().toLowerCase().email({ message: "invalid_email" }).max(254),
  password: z
    .string({ message: "required" })
    .min(8, { message: "password_weak" })
    .max(72, { message: "too_long" })
    .regex(/[A-Za-zА-Яа-яЁёҢңӨөҮү]/u, { message: "password_weak" })
    .regex(/\d/, { message: "password_weak" }),
  lang: z.enum(LANGS),
  consent: z.literal(true, { message: "consent_required" }),
  website: honeypot,
});
export type RegisterInput = z.infer<typeof registerSchema>;

const passwordRule = z
  .string({ message: "required" })
  .min(8, { message: "password_weak" })
  .max(72, { message: "too_long" })
  .regex(/[A-Za-zА-Яа-яЁёҢңӨөҮү]/u, { message: "password_weak" })
  .regex(/\d/, { message: "password_weak" });
const emailRule = z.string({ message: "required" }).trim().toLowerCase().email({ message: "invalid_email" }).max(254);

export const forgotPasswordSchema = z.object({ email: emailRule, website: honeypot });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password: passwordRule, confirm: z.string({ message: "required" }) })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "password_mismatch" });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({ currentPassword: z.string({ message: "required" }).min(1, { message: "required" }).max(200), password: passwordRule, confirm: z.string({ message: "required" }) })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "password_mismatch" });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changeEmailSchema = z.object({ email: emailRule, password: z.string({ message: "required" }).min(1, { message: "required" }).max(200) });
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;

export const deleteAccountSchema = z.object({ password: z.string({ message: "required" }).min(1, { message: "required" }).max(200), understood: z.literal(true, { message: "required" }) });
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const FEEDBACK_ROLES = ["parent", "student", "alumni", "teacher", "other"] as const;

export const feedbackSchema = z.object({
  quote: requiredText(20, 400),
  role: z.union([z.enum(FEEDBACK_ROLES), z.literal("")]).optional().default(""),
  consent: z.literal(true, { message: "consent_required" }),
  lang: z.enum(LANGS),
  website: honeypot,
});
export type FeedbackInput = z.input<typeof feedbackSchema>;

export const CORRECTION_TOPICS = ["contact", "address", "fees", "hours", "programs", "closed", "missing", "other"] as const;
export const REPORTER_ROLES = ["visitor", "parent", "school_staff", "other"] as const;

export const correctionSchema = z
  .object({
    schoolId: uuid,
    topic: z.enum(CORRECTION_TOPICS, { message: "required" }),
    message: requiredText(10, 2000),
    source: z.string().trim().max(300, { message: "too_long" }).optional().default(""),
    name: z.string().trim().max(80, { message: "too_long" }).optional().default(""),
    email: z.union([emailRule, z.literal("")]).optional().default(""),
    phone: z.string().trim().max(40, { message: "too_long" }).optional().default(""),
    role: z.enum(REPORTER_ROLES).optional().default("visitor"),
    consent: z.boolean().optional(),
    lang: z.enum(LANGS),
    website: honeypot,
  })
  .refine((v) => !(v.email || v.phone) || v.consent === true, { path: ["consent"], message: "consent_required" })
  .refine((v) => v.role !== "school_staff" || Boolean(v.email || v.phone), { path: ["email"], message: "contact_needed" });
export type CorrectionInput = z.input<typeof correctionSchema>;

export const CONTACT_TOPICS = ["support", "add_school", "correction", "advertising", "privacy", "other"] as const;

export const contactSchema = z.object({
  name: requiredText(2, 80),
  email: z.string({ message: "required" }).trim().toLowerCase().email({ message: "invalid_email" }).max(254),
  topic: z.enum(CONTACT_TOPICS, { message: "required" }),
  school: z.string().trim().max(200, { message: "too_long" }).optional().default(""),
  message: requiredText(10, 4000),
  consent: z.literal(true, { message: "consent_required" }),
  lang: z.enum(LANGS),
  website: honeypot,
});
export type ContactInput = z.input<typeof contactSchema>;

export const reviewSchema = z.object({
  schoolId: uuid,
  relationship: z.enum(["parent", "student", "alumni", "teacher"], { message: "required" }),
  rating: z.coerce.number({ message: "required" }).int({ message: "required" }).min(1, { message: "required" }).max(5),
  ratingTeaching: optionalRating.default(0),
  ratingFacilities: optionalRating.default(0),
  ratingSafety: optionalRating.default(0),
  ratingCommunication: optionalRating.default(0),
  title: requiredText(3, 120),
  body: requiredText(30, 3000),
  website: honeypot,
});
export type ReviewInput = z.input<typeof reviewSchema>;

export const postSchema = z.object({
  categoryId: uuid,
  title: requiredText(5, 160),
  body: requiredText(20, 5000),
  website: honeypot,
});
export type PostInput = z.infer<typeof postSchema>;

export const commentSchema = z.object({
  postId: uuid,
  body: requiredText(2, 2000),
  website: honeypot,
});
export type CommentInput = z.infer<typeof commentSchema>;

export const reportSchema = z.object({
  entityType: z.enum(["review", "post", "comment"]),
  entityId: uuid,
  reason: requiredText(3, 500),
});
export type ReportInput = z.infer<typeof reportSchema>;

export const profileSchema = z.object({
  displayName: requiredText(2, 60),
  bio: z.string().trim().max(500, { message: "too_long" }).default(""),
  cityId: z.union([uuid, z.literal("")]).default(""),
  preferredLang: z.enum(LANGS),
});
export type ProfileInput = z.input<typeof profileSchema>;
