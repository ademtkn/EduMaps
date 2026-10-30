"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { RichText } from "@/components/legal/rich-text";
import { useDict, useLang } from "@/components/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { Field, Honeypot, Input, Select, Textarea } from "@/components/ui/form";
import { submitContactAction } from "@/lib/actions/contact";
import { errorText } from "@/lib/form-errors";
import { CONTACT_TOPICS, contactSchema, type ContactInput } from "@/lib/validation/schemas";

export function ContactForm({ defaultTopic, defaultSchool }: { defaultTopic?: string; defaultSchool?: string }) {
  const dict = useDict();
  const lang = useLang();
  const c = dict.contact;
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "", email: "", message: "", school: defaultSchool ?? "", website: "", lang,
      topic: (CONTACT_TOPICS as readonly string[]).includes(defaultTopic ?? "") ? (defaultTopic as ContactInput["topic"]) : undefined,
      consent: undefined,
    },
  });
  const { errors, isSubmitting } = form.formState;
  const messageLength = form.watch("message")?.length ?? 0;

  async function onSubmit(values: ContactInput) {
    setFormError(null);
    const result = await submitContactAction(values);
    if (!result.ok) {
      if (result.error === "validation" && result.fieldErrors) {
        for (const [field, code] of Object.entries(result.fieldErrors)) form.setError(field as keyof ContactInput, { message: code });
        return;
      }
      return setFormError(errorText(dict, result.error) ?? dict.errors.unknown);
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-6 text-center" role="status">
        <CheckCircle2 className="size-12 text-leaf-600" />
        <h3 className="mt-4 text-h3 font-semibold">{c.sentTitle}</h3>
        <p className="mt-2 max-w-md text-body text-ink-700">{c.sentText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative space-y-5">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <Honeypot {...form.register("website")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={c.name} htmlFor="contact-name" error={errorText(dict, errors.name?.message)}>
          <Input id="contact-name" autoComplete="name" maxLength={80} aria-invalid={!!errors.name} {...form.register("name")} />
        </Field>
        <Field label={c.email} htmlFor="contact-email" error={errorText(dict, errors.email?.message)}>
          <Input id="contact-email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...form.register("email")} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={c.topic} htmlFor="contact-topic" error={errorText(dict, errors.topic?.message)}>
          <Select id="contact-topic" aria-invalid={!!errors.topic} defaultValue="" {...form.register("topic")}>
            <option value="" disabled>—</option>
            {CONTACT_TOPICS.map((t) => <option key={t} value={t}>{c.topics[t]}</option>)}
          </Select>
        </Field>
        <Field label={c.school} htmlFor="contact-school" hint={c.schoolHint} error={errorText(dict, errors.school?.message)}>
          <Input id="contact-school" maxLength={200} aria-invalid={!!errors.school} {...form.register("school")} />
        </Field>
      </div>
      <Field label={c.message} htmlFor="contact-message" hint={c.messageHint} error={errorText(dict, errors.message?.message)}>
        <Textarea id="contact-message" rows={6} maxLength={4000} aria-invalid={!!errors.message} {...form.register("message")} />
        <p className="mt-1 text-right text-caption text-ink-500">{messageLength} / 4000</p>
      </Field>
      <ConsentCheckbox
        id="contact-consent"
        label={<RichText text={c.consent} vars={{}} links={{ privacy: { href: "/privacy", label: dict.footer.privacy } }} />}
        error={errorText(dict, errors.consent?.message)}
        {...form.register("consent")}
      />
      <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? c.sending : c.send}</Button>
    </form>
  );
}
