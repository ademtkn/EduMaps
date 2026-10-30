"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { submitReviewAction } from "@/lib/actions/content";
import { errorText } from "@/lib/form-errors";
import { reviewSchema } from "@/lib/validation/schemas";
import { useDict } from "@/components/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Honeypot, Input, Label, Select, Textarea } from "@/components/ui/form";
import { RatingInput } from "@/components/ui/rating-input";

type Values = z.input<typeof reviewSchema>;
export type ExistingReview = {
  relationship: "parent" | "student" | "alumni" | "teacher";
  rating: number;
  rating_teaching: number | null;
  rating_facilities: number | null;
  rating_safety: number | null;
  rating_communication: number | null;
  title: string;
  body: string;
};

export function ReviewForm({ schoolId, existing, onSaved }: { schoolId: string; existing?: ExistingReview | null; onSaved: (status: string) => void }) {
  const dict = useDict();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<Values, unknown, z.output<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      schoolId,
      relationship: existing?.relationship ?? "parent",
      rating: existing?.rating ?? 0,
      ratingTeaching: existing?.rating_teaching ?? 0,
      ratingFacilities: existing?.rating_facilities ?? 0,
      ratingSafety: existing?.rating_safety ?? 0,
      ratingCommunication: existing?.rating_communication ?? 0,
      title: existing?.title ?? "",
      body: existing?.body ?? "",
      website: "",
    },
  });
  const { errors, isSubmitting } = form.formState;
  const bodyLength = form.watch("body")?.length ?? 0;

  async function onSubmit(values: z.output<typeof reviewSchema>) {
    setFormError(null);
    const result = await submitReviewAction(values);
    if (!result.ok) {
      if (result.error === "validation" && result.fieldErrors) {
        for (const [field, code] of Object.entries(result.fieldErrors)) form.setError(field as keyof Values, { message: code });
        return;
      }
      return setFormError(errorText(dict, result.error) ?? dict.errors.unknown);
    }
    onSaved(result.data?.status ?? "pending");
  }

  const sub = [
    ["ratingTeaching", dict.reviews.teaching],
    ["ratingFacilities", dict.reviews.facilities],
    ["ratingSafety", dict.reviews.safety],
    ["ratingCommunication", dict.reviews.communication],
  ] as const;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative space-y-6">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      {existing ? <Alert tone="info">{dict.reviews.editNote}</Alert> : null}
      <Honeypot {...form.register("website")} />

      <Field label={dict.reviews.overall} error={errorText(dict, errors.rating?.message)}>
        <Controller control={form.control} name="rating" render={({ field }) => (
          <RatingInput label={dict.reviews.overall} value={Number(field.value) || 0} onChange={field.onChange} />
        )} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        {sub.map(([name, label]) => (
          <div key={name}>
            <Label>{label} <span className="font-normal text-ink-500">({dict.reviews.optional})</span></Label>
            <Controller control={form.control} name={name} render={({ field }) => (
              <RatingInput label={label} size="md" allowClear value={Number(field.value) || 0} onChange={field.onChange} />
            )} />
          </div>
        ))}
      </div>

      <Field label={dict.reviews.relationship} htmlFor="relationship">
        <Select id="relationship" {...form.register("relationship")}>
          {(["parent", "student", "alumni", "teacher"] as const).map((r) => (
            <option key={r} value={r}>{dict.reviews.relationships[r]}</option>
          ))}
        </Select>
      </Field>

      <Field label={dict.reviews.reviewTitle} htmlFor="review-title" error={errorText(dict, errors.title?.message)}>
        <Input id="review-title" maxLength={120} placeholder={dict.reviews.reviewTitlePlaceholder} aria-invalid={!!errors.title} {...form.register("title")} />
      </Field>

      <Field
        label={dict.reviews.reviewBody}
        htmlFor="review-body"
        hint={`${dict.reviews.reviewBodyHint} (${bodyLength}/3000)`}
        error={errorText(dict, errors.body?.message)}
      >
        <Textarea id="review-body" rows={6} maxLength={3000} placeholder={dict.reviews.reviewBodyPlaceholder} aria-invalid={!!errors.body} {...form.register("body")} />
      </Field>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? dict.common.loading : existing ? dict.reviews.update : dict.reviews.submit}
      </Button>
    </form>
  );
}
