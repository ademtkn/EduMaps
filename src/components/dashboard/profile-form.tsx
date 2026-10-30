"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateProfileAction } from "@/lib/actions/content";
import { errorText } from "@/lib/form-errors";
import { LANGS, LANG_META, type Lang } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import type { CityData } from "@/lib/data/geo";
import { profileSchema, type ProfileInput } from "@/lib/validation/schemas";
import { useDict, useLang } from "@/components/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

export function ProfileForm({ initial, cities }: { initial: { displayName: string; bio: string; cityId: string; preferredLang: Lang }; cities: CityData[] }) {
  const dict = useDict();
  const lang = useLang();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: initial });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ProfileInput) {
    setFormError(null);
    const result = await updateProfileAction(values);
    if (!result.ok) return setFormError(errorText(dict, result.error) ?? dict.errors.unknown);
    toast("success", dict.dashboard.profileSaved);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-xl space-y-5">
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      <Field label={dict.dashboard.displayName} htmlFor="p-name" error={errorText(dict, errors.displayName?.message)}>
        <Input id="p-name" maxLength={60} {...form.register("displayName")} />
      </Field>
      <Field label={dict.dashboard.bio} htmlFor="p-bio" error={errorText(dict, errors.bio?.message)}>
        <Textarea id="p-bio" rows={4} maxLength={500} {...form.register("bio")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={dict.dashboard.city} htmlFor="p-city">
          <Select id="p-city" {...form.register("cityId")}>
            <option value="">{dict.dashboard.noneSelected}</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{tr(c.name, lang)}</option>)}
          </Select>
        </Field>
        <Field label={dict.dashboard.preferredLanguage} htmlFor="p-lang">
          <Select id="p-lang" {...form.register("preferredLang")}>
            {LANGS.map((code) => <option key={code} value={code}>{LANG_META[code].native}</option>)}
          </Select>
        </Field>
      </div>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? dict.common.loading : dict.dashboard.saveProfile}</Button>
    </form>
  );
}
