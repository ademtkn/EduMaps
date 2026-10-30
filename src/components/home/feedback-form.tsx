"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDict, useLang } from "@/components/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { Field, Honeypot, Select, Textarea } from "@/components/ui/form";
import { deleteMyTestimonialAction, submitTestimonialAction } from "@/lib/actions/feedback";
import { errorText } from "@/lib/form-errors";
import { FEEDBACK_ROLES, feedbackSchema, type FeedbackInput } from "@/lib/validation/schemas";

export function FeedbackForm({ initialQuote, hasExisting }: { initialQuote: string; hasExisting: boolean }) {
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const f = dict.feedback;
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { quote: initialQuote, role: "", lang, website: "", consent: undefined },
  });
  const { errors, isSubmitting } = form.formState;
  const length = form.watch("quote")?.length ?? 0;

  async function onSubmit(values: FeedbackInput) {
    setFormError(null);
    const result = await submitTestimonialAction(values);
    if (!result.ok) {
      if (result.error === "validation" && result.fieldErrors) {
        for (const [field, code] of Object.entries(result.fieldErrors)) form.setError(field as keyof FeedbackInput, { message: code });
        return;
      }
      return setFormError(errorText(dict, result.error) ?? dict.errors.unknown);
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-4 text-center" role="status">
        <CheckCircle2 className="size-12 text-leaf-600" />
        <h2 className="mt-4 text-h3 font-semibold">{f.sentTitle}</h2>
        <p className="mt-2 max-w-md text-body text-ink-700">{f.sentText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative space-y-5">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <Honeypot {...form.register("website")} />
      {hasExisting ? <p className="text-small text-ink-600">{f.editHint}</p> : null}
      <Field label={f.quoteLabel} htmlFor="fb-quote" hint={f.quoteHint} error={errorText(dict, errors.quote?.message)}>
        <Textarea id="fb-quote" rows={5} maxLength={400} aria-invalid={!!errors.quote} {...form.register("quote")} />
        <p className="mt-1 text-right text-caption text-ink-500">{length} / 400</p>
      </Field>
      <Field label={f.roleLabel} htmlFor="fb-role">
        <Select id="fb-role" {...form.register("role")}>
          <option value="">{f.noRole}</option>
          {FEEDBACK_ROLES.map((r) => <option key={r} value={r}>{f.roles[r]}</option>)}
        </Select>
      </Field>
      <ConsentCheckbox id="fb-consent" label={f.consent} error={errorText(dict, errors.consent?.message)} {...form.register("consent")} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? f.sending : f.send}</Button>
        {hasExisting ? (
          <Button
            type="button"
            variant="ghost"
            className="text-danger-600"
            onClick={async () => {
              if (!(await deleteMyTestimonialAction()).ok) return;
              router.refresh();
            }}
          >
            {f.delete}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
