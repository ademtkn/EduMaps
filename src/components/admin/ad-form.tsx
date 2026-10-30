"use client";

import { Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAdAction, saveAdAction } from "@/lib/actions/admin";
import { AD_CUSTOMER_TYPES, AD_PLACEMENTS } from "@/lib/constants";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { Check, FormSection, I18nField, ImageField, type I18nValue } from "./fields";

export type AdFormValues = {
  id?: string;
  advertiser_name: string;
  customer_type: (typeof AD_CUSTOMER_TYPES)[number];
  placement: (typeof AD_PLACEMENTS)[number];
  headline: I18nValue;
  body: I18nValue;
  cta_label: I18nValue;
  image_url: string;
  target_url: string;
  target_languages: ("kg" | "ru" | "en")[];
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

const CUSTOMER_LABEL: Record<string, string> = {
  language_school: "Language school", summer_camp: "Summer camp", robotics_center: "Robotics center",
  edu_company: "Educational company", edu_event: "Educational event", other: "Other",
};
const PLACEMENT_LABEL: Record<string, string> = {
  banner: "Banner (home, lists)", sidebar: "Sidebar (school, article and community pages)", featured_article: "Featured article card (Education Hub)",
  home_grid: "Home page: one card among the schools (position changes on every refresh)",
};

export function AdForm({ initial }: { initial: AdFormValues }) {
  const router = useRouter();
  const { toast } = useToast();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const set = <K extends keyof AdFormValues>(k: K, value: AdFormValues[K]) => setV((p) => ({ ...p, [k]: value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    start(async () => {
      const result = await saveAdAction({ ...v, id: v.id ?? null });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        return toast("error", result.error);
      }
      toast("success", "Campaign saved");
      if (!v.id) router.replace(`/admin/ads/${result.data!.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {Object.keys(errors).length > 0 ? <Alert tone="danger" title="Please fix the highlighted fields">{Object.entries(errors).slice(0, 4).map(([k, m]) => <p key={k}>{k}: {m}</p>)}</Alert> : null}
      <Alert tone="info" title="Labelling and fairness">Every ad is shown with an “Advertisement” label and never changes school ratings, rankings or search results.</Alert>

      <FormSection title="Campaign">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Advertiser" htmlFor="ad-name" error={errors.advertiser_name}><Input id="ad-name" value={v.advertiser_name} onChange={(e) => set("advertiser_name", e.target.value)} /></Field>
          <Field label="Customer type" htmlFor="ad-type">
            <Select id="ad-type" value={v.customer_type} onChange={(e) => set("customer_type", e.target.value as AdFormValues["customer_type"])}>
              {AD_CUSTOMER_TYPES.map((t) => <option key={t} value={t}>{CUSTOMER_LABEL[t]}</option>)}
            </Select>
          </Field>
          <Field label="Placement" htmlFor="ad-place">
            <Select id="ad-place" value={v.placement} onChange={(e) => set("placement", e.target.value as AdFormValues["placement"])}>
              {AD_PLACEMENTS.map((p) => <option key={p} value={p}>{PLACEMENT_LABEL[p]}</option>)}
            </Select>
          </Field>
          <Field label="Destination URL" htmlFor="ad-url" error={errors.target_url}><Input id="ad-url" placeholder="https://" value={v.target_url} onChange={(e) => set("target_url", e.target.value)} /></Field>
        </div>
      </FormSection>

      <FormSection title="Creative">
        <I18nField label="Headline" requiredEn maxLength={120} value={v.headline} error={errors.headline} onChange={(x) => set("headline", x)} />
        <I18nField label="Text" multiline rows={2} maxLength={300} value={v.body} onChange={(x) => set("body", x)} />
        <I18nField label="Button label" maxLength={30} value={v.cta_label} onChange={(x) => set("cta_label", x)} />
        <ImageField label="Image" value={v.image_url} onChange={(x) => set("image_url", x)} hint="Landscape image (16:9). Upload it here so it can be served safely from the site." />
      </FormSection>

      <FormSection title="Schedule and targeting">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Starts" htmlFor="ad-start" error={errors.starts_at}><Input id="ad-start" type="datetime-local" value={v.starts_at} onChange={(e) => set("starts_at", e.target.value)} /></Field>
          <Field label="Ends (optional)" htmlFor="ad-end" error={errors.ends_at}><Input id="ad-end" type="datetime-local" value={v.ends_at} onChange={(e) => set("ends_at", e.target.value)} /></Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-small font-medium">Show to visitors browsing in</legend>
          <div className="flex flex-wrap gap-5">
            {([["kg", "Kyrgyz"], ["ru", "Russian"], ["en", "English"]] as const).map(([code, label]) => (
              <Check key={code} label={label} checked={v.target_languages.includes(code)} onChange={(on) => set("target_languages", on ? [...v.target_languages, code] : v.target_languages.filter((c) => c !== code))} />
            ))}
          </div>
          <p className="mt-2 text-caption text-ink-500">Leave all unchecked to show the ad in every language.</p>
        </fieldset>
        <Check label="Campaign is active" checked={v.is_active} onChange={(x) => set("is_active", x)} />
      </FormSection>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={pending}><Save /> {pending ? "Saving…" : "Save campaign"}</Button>
          <Button asChild variant="ghost"><Link href="/admin/ads">Cancel</Link></Button>
        </div>
        {v.id ? (
          <Button type="button" variant="ghost" className="text-danger-600 hover:bg-danger-50" disabled={pending} onClick={() => {
            if (!window.confirm("Delete this campaign?")) return;
            start(async () => {
              const r = await deleteAdAction(v.id!);
              if (!r.ok) return toast("error", r.error);
              router.replace("/admin/ads");
            });
          }}><Trash2 /> Delete</Button>
        ) : null}
      </div>
    </form>
  );
}
