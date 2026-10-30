"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { changeEmailAction, changePasswordAction, deleteAccountAction } from "@/lib/actions/account";
import { errorText } from "@/lib/form-errors";
import { localizedPath } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import {
  changeEmailSchema, changePasswordSchema, deleteAccountSchema,
  type ChangeEmailInput, type ChangePasswordInput, type DeleteAccountInput,
} from "@/lib/validation/schemas";
import { useDict, useLang } from "@/components/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { Field, Input } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";

type Failure = { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Puts server-side field errors on the form, or returns the text of a general error. */
function applyFailure<T extends Record<string, unknown>>(result: Failure, setError: (field: keyof T & string, error: { message: string }) => void, text: (code?: string) => string | undefined) {
  if (result.error === "validation" && result.fieldErrors) {
    for (const [field, code] of Object.entries(result.fieldErrors)) setError(field as keyof T & string, { message: code });
    return null;
  }
  return text(result.error);
}

function PasswordCard() {
  const dict = useDict();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: "", password: "", confirm: "" } });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ChangePasswordInput) {
    setFormError(null);
    const result = await changePasswordAction(values);
    if (!result.ok) return setFormError(applyFailure<ChangePasswordInput>(result, form.setError, (c) => errorText(dict, c)) ?? null);
    form.reset();
    toast("success", dict.account.passwordChanged);
  }

  return (
    <Card><CardBody>
      <h2 className="text-h3 font-semibold">{dict.account.passwordTitle}</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-4 max-w-md space-y-4">
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        <Field label={dict.account.currentPassword} htmlFor="acc-current" error={errorText(dict, errors.currentPassword?.message)}>
          <PasswordInput id="acc-current" autoComplete="current-password" aria-invalid={!!errors.currentPassword} {...form.register("currentPassword")} />
        </Field>
        <Field label={dict.auth.newPassword} htmlFor="acc-new" hint={dict.auth.passwordHint} error={errorText(dict, errors.password?.message)}>
          <PasswordInput id="acc-new" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
        </Field>
        <Field label={dict.auth.repeatPassword} htmlFor="acc-new2" error={errorText(dict, errors.confirm?.message)}>
          <PasswordInput id="acc-new2" autoComplete="new-password" aria-invalid={!!errors.confirm} {...form.register("confirm")} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? dict.common.loading : dict.account.changePassword}</Button>
      </form>
    </CardBody></Card>
  );
}

function EmailCard({ email }: { email: string }) {
  const dict = useDict();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const form = useForm<ChangeEmailInput>({ resolver: zodResolver(changeEmailSchema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ChangeEmailInput) {
    setFormError(null);
    const result = await changeEmailAction(values);
    if (!result.ok) return setFormError(applyFailure<ChangeEmailInput>(result, form.setError, (c) => errorText(dict, c)) ?? null);
    form.reset();
    setSent(true);
  }

  return (
    <Card><CardBody>
      <h2 className="text-h3 font-semibold">{dict.account.emailTitle}</h2>
      <p className="mt-1 text-small text-ink-600">{fmt(dict.account.currentEmail, { email })}</p>
      {sent ? <Alert tone="success" className="mt-4">{dict.account.emailChangeSent}</Alert> : null}
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-4 max-w-md space-y-4">
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        <Field label={dict.account.newEmail} htmlFor="acc-email" error={errorText(dict, errors.email?.message)}>
          <Input id="acc-email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...form.register("email")} />
        </Field>
        <Field label={dict.account.currentPassword} htmlFor="acc-email-pw" error={errorText(dict, errors.password?.message)}>
          <PasswordInput id="acc-email-pw" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register("password")} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? dict.common.loading : dict.account.changeEmail}</Button>
      </form>
    </CardBody></Card>
  );
}

function DeleteCard() {
  const dict = useDict();
  const lang = useLang();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<DeleteAccountInput>({ resolver: zodResolver(deleteAccountSchema), defaultValues: { password: "", understood: undefined } });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: DeleteAccountInput) {
    setFormError(null);
    const result = await deleteAccountAction(values);
    if (!result.ok) return setFormError(applyFailure<DeleteAccountInput>(result, form.setError, (c) => errorText(dict, c)) ?? null);
    window.location.assign(`${localizedPath(lang)}?notice=account_deleted`);
  }

  return (
    <Card className="border-danger-600/30"><CardBody>
      <h2 className="flex items-center gap-2 text-h3 font-semibold text-danger-700"><Trash2 className="size-5" />{dict.account.deleteTitle}</h2>
      <p className="mt-2 max-w-xl text-small text-ink-700">{dict.account.deleteText}</p>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-4 max-w-md space-y-4">
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        <Field label={dict.account.currentPassword} htmlFor="acc-del-pw" error={errorText(dict, errors.password?.message)}>
          <PasswordInput id="acc-del-pw" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register("password")} />
        </Field>
        <ConsentCheckbox id="acc-del-ok" label={dict.account.deleteUnderstand} error={errorText(dict, errors.understood?.message)} {...form.register("understood")} />
        <Button type="submit" variant="outline" className="border-danger-600 text-danger-700 hover:bg-danger-50" disabled={isSubmitting}>
          {isSubmitting ? dict.common.loading : dict.account.deleteButton}
        </Button>
      </form>
    </CardBody></Card>
  );
}

export function AccountSettings({ email }: { email: string }) {
  const dict = useDict();
  return (
    <div className="space-y-6">
      <PasswordCard />
      <EmailCard email={email} />
      <Card><CardBody>
        <h2 className="text-h3 font-semibold">{dict.account.dataTitle}</h2>
        <p className="mt-2 max-w-xl text-small text-ink-700">{dict.account.dataText}</p>
        <Button asChild variant="outline" className="mt-4"><a href="/api/account/export" download><Download />{dict.account.download}</a></Button>
      </CardBody></Card>
      <DeleteCard />
    </div>
  );
}
