"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Flag } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { RichText } from "@/components/legal/rich-text";
import { useDict, useLang } from "@/components/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Honeypot, Input, Select, Textarea } from "@/components/ui/form";
import { submitCorrectionAction } from "@/lib/actions/requests";
import { errorText } from "@/lib/form-errors";
import { CORRECTION_TOPICS, REPORTER_ROLES, correctionSchema, type CorrectionInput } from "@/lib/validation/schemas";

/** "Report incorrect information" button and form on a school page. */
export function CorrectionDialog({ schoolId }: { schoolId: string }) {
  const dict = useDict();
  const lang = useLang();
  const c = dict.corrections;
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CorrectionInput>({
    resolver: zodResolver(correctionSchema),
    defaultValues: { schoolId, message: "", source: "", name: "", email: "", website: "", lang, phone: "", role: "visitor", topic: undefined, consent: undefined },
  });
  const { errors, isSubmitting } = form.formState;
  const emailFilled = Boolean(form.watch("email") || form.watch("phone"));
  const isStaff = form.watch("role") === "school_staff";

  async function onSubmit(values: CorrectionInput) {
    setFormError(null);
    const result = await submitCorrectionAction(values);
    if (!result.ok) {
      if (result.error === "validation" && result.fieldErrors) {
        for (const [field, code] of Object.entries(result.fieldErrors)) form.setError(field as keyof CorrectionInput, { message: code });
        return;
      }
      return setFormError(errorText(dict, result.error) ?? dict.errors.unknown);
    }
    setDone(true);
  }

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setDone(false); }} className="inline-flex items-center gap-1.5 text-caption font-semibold text-ink-600 hover:text-brand-700">
        <Flag className="size-3.5" />{c.cta}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={c.title} closeLabel={dict.common.close}>
          {done ? (
            <div className="flex flex-col items-center py-6 text-center" role="status">
              <CheckCircle2 className="size-12 text-leaf-600" />
              <h3 className="mt-4 text-h3 font-semibold">{c.sentTitle}</h3>
              <p className="mt-2 max-w-sm text-body text-ink-700">{c.sentText}</p>
              <Button className="mt-6" variant="outline" onClick={() => setOpen(false)}>{dict.common.close}</Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative space-y-4">
              <p className="text-small text-ink-600">{c.intro}</p>
              {formError ? <Alert tone="danger">{formError}</Alert> : null}
              <Honeypot {...form.register("website")} />
              <Field label={c.topic} htmlFor="corr-topic" error={errorText(dict, errors.topic?.message)}>
                <Select id="corr-topic" defaultValue="" aria-invalid={!!errors.topic} {...form.register("topic")}>
                  <option value="" disabled>—</option>
                  {CORRECTION_TOPICS.map((t) => <option key={t} value={t}>{c.topics[t]}</option>)}
                </Select>
              </Field>
              <Field label={c.message} htmlFor="corr-message" hint={c.messageHint} error={errorText(dict, errors.message?.message)}>
                <Textarea id="corr-message" rows={4} maxLength={2000} aria-invalid={!!errors.message} {...form.register("message")} />
              </Field>
              <Field label={c.source} htmlFor="corr-source" hint={c.sourceHint} error={errorText(dict, errors.source?.message)}>
                <Input id="corr-source" maxLength={300} aria-invalid={!!errors.source} {...form.register("source")} />
              </Field>
              <Field label={c.role} htmlFor="corr-role">
                <Select id="corr-role" {...form.register("role")}>
                  {REPORTER_ROLES.map((r) => <option key={r} value={r}>{c.roles[r]}</option>)}
                </Select>
              </Field>
              {isStaff ? <Alert tone="info">{c.staffNote}</Alert> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={c.name} htmlFor="corr-name" error={errorText(dict, errors.name?.message)}>
                  <Input id="corr-name" autoComplete="name" maxLength={80} {...form.register("name")} />
                </Field>
                <Field label={c.email} htmlFor="corr-email" hint={isStaff ? c.phoneHint : c.emailHint} error={errorText(dict, errors.email?.message)}>
                  <Input id="corr-email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...form.register("email")} />
                </Field>
              </div>
              <Field label={c.phone} htmlFor="corr-phone" error={errorText(dict, errors.phone?.message)}>
                <Input id="corr-phone" type="tel" autoComplete="tel" maxLength={40} {...form.register("phone")} />
              </Field>
              {emailFilled ? (
                <ConsentCheckbox
                  id="corr-consent"
                  label={<RichText text={c.consent} vars={{}} links={{ privacy: { href: "/privacy", label: dict.footer.privacy } }} />}
                  error={errorText(dict, errors.consent?.message)}
                  {...form.register("consent")}
                />
              ) : null}
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? c.sending : c.send}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
