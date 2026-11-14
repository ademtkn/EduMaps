"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signInAction, signUpAction, startOAuthAction, type OAuthProvider } from "@/lib/actions/auth";
import { safeNextPath } from "@/lib/constants";
import { MIN_AGE } from "@/lib/company";
import { errorText } from "@/lib/form-errors";
import { localizedPath } from "@/lib/i18n/config";
import { requestPasswordResetAction, resetPasswordAction } from "@/lib/actions/account";
import {
  forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema,
  type ForgotPasswordInput, type LoginInput, type RegisterInput, type ResetPasswordInput,
} from "@/lib/validation/schemas";
import { useDict, useLang } from "@/components/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/legal/rich-text";
import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { Field, Honeypot, Input } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { LLink } from "@/components/ui/localized-link";

function ConsentLabel() {
  const dict = useDict();
  return <RichText text={dict.auth.consent} vars={{ age: MIN_AGE }} links={{ terms: { href: "/terms", label: dict.auth.termsLink }, privacy: { href: "/privacy", label: dict.auth.privacyLink } }} />;
}

function OAuthButtons({ next, consent, onMissingConsent }: { next?: string; consent: boolean; onMissingConsent: () => void }) {
  const dict = useDict();
  const lang = useLang();
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(provider: OAuthProvider) {
    setError(null);
    if (!consent) return onMissingConsent();
    setPending(provider);
    try {
      const result = await startOAuthAction({ provider, lang, next, consent: true });
      if (!result.ok) {
        setError(errorText(dict, result.fieldErrors?.consent ?? result.error) ?? dict.errors.unknown);
      } else if (result.data?.unavailable) {
        setError(dict.auth.oauthUnavailable);
      } else if (result.data?.url) {
        window.location.assign(result.data.url);
      } else {
        setError(dict.auth.oauthError);
      }
    } catch {
      setError(dict.auth.oauthError);
    } finally {
      setPending(null);
    }
  }

  return <div className="space-y-3">
    {error ? <Alert tone="danger">{error}</Alert> : null}
    <Button variant="outline" size="lg" className="w-full" disabled={pending !== null} onClick={() => start("google")}>
      {pending === "google" ? dict.common.loading : dict.auth.continueGoogle}
    </Button>
    <Button variant="outline" size="lg" className="w-full" disabled={pending !== null} onClick={() => start("apple")}>
      {pending === "apple" ? dict.common.loading : dict.auth.continueApple}
    </Button>
  </div>;
}

export function LoginForm({ next }: { next?: string }) {
  const dict = useDict();
  const lang = useLang();
  const [formError, setFormError] = useState<string | null>(null);
  const [socialConsent, setSocialConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const result = await signInAction(values);
    if (!result.ok) return setFormError(errorText(dict, result.error) ?? dict.errors.unknown);
    if (result.data?.invalid) return setFormError(dict.auth.invalidCredentials);
    window.location.assign(safeNextPath(next, localizedPath(lang, "/dashboard")));
  }

  return (
    <div className="space-y-5">
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <Field label={dict.auth.identifier} htmlFor="identifier" error={errorText(dict, errors.identifier?.message)}>
        <Input id="identifier" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={254} aria-invalid={!!errors.identifier} {...form.register("identifier")} />
      </Field>
      <Field label={dict.auth.password} htmlFor="password" error={errorText(dict, errors.password?.message)}>
        <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <p className="-mt-2 text-right text-small"><LLink href="/auth/forgot-password" className="font-semibold text-brand-700 hover:underline">{dict.auth.forgotLink}</LLink></p>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? dict.common.loading : dict.auth.signIn}
      </Button>
    </form>
      <div className="flex items-center gap-3 text-caption text-ink-500"><span className="h-px flex-1 bg-ink-200" />{dict.auth.or}<span className="h-px flex-1 bg-ink-200" /></div>
      <ConsentCheckbox id="login-social-consent" label={<ConsentLabel />} checked={socialConsent} onChange={(event) => { setSocialConsent(event.target.checked); setConsentError(false); }} error={consentError ? dict.errors.consent_required : undefined} />
      <OAuthButtons next={next} consent={socialConsent} onMissingConsent={() => setConsentError(true)} />
      <p className="text-center text-small text-ink-600">
        {dict.auth.noAccount}{" "}
        <LLink href={`/auth/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-700 hover:underline">
          {dict.auth.signUp}
        </LLink>
      </p>
    </div>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const dict = useDict();
  const lang = useLang();
  const [formError, setFormError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", lang, website: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    const result = await signUpAction(values);
    if (!result.ok) {
      if (result.error === "validation" && result.fieldErrors) {
        for (const [field, code] of Object.entries(result.fieldErrors)) {
          if (field in values) form.setError(field as keyof RegisterInput, { message: code });
        }
        return;
      }
      return setFormError(errorText(dict, result.error) ?? dict.errors.unknown);
    }
    if (result.data?.emailTaken) return setFormError(dict.auth.emailTaken);
    if (result.data?.needsConfirmation) return setNeedsConfirmation(true);
    window.location.assign(safeNextPath(next, localizedPath(lang, "/dashboard")));
  }

  if (needsConfirmation) {
    return <Alert tone="success" title={dict.auth.registered}>{dict.auth.checkEmail}</Alert>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative space-y-5">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <Honeypot {...form.register("website")} />
      <ConsentCheckbox id="reg-consent" label={<ConsentLabel />} error={errorText(dict, errors.consent?.message)} {...form.register("consent")} onChange={(event) => { void form.register("consent").onChange(event); form.clearErrors("consent"); }} />
      <OAuthButtons next={next} consent={form.watch("consent") === true} onMissingConsent={() => form.setError("consent", { message: "consent_required" }, { shouldFocus: true })} />
      <div className="flex items-center gap-3 text-caption text-ink-500"><span className="h-px flex-1 bg-ink-200" />{dict.auth.or}<span className="h-px flex-1 bg-ink-200" /></div>
      <Button variant="outline" size="lg" className="w-full" aria-expanded={emailOpen} aria-controls="email-registration" onClick={() => setEmailOpen(!emailOpen)}>{dict.auth.continueEmail}</Button>
      {emailOpen ? <div id="email-registration" className="space-y-5">
      <Field label={dict.auth.username} htmlFor="username" hint={dict.auth.usernameHint} error={errorText(dict, errors.username?.message)}>
        <Input id="username" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={30} aria-invalid={!!errors.username} {...form.register("username")} />
      </Field>
      <Field label={dict.auth.email} htmlFor="reg-email" error={errorText(dict, errors.email?.message)}>
        <Input id="reg-email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Field label={dict.auth.password} htmlFor="reg-password" hint={dict.auth.passwordHint} error={errorText(dict, errors.password?.message)}>
        <PasswordInput id="reg-password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <p className="text-caption text-ink-500">
        <RichText text={dict.auth.guidelinesHint} vars={{}} links={{ guidelines: { href: "/guidelines", label: dict.auth.guidelinesLink } }} />
      </p>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? dict.common.loading : dict.auth.signUp}
      </Button>
      </div> : null}
      <p className="text-center text-small text-ink-600">
        {dict.auth.haveAccount}{" "}
        <LLink href={`/auth/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-700 hover:underline">
          {dict.auth.signIn}
        </LLink>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const dict = useDict();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "", website: "" } });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    const result = await requestPasswordResetAction(values);
    if (!result.ok) return setFormError(errorText(dict, result.error) ?? dict.errors.unknown);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <Alert tone="success">{dict.auth.forgotSent}</Alert>
        <LLink href="/auth/login" className="inline-block text-small font-semibold text-brand-700 hover:underline">{dict.auth.backToLogin}</LLink>
      </div>
    );
  }
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative space-y-5">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <Honeypot {...form.register("website")} />
      <Field label={dict.auth.email} htmlFor="forgot-email" error={errorText(dict, errors.email?.message)}>
        <Input id="forgot-email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? dict.common.loading : dict.auth.forgotSend}</Button>
      <p className="text-center text-small"><LLink href="/auth/login" className="font-semibold text-brand-700 hover:underline">{dict.auth.backToLogin}</LLink></p>
    </form>
  );
}

export function ResetPasswordForm() {
  const dict = useDict();
  const lang = useLang();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirm: "" } });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    const result = await resetPasswordAction(values);
    if (!result.ok) {
      if (result.error === "validation" && result.fieldErrors) {
        for (const [field, code] of Object.entries(result.fieldErrors)) form.setError(field as keyof ResetPasswordInput, { message: code });
        return;
      }
      return setFormError(errorText(dict, result.error) ?? dict.errors.unknown);
    }
    window.location.assign(`${localizedPath(lang, "/dashboard")}?notice=password_updated`);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <Field label={dict.auth.newPassword} htmlFor="new-password" hint={dict.auth.passwordHint} error={errorText(dict, errors.password?.message)}>
        <PasswordInput id="new-password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </Field>
      <Field label={dict.auth.repeatPassword} htmlFor="new-password-2" error={errorText(dict, errors.confirm?.message)}>
        <PasswordInput id="new-password-2" autoComplete="new-password" aria-invalid={!!errors.confirm} {...form.register("confirm")} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? dict.common.loading : dict.auth.resetSave}</Button>
    </form>
  );
}
