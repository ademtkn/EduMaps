"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { submitPostAction } from "@/lib/actions/content";
import { errorText } from "@/lib/form-errors";
import { tr } from "@/lib/i18n/localized";
import type { CategoryData } from "@/lib/data/types";
import { postSchema, type PostInput } from "@/lib/validation/schemas";
import { useDict, useLang } from "@/components/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Honeypot, Input, Select, Textarea } from "@/components/ui/form";
import { LLink } from "@/components/ui/localized-link";

export function PostForm({ categories, defaultCategory }: { categories: CategoryData[]; defaultCategory?: string }) {
  const dict = useDict();
  const lang = useLang();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const form = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: { categoryId: categories.find((c) => c.slug === defaultCategory)?.id ?? "", title: "", body: "", website: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const bodyLength = form.watch("body")?.length ?? 0;

  async function onSubmit(values: PostInput) {
    setFormError(null);
    const result = await submitPostAction(values);
    if (!result.ok) {
      if (result.error === "validation" && result.fieldErrors) {
        for (const [field, code] of Object.entries(result.fieldErrors)) form.setError(field as keyof PostInput, { message: code });
        return;
      }
      return setFormError(errorText(dict, result.error) ?? dict.errors.unknown);
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <CheckCircle2 className="size-12 text-leaf-600" />
        <p className="mt-4 max-w-md text-body text-ink-800">{dict.community.submitted}</p>
        <LLink href="/dashboard?tab=posts" className="mt-6 font-semibold text-brand-700 hover:underline">{dict.dashboard.myPosts}</LLink>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative space-y-5">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <Honeypot {...form.register("website")} />
      <Field label={dict.community.category} htmlFor="post-category" error={errorText(dict, errors.categoryId?.message)}>
        <Select id="post-category" aria-invalid={!!errors.categoryId} {...form.register("categoryId")}>
          <option value="">{dict.community.choose}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{tr(c.name, lang)}</option>)}
        </Select>
      </Field>
      <Field label={dict.community.postTitle} htmlFor="post-title" error={errorText(dict, errors.title?.message)}>
        <Input id="post-title" maxLength={160} placeholder={dict.community.postTitlePlaceholder} aria-invalid={!!errors.title} {...form.register("title")} />
      </Field>
      <Field label={dict.community.postBody} htmlFor="post-body" hint={`${bodyLength}/5000`} error={errorText(dict, errors.body?.message)}>
        <Textarea id="post-body" rows={8} maxLength={5000} placeholder={dict.community.postBodyPlaceholder} aria-invalid={!!errors.body} {...form.register("body")} />
      </Field>
      <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? dict.common.loading : dict.community.publish}</Button>
    </form>
  );
}
