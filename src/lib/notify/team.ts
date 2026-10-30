import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { rateLimit } from "@/lib/security/rate-limit";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL } from "@/lib/utils";

/**
 * Tells the team by email when a visitor sends a message or reports wrong information.
 * Everything is optional: with no SMTP_HOST or NOTIFY_EMAIL_TO nothing is sent and the admin console remains the only queue.
 * A failure here is logged and never reaches the visitor, whose submission has already been saved.
 */

const cache = globalThis as unknown as { __teamMailer?: Transporter };

function recipients(): string[] {
  return (process.env.NOTIFY_EMAIL_TO ?? "").split(",").map((s) => s.trim()).filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
}

function mailer(): Transporter | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT) || 587;
  return (cache.__teamMailer ??= nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  }));
}

const oneLine = (s: string, max = 120) => s.replace(/[\r\n\u2028\u2029]+/g, " ").trim().slice(0, max);

async function send(subject: string, lines: string[], replyTo?: string) {
  const to = recipients();
  const transport = mailer();
  if (!transport || to.length === 0) return;

  // A flood of submissions must not become a flood of email; the rest is waiting in the console.
  if (!rateLimit("notify:team", 20, 60 * 60_000).ok) {
    if (rateLimit("notify:team-limit-notice", 1, 60 * 60_000).ok) {
      await transport.sendMail({
        from: process.env.MAIL_FROM ?? to[0], to,
        subject: "[EduMaps.kg] Many new requests: notifications paused for an hour",
        text: `More than 20 notifications were sent within an hour. New messages keep arriving in the admin console:\n${SITE_URL}/admin/messages\n${SITE_URL}/admin/corrections\n`,
      });
    }
    return;
  }
  await transport.sendMail({ from: process.env.MAIL_FROM ?? to[0], to, replyTo, subject: oneLine(subject, 160), text: lines.join("\n") });
}

function run(task: Promise<void>) {
  task.catch((error: unknown) => console.error("[notify] could not send the team notification:", error instanceof Error ? error.message : error));
}

const TOPICS: Record<string, string> = {
  support: "Website help", add_school: "Add or claim a school", correction: "Correct school information",
  advertising: "Advertising", privacy: "Privacy or account deletion", other: "Other",
};

export function notifyContactMessage(v: { name: string; email: string; topic: string; school?: string; message: string; lang: string }) {
  run(send(
    `[EduMaps.kg] New message: ${TOPICS[v.topic] ?? v.topic}`,
    [
      `From: ${oneLine(v.name)} <${v.email}>`,
      `Topic: ${TOPICS[v.topic] ?? v.topic}`,
      ...(v.school ? [`School: ${oneLine(v.school)}`] : []),
      `Language: ${v.lang}`,
      "",
      v.message.slice(0, 4000),
      "",
      `Reply to this email to answer the sender, then mark it resolved:`,
      `${SITE_URL}/admin/messages`,
    ],
    v.email,
  ));
}

const CORRECTION_TOPICS: Record<string, string> = {
  contact: "Phone, email or website", address: "Address or location", fees: "Fees", hours: "School hours",
  programs: "Programs or facilities", closed: "School closed or moved", missing: "Missing information", other: "Other",
};

export function notifyCorrection(v: { schoolId: string; topic: string; message: string; source?: string; name?: string; email?: string; phone?: string; role: string; lang: string }) {
  run((async () => {
    const { data } = await createPublicClient({ fresh: true }).from("schools").select("slug,name").eq("id", v.schoolId).maybeSingle();
    const school = (data?.name as Record<string, string> | undefined)?.en ?? data?.slug ?? v.schoolId;
    const fromSchool = v.role === "school_staff";
    await send(
      `[EduMaps.kg] ${fromSchool ? "From the school: " : ""}correction for ${oneLine(school, 80)}`,
      [
        `School: ${oneLine(school)}`,
        `Sent by: ${fromSchool ? "school staff (verify before applying)" : v.role}`,
        `Topic: ${CORRECTION_TOPICS[v.topic] ?? v.topic}`,
        ...(v.name ? [`Name: ${oneLine(v.name)}`] : []),
        ...(v.email ? [`Email: ${v.email}`] : []),
        ...(v.phone ? [`Phone: ${oneLine(v.phone, 40)}`] : []),
        ...(v.source ? [`Source: ${oneLine(v.source, 300)}`] : []),
        "",
        v.message.slice(0, 4000),
        "",
        `${SITE_URL}/admin/corrections`,
      ],
      v.email || undefined,
    );
  })());
}
