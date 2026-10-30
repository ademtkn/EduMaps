"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { deleteCommentAction, submitCommentAction } from "@/lib/actions/content";
import { errorText } from "@/lib/form-errors";
import { formatDate } from "@/lib/i18n/format";
import type { CommentData } from "@/lib/data/types";
import { commentSchema, type CommentInput } from "@/lib/validation/schemas";
import { initials } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useDict, useLang } from "@/components/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Honeypot, Textarea } from "@/components/ui/form";
import { LLink } from "@/components/ui/localized-link";
import { useToast } from "@/components/ui/toast";
import { ReportButton } from "@/components/reviews/report-button";

export function CommentForm({ postId }: { postId: string }) {
  const { member, ready } = useAuth();
  const dict = useDict();
  const router = useRouter();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CommentInput>({ resolver: zodResolver(commentSchema), defaultValues: { postId, body: "", website: "" } });
  const { errors, isSubmitting } = form.formState;

  if (!ready) return <div className="h-32 animate-pulse rounded-card bg-ink-100" aria-hidden="true" />;
  if (!member) {
    return (
      <div className="rounded-card border border-dashed border-ink-300 bg-white p-6 text-center">
        <Button asChild><LLink href={`/auth/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}>{dict.community.loginToComment}</LLink></Button>
      </div>
    );
  }

  async function onSubmit(values: CommentInput) {
    setFormError(null);
    const result = await submitCommentAction(values);
    if (!result.ok) {
      if (result.error === "validation" && result.fieldErrors?.body) return form.setError("body", { message: result.fieldErrors.body });
      return setFormError(errorText(dict, result.error) ?? dict.errors.unknown);
    }
    form.reset({ postId, body: "", website: "" });
    toast("success", dict.community.commentPosted);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative space-y-3">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <Honeypot {...form.register("website")} />
      <Field label={dict.community.addComment} htmlFor="comment-body" error={errorText(dict, errors.body?.message)}>
        <Textarea id="comment-body" rows={4} maxLength={2000} placeholder={dict.community.commentPlaceholder} aria-invalid={!!errors.body} {...form.register("body")} />
      </Field>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? dict.common.loading : dict.community.postComment}</Button>
    </form>
  );
}

export function CommentItem({ comment }: { comment: CommentData }) {
  const { member } = useAuth();
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const { toast } = useToast();
  const name = comment.profiles?.display_name ?? "—";
  const mine = member?.id === comment.user_id;

  return (
    <li className="flex gap-3 rounded-card border border-ink-200 bg-white p-4 shadow-card">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-caption font-bold text-leaf-700">{initials(name)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-small"><strong className="text-ink-900">{name}</strong> <span className="text-ink-500">· {formatDate(comment.created_at, lang, "short")}</span></p>
        <p className="mt-1 whitespace-pre-line break-words text-small text-ink-800">{comment.body}</p>
        <div className="mt-2 flex items-center gap-4">
          {mine ? (
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(dict.dashboard.deleteConfirm)) return;
                const result = await deleteCommentAction(comment.id);
                if (!result.ok) return toast("error", errorText(dict, result.error) ?? dict.errors.unknown);
                toast("success", dict.dashboard.deleted);
                router.refresh();
              }}
              className="inline-flex items-center gap-1 text-caption font-medium text-ink-500 hover:text-danger-600"
            >
              <Trash2 className="size-3.5" /> {dict.common.delete}
            </button>
          ) : <ReportButton entityType="comment" entityId={comment.id} />}
        </div>
      </div>
    </li>
  );
}
