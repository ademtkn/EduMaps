"use client";

import { Check, Copy, ExternalLink, Mail, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { setOutreachAction } from "@/lib/actions/admin";
import type { Lang } from "@/lib/i18n/config";
import { buildOutreach } from "@/lib/outreach/templates";
import { normalizeWhatsapp, whatsappUrl } from "@/lib/whatsapp";

export type OutreachSchool = {
  id: string;
  slug: string;
  name: Record<Lang, string>;
  baseUrl: string;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  outreach: { status: "sent" | "replied" | "confirmed" | "declined"; channel: "whatsapp" | "email" | "both" | null; note: string | null } | null;
};

const LANG_LABEL: Record<Lang, string> = { ru: "Русский", kg: "Кыргызча", en: "English" };
const SIGNER_KEY = "edumaps.outreach.signer";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button" size="sm" variant="outline"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked: the text can still be selected by hand */ }
      }}
    >
      {copied ? <Check /> : <Copy />} {copied ? "Copied" : label}
    </Button>
  );
}

/** One school: the messages in the chosen language with the school's name and page filled in, and where it stands. */
export function OutreachRow({ school, signer }: { school: OutreachSchool; signer: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [lang, setLang] = useState<Lang>("ru");
  const [status, setStatus] = useState(school.outreach?.status ?? "");
  const [channel, setChannel] = useState(school.outreach?.channel ?? "");
  const [note, setNote] = useState(school.outreach?.note ?? "");

  const message = useMemo(
    () => buildOutreach(lang, { school: school.name[lang] || school.name.en, url: `${school.baseUrl}/${lang}/schools/${school.slug}`, signer: signer || "…" }),
    [lang, school, signer],
  );
  const number = normalizeWhatsapp(school.whatsapp) ?? normalizeWhatsapp(school.phone);

  function save() {
    start(async () => {
      const result = await setOutreachAction(school.id, {
        status: (status || null) as never, channel: (channel || null) as never, note,
      });
      if (!result.ok) return toast("error", result.error);
      toast("success", status ? "Saved." : "Back to not contacted.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 border-t border-ink-200 p-5">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Message language">
        {(["ru", "kg", "en"] as const).map((l) => (
          <Button key={l} type="button" size="sm" variant={lang === l ? "primary" : "outline"} aria-pressed={lang === l} onClick={() => setLang(l)}>{LANG_LABEL[l]}</Button>
        ))}
        {!signer ? <span className="text-caption text-warning-700">Fill in the signature above first.</span> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-label="WhatsApp message" className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-small font-semibold"><MessageCircle className="size-4" /> WhatsApp</h3>
          <Textarea readOnly rows={9} value={message.whatsapp} className="text-small" aria-label={`WhatsApp message in ${LANG_LABEL[lang]}`} />
          <div className="flex flex-wrap gap-2">
            <CopyButton text={message.whatsapp} label="Copy" />
            {number ? (
              <Button asChild size="sm" variant="secondary">
                <a href={whatsappUrl(number, message.whatsapp)} target="_blank" rel="noopener noreferrer"><ExternalLink /> Open chat with {number}</a>
              </Button>
            ) : <span className="self-center text-caption text-ink-500">No WhatsApp or phone number saved for this school.</span>}
          </div>
        </section>

        <section aria-label="Email message" className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-small font-semibold"><Mail className="size-4" /> Email</h3>
          <p className="rounded-control bg-ink-50 px-3 py-2 text-small"><span className="text-ink-500">Subject: </span>{message.emailSubject}</p>
          <Textarea readOnly rows={9} value={message.emailBody} className="text-small" aria-label={`Email in ${LANG_LABEL[lang]}`} />
          <div className="flex flex-wrap gap-2">
            <CopyButton text={message.emailSubject} label="Copy subject" />
            <CopyButton text={message.emailBody} label="Copy text" />
            {school.email ? (
              <Button asChild size="sm" variant="secondary">
                <a href={`mailto:${school.email}?subject=${encodeURIComponent(message.emailSubject)}&body=${encodeURIComponent(message.emailBody)}`}><ExternalLink /> Open email to {school.email}</a>
              </Button>
            ) : <span className="self-center text-caption text-ink-500">No email saved for this school.</span>}
          </div>
        </section>
      </div>

      <div className="grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-[12rem_10rem_minmax(0,1fr)_auto] sm:items-start">
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="">Not contacted</option>
          <option value="sent">Message sent</option>
          <option value="replied">Replied</option>
          <option value="confirmed">Details confirmed</option>
          <option value="declined">Asked not to be listed</option>
        </Select>
        <Select aria-label="Channel" value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} disabled={!status}>
          <option value="">Channel…</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
          <option value="both">Both</option>
        </Select>
        <Textarea aria-label="Note" rows={2} maxLength={500} className="min-h-0 text-small" placeholder="Note (who answered, what they asked for)…" value={note} onChange={(e) => setNote(e.target.value)} disabled={!status} />
        <Button type="button" size="sm" disabled={pending} onClick={save}>Save</Button>
      </div>
      {status === "declined" ? <p className="text-caption text-danger-600">This school asked not to be listed: unpublish it in Schools, and do not contact it again.</p> : null}
    </div>
  );
}

/** The sender's name, remembered in this browser so it does not have to be typed for every school. */
export function useSigner() {
  const [signer, setSigner] = useState("");
  useEffect(() => {
    try { setSigner(localStorage.getItem(SIGNER_KEY) ?? ""); } catch { /* storage blocked: the field just starts empty */ }
  }, []);
  const update = (value: string) => {
    setSigner(value);
    try { localStorage.setItem(SIGNER_KEY, value); } catch { /* not remembered */ }
  };
  return [signer, update] as const;
}
