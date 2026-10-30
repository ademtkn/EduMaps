"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteSchoolAction, saveSchoolAction } from "@/lib/actions/admin";
import { MAX_DOCUMENTS, PLAN_LIMITS, SCHOOL_TYPES, type Plan } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { Alert } from "@/components/ui/alert";
import { MapLinksFields } from "./map-links-fields";
import { Check, FormSection, I18nField, ImageField, slugify, type I18nValue } from "./fields";

export type SchoolFormValues = {
  id?: string;
  slug: string;
  name: I18nValue;
  tagline: I18nValue;
  about: I18nValue;
  city_id: string;
  school_type: (typeof SCHOOL_TYPES)[number];
  education_systems: string[];
  grade_from: number | string;
  grade_to: number | string;
  founded_year: number | string | null;
  student_count: number | string | null;
  teacher_count: number | string | null;
  avg_class_size: number | string | null;
  opening_time: string;
  closing_time: string;
  working_days: number[];
  schedule_notes: I18nValue;
  fee_min: number | string | null;
  fee_max: number | string | null;
  fee_period: "month" | "quarter" | "year";
  fee_billing_months: number;
  tuition_notes: I18nValue;
  has_scholarships: boolean;
  scholarships: I18nValue;
  has_transportation: boolean;
  transportation_info: I18nValue;
  has_boarding: boolean;
  boarding_info: I18nValue;
  phone: string;
  email: string;
  website: string;
  whatsapp: string;
  social: Record<string, string>;
  logo_url: string;
  cover_url: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  plan: Plan;
  data_status: "demo" | "unverified" | "verified";
  location: { lat: number | string; lng: number | string; address: I18nValue; district: string; google_maps_url: string; twogis_url: string } | null;
  languages: { code: string; is_primary: boolean }[];
  programs: { kind: "academic" | "club" | "sport"; name: I18nValue; description: I18nValue }[];
  facilities: { facility_key: string; note: I18nValue }[];
  fee_items: { item_key: string; included: boolean; extra_amount: number | string; extra_period: "" | "one_time" | "year" | "month" }[];
  media: { kind: "image" | "video"; url: string; storage_path: string; caption: I18nValue }[];
  documents: { title: string; url: string }[];
  faqs: { question: I18nValue; answer: I18nValue }[];
};

const SOCIALS = ["facebook", "instagram", "youtube", "telegram", "tiktok"] as const;

export type SchoolOptions = { systems: { key: string; label: string }[]; languages: { key: string; label: string }[]; facilities: { key: string; label: string }[]; feeItems: { key: string; label: string }[] };

export function SchoolForm({ initial, cities, options }: { initial: SchoolFormValues; cities: { id: string; name: string }[]; options: SchoolOptions }) {
  const router = useRouter();
  const { toast } = useToast();
  const [v, setV] = useState<SchoolFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));

  const limits = PLAN_LIMITS[v.plan];
  const photoCount = v.media.filter((m) => m.kind === "image").length;
  const videoCount = v.media.filter((m) => m.kind === "video").length;
  const set = <K extends keyof SchoolFormValues>(key: K, value: SchoolFormValues[K]) => setV((prev) => ({ ...prev, [key]: value }));
  const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const numberField = (key: keyof SchoolFormValues, label: string, hint?: string) => (
    <Field label={label} htmlFor={`f-${key}`} error={errors[key]} hint={hint}>
      <Input id={`f-${key}`} type="number" min={0} value={(v[key] as number | string | null) ?? ""} onChange={(e) => set(key, e.target.value as never)} />
    </Field>
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    const payload = {
      ...v,
      id: v.id ?? null,
      location: v.location && (v.location.lat !== "" || v.location.lng !== "" || v.location.district.trim() !== "" || v.location.google_maps_url.trim() !== "" || v.location.twogis_url.trim() !== "" || Object.values(v.location.address).some((a) => a?.trim())) ? v.location : null,
      languages: v.languages.map((l) => ({ code: l.code, is_primary: l.is_primary })),
    };
    start(async () => {
      const result = await saveSchoolAction(payload);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        return toast("error", result.error);
      }
      toast("success", "School saved");
      if (!v.id) router.replace(`/admin/schools/${result.data!.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {Object.keys(errors).length > 0 ? <Alert tone="danger" title="Please fix the highlighted fields">{Object.entries(errors).slice(0, 5).map(([k, m]) => <p key={k}>{k}: {m}</p>)}</Alert> : null}

      <FormSection title="Basics" description="Name, address on the site and publishing state.">
        <I18nField
          label="School name" requiredEn value={v.name} error={errors.name}
          onChange={(name) => { set("name", name); if (!slugTouched) set("slug", slugify(name.en ?? "")); }}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="URL slug" htmlFor="f-slug" error={errors.slug} hint="Used in the public URL, e.g. /schools/my-school">
            <Input id="f-slug" value={v.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
          </Field>
          <Field label="City" htmlFor="f-city" error={errors.city_id}>
            <Select id="f-city" value={v.city_id} onChange={(e) => set("city_id", e.target.value)}>
              <option value="">Select a city…</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="School type" htmlFor="f-type">
            <Select id="f-type" value={v.school_type} onChange={(e) => set("school_type", e.target.value as SchoolFormValues["school_type"])}>
              {SCHOOL_TYPES.map((t) => <option key={t} value={t}>{t[0]!.toUpperCase() + t.slice(1)}</option>)}
            </Select>
          </Field>
          <Field label="Status" htmlFor="f-status" hint="Only published schools are visible to the public.">
            <Select id="f-status" value={v.status} onChange={(e) => set("status", e.target.value as SchoolFormValues["status"])}>
              <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
            </Select>
          </Field>
        </div>
        <Field label="Information status" htmlFor="f-dstatus" hint="Unverified and demo profiles show a notice to visitors. Mark as verified once the school confirms its details.">
          <Select id="f-dstatus" value={v.data_status} onChange={(e) => set("data_status", e.target.value as SchoolFormValues["data_status"])}>
            <option value="verified">Verified with the school</option><option value="unverified">Unverified (listed, details pending)</option><option value="demo">Demo (fictional)</option>
          </Select>
        </Field>
        <Field label="Listing plan (only administrators see this)" htmlFor="f-plan" hint="Free: up to 2 gallery photos and 1 video. Pro: up to 10 photos and 5 videos. It changes nothing else: ratings, ranking and search order are never affected.">
          <Select id="f-plan" value={v.plan} onChange={(e) => set("plan", e.target.value as Plan)}>
            <option value="free">Free (2 photos, 1 video)</option><option value="pro">Pro (10 photos, 5 videos)</option>
          </Select>
        </Field>
        <Check label="Featured school" hint="Editorial marker only. It never affects ratings, rankings or search order." checked={v.is_featured} onChange={(x) => set("is_featured", x)} />
      </FormSection>

      <FormSection title="Description">
        <I18nField label="Tagline" value={v.tagline} onChange={(x) => set("tagline", x)} maxLength={200} />
        <I18nField label="About the school" multiline rows={8} value={v.about} onChange={(x) => set("about", x)} error={errors.about} />
      </FormSection>

      <FormSection title="Academics" description="Education systems, grade range and size.">
        <fieldset>
          <legend className="mb-2 flex items-center justify-between text-small font-medium">Education systems <a href="/admin/options" className="text-caption font-normal text-brand-700 hover:underline">Manage options</a></legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {options.systems.map((s) => <Check key={s.key} label={s.label} checked={v.education_systems.includes(s.key)} onChange={() => set("education_systems", toggle(v.education_systems, s.key))} />)}
          </div>
        </fieldset>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {numberField("grade_from", "First grade", "0 = preschool")}
          {numberField("grade_to", "Last grade")}
          {numberField("founded_year", "Founded (year)")}
          {numberField("avg_class_size", "Average class size")}
          {numberField("student_count", "Students")}
          {numberField("teacher_count", "Teachers")}
        </div>
        <fieldset>
          <legend className="mb-2 text-small font-medium">Languages of instruction</legend>
          <div className="space-y-2">
            {options.languages.map(({ key: code, label: langLabel }) => {
              const entry = v.languages.find((l) => l.code === code);
              return (
                <div key={code} className="flex flex-wrap items-center gap-x-6 gap-y-1">
                  <Check label={langLabel} checked={Boolean(entry)} onChange={(on) => set("languages", on ? [...v.languages, { code, is_primary: v.languages.length === 0 }] : v.languages.filter((l) => l.code !== code))} />
                  {entry ? <label className="flex items-center gap-2 text-caption text-ink-600"><input type="radio" name="primary-language" checked={entry.is_primary} onChange={() => set("languages", v.languages.map((l) => ({ ...l, is_primary: l.code === code })))} /> Main language</label> : null}
                </div>
              );
            })}
          </div>
        </fieldset>
      </FormSection>

      <FormSection title="School day" description="When classes start and finish, and on which days the school works. Shown on school cards, the school page and in comparisons.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Classes start" htmlFor="f-opening_time" error={errors.opening_time}>
            <Input id="f-opening_time" type="time" value={v.opening_time} onChange={(e) => set("opening_time", e.target.value)} />
          </Field>
          <Field label="Classes finish" htmlFor="f-closing_time" error={errors.closing_time}>
            <Input id="f-closing_time" type="time" value={v.closing_time} onChange={(e) => set("closing_time", e.target.value)} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-small font-medium">Working days</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const).map((name, i) => (
              <Check key={name} label={name} checked={v.working_days.includes(i + 1)} onChange={() => set("working_days", v.working_days.includes(i + 1) ? v.working_days.filter((d) => d !== i + 1) : [...v.working_days, i + 1])} />
            ))}
          </div>
        </fieldset>
        <I18nField label="Schedule notes" multiline rows={2} value={v.schedule_notes} onChange={(x) => set("schedule_notes", x)} />
      </FormSection>

      <FormSection title="Tuition, transport and boarding" description="Enter the fee exactly as the school states it, in Kyrgyz som (KGS), and choose how often it is paid. Use 0 for free public schools.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {numberField("fee_min", "Fee from (KGS)")}
          {numberField("fee_max", "Fee to (KGS)", "Leave empty if there is a single price.")}
          <Field label="Paid" htmlFor="f-fee_period">
            <Select id="f-fee_period" value={v.fee_period} onChange={(e) => set("fee_period", e.target.value as SchoolFormValues["fee_period"])}>
              <option value="month">Every month</option><option value="quarter">Every quarter</option><option value="year">Once a year</option>
            </Select>
          </Field>
          <Field label="School year length" htmlFor="f-fee_billing_months" hint="Months the fee is spread over. Used to convert to a monthly amount.">
            <Select id="f-fee_billing_months" value={v.fee_billing_months} onChange={(e) => set("fee_billing_months", Number(e.target.value))}>
              {[9, 10, 11, 12].map((m) => <option key={m} value={m}>{m} months</option>)}
            </Select>
          </Field>
        </div>
        <I18nField label="Tuition notes" multiline rows={3} value={v.tuition_notes} onChange={(x) => set("tuition_notes", x)} />
        <fieldset>
          <legend className="mb-1 flex items-center justify-between text-small font-medium">What the fee covers <a href="/admin/options" className="text-caption font-normal text-brand-700 hover:underline">Manage options</a></legend>
          <p className="mb-3 text-caption text-ink-500">Leave an item as “Not stated” if you do not know. Visitors are then told to ask the school, instead of being shown a “No”.</p>
          <div className="space-y-2">
            {options.feeItems.map(({ key, label }) => {
              const entry = v.fee_items.find((f) => f.item_key === key);
              const state = !entry ? "unknown" : entry.included ? "included" : "separate";
              const update = (patch: Partial<NonNullable<typeof entry>> | null) =>
                set("fee_items", patch === null ? v.fee_items.filter((f) => f.item_key !== key) : entry ? v.fee_items.map((f) => (f.item_key === key ? { ...f, ...patch } : f)) : [...v.fee_items, { item_key: key, included: true, extra_amount: "", extra_period: "", ...patch }]);
              return (
                <div key={key} className="flex flex-wrap items-center gap-3 rounded-control border border-ink-200 bg-white px-3 py-2">
                  <span className="w-48 text-small font-medium">{label}</span>
                  <Select aria-label={`${label}: coverage`} className="h-9 w-44" value={state}
                    onChange={(e) => { const next = e.target.value; if (next === "unknown") update(null); else update({ included: next === "included", ...(next === "included" ? { extra_amount: "", extra_period: "" } : {}) }); }}>
                    <option value="unknown">Not stated</option><option value="included">Included in the fee</option><option value="separate">Paid separately</option>
                  </Select>
                  {state === "separate" ? (
                    <>
                      <Input aria-label={`${label}: extra cost (KGS)`} type="number" min={0} placeholder="Cost (KGS), optional" className="h-9 w-44" value={entry?.extra_amount ?? ""} onChange={(e) => update({ extra_amount: e.target.value })} />
                      <Select aria-label={`${label}: how often`} className="h-9 w-40" value={entry?.extra_period ?? ""} onChange={(e) => update({ extra_period: e.target.value as "" | "one_time" | "year" | "month" })}>
                        <option value="">How often…</option><option value="one_time">One-time</option><option value="year">Every year</option><option value="month">Every month</option>
                      </Select>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
          {errors.fee_items || Object.keys(errors).some((k) => k.startsWith("fee_items")) ? <p role="alert" className="mt-2 text-caption font-medium text-danger-600">{errors.fee_items ?? Object.entries(errors).find(([k]) => k.startsWith("fee_items"))?.[1]}</p> : null}
        </fieldset>
        <Check label="Scholarships available" checked={v.has_scholarships} onChange={(x) => set("has_scholarships", x)} />
        {v.has_scholarships ? <I18nField label="Scholarship details" multiline rows={3} value={v.scholarships} onChange={(x) => set("scholarships", x)} /> : null}
        <Check label="School transportation" checked={v.has_transportation} onChange={(x) => set("has_transportation", x)} />
        {v.has_transportation ? <I18nField label="Transportation details" multiline rows={2} value={v.transportation_info} onChange={(x) => set("transportation_info", x)} /> : null}
        <Check label="Boarding" checked={v.has_boarding} onChange={(x) => set("has_boarding", x)} />
        {v.has_boarding ? <I18nField label="Boarding details" multiline rows={2} value={v.boarding_info} onChange={(x) => set("boarding_info", x)} /> : null}
      </FormSection>

      <FormSection title="Programs, clubs and sports">
        <div className="space-y-4">
          {v.programs.map((p, i) => (
            <div key={i} className="space-y-3 rounded-card border border-ink-200 bg-ink-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <Select aria-label="Kind" className="w-40" value={p.kind} onChange={(e) => set("programs", v.programs.map((x, j) => (j === i ? { ...x, kind: e.target.value as typeof p.kind } : x)))}>
                  <option value="academic">Academic program</option><option value="club">Club</option><option value="sport">Sport</option>
                </Select>
                <Button type="button" size="sm" variant="ghost" className="text-danger-600" onClick={() => set("programs", v.programs.filter((_, j) => j !== i))}><Trash2 /> Remove</Button>
              </div>
              <I18nField label="Name" requiredEn value={p.name} error={errors[`programs.${i}.name`]} onChange={(name) => set("programs", v.programs.map((x, j) => (j === i ? { ...x, name } : x)))} />
              <I18nField label="Description" value={p.description} onChange={(description) => set("programs", v.programs.map((x, j) => (j === i ? { ...x, description } : x)))} />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => set("programs", [...v.programs, { kind: "academic", name: {}, description: {} }])}><Plus /> Add program, club or sport</Button>
        </div>
      </FormSection>

      <FormSection title="Facilities">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {options.facilities.map(({ key, label }) => (
            <Check key={key} label={label} checked={v.facilities.some((f) => f.facility_key === key)}
              onChange={(on) => set("facilities", on ? [...v.facilities, { facility_key: key, note: {} }] : v.facilities.filter((f) => f.facility_key !== key))} />
          ))}
        </div>
      </FormSection>

      <FormSection title="Photos and videos" description="Logo and cover are used on cards and the school page header. Gallery images and YouTube videos appear in their own sections.">
        <div className="grid gap-5 sm:grid-cols-2">
          <ImageField label="Logo" value={v.logo_url} onChange={(x) => set("logo_url", x)} hint="Square image, at least 256 px." />
          <ImageField label="Cover image" value={v.cover_url} onChange={(x) => set("cover_url", x)} hint="Wide image, 1600×900 recommended." />
        </div>
        <div className="space-y-4">
          {v.media.map((m, i) => (
            <div key={i} className="space-y-3 rounded-card border border-ink-200 bg-ink-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-small font-semibold capitalize">{m.kind === "image" ? "Gallery photo" : "YouTube video"}</span>
                <Button type="button" size="sm" variant="ghost" className="text-danger-600" onClick={() => set("media", v.media.filter((_, j) => j !== i))}><Trash2 /> Remove</Button>
              </div>
              {m.kind === "image" ? (
                <ImageField label="Photo" value={m.url} onChange={(url) => set("media", v.media.map((x, j) => (j === i ? { ...x, url } : x)))} />
              ) : (
                <Field label="YouTube URL" htmlFor={`vid-${i}`} error={errors[`media.${i}.url`]}>
                  <Input id={`vid-${i}`} value={m.url} placeholder="https://www.youtube.com/watch?v=…" onChange={(e) => set("media", v.media.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                </Field>
              )}
              <I18nField label="Caption" value={m.caption} onChange={(caption) => set("media", v.media.map((x, j) => (j === i ? { ...x, caption } : x)))} />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={photoCount >= limits.photos} onClick={() => set("media", [...v.media, { kind: "image", url: "", storage_path: "", caption: {} }])}><Plus /> Add photo</Button>
            <Button type="button" variant="outline" disabled={videoCount >= limits.videos} onClick={() => set("media", [...v.media, { kind: "video", url: "", storage_path: "", caption: {} }])}><Plus /> Add video</Button>
          </div>
          <p className="text-caption text-ink-500">{photoCount} of {limits.photos} photos · {videoCount} of {limits.videos} video{limits.videos === 1 ? "" : "s"} ({v.plan === "pro" ? "Pro" : "Free"} plan). Photos are shrunk to web size automatically. Upload videos to YouTube (as “Unlisted”) and paste the link here: they are never stored on our server.</p>
          {errors.media ? <p role="alert" className="text-caption font-medium text-danger-600">{errors.media}</p> : null}
        </div>
      </FormSection>

      <FormSection title="Documents" description="Brochures, price lists, admission rules. Documents are links, not uploads: paste a share link from the school's own website or from a shared drive (Google Drive, Dropbox…) set to “anyone with the link can view”. Visitors see where the link leads before they open it.">
        <div className="space-y-3">
          {v.documents.map((d, i) => (
            <div key={i} className="grid gap-3 rounded-card border border-ink-200 bg-ink-50 p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
              <Field label="Title" htmlFor={`doc-title-${i}`} error={errors[`documents.${i}.title`]}>
                <Input id={`doc-title-${i}`} value={d.title} placeholder="Admission rules 2026/27" onChange={(e) => set("documents", v.documents.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              </Field>
              <Field label="Link" htmlFor={`doc-url-${i}`} error={errors[`documents.${i}.url`]}>
                <Input id={`doc-url-${i}`} value={d.url} placeholder="https://" inputMode="url" onChange={(e) => set("documents", v.documents.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              </Field>
              <Button type="button" size="sm" variant="ghost" className="text-danger-600" onClick={() => set("documents", v.documents.filter((_, j) => j !== i))}><Trash2 /> Remove</Button>
            </div>
          ))}
          <Button type="button" variant="outline" disabled={v.documents.length >= MAX_DOCUMENTS} onClick={() => set("documents", [...v.documents, { title: "", url: "" }])}><Plus /> Add document link</Button>
          {errors.documents ? <p role="alert" className="text-caption font-medium text-danger-600">{errors.documents}</p> : null}
        </div>
      </FormSection>

      <FormSection title="Location and contacts" description="The address is enough to list a school. Paste the Google Maps and 2GIS links below the address and the coordinates are filled in for you. Coordinates place the school on the map; without them the page shows the address and the links instead of a map.">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Latitude (optional)" htmlFor="f-lat" error={errors["location.lat"]} hint="Kyrgyzstan: 39 – 44">
            <Input id="f-lat" inputMode="decimal" value={v.location?.lat ?? ""} onChange={(e) => set("location", { ...(v.location ?? { lng: "", address: {}, district: "", google_maps_url: "", twogis_url: "" }), lat: e.target.value })} />
          </Field>
          <Field label="Longitude (optional)" htmlFor="f-lng" error={errors["location.lng"]} hint="Kyrgyzstan: 69 – 81">
            <Input id="f-lng" inputMode="decimal" value={v.location?.lng ?? ""} onChange={(e) => set("location", { ...(v.location ?? { lat: "", address: {}, district: "", google_maps_url: "", twogis_url: "" }), lng: e.target.value })} />
          </Field>
          <Field label="District" htmlFor="f-district">
            <Input id="f-district" value={v.location?.district ?? ""} onChange={(e) => set("location", { ...(v.location ?? { lat: "", lng: "", address: {}, google_maps_url: "", twogis_url: "" }), district: e.target.value })} />
          </Field>
        </div>
        <I18nField label="Street address" requiredEn value={v.location?.address} error={errors["location.address"]} onChange={(address) => set("location", { ...(v.location ?? { lat: "", lng: "", district: "", google_maps_url: "", twogis_url: "" }), address })} />
        <MapLinksFields
          lat={v.location?.lat ?? ""} lng={v.location?.lng ?? ""} google={v.location?.google_maps_url ?? ""} twogis={v.location?.twogis_url ?? ""}
          // applied to the newest form state: an answer from the server may arrive after the administrator typed something else
          onChange={(patch) => setV((prev) => ({ ...prev, location: { ...(prev.location ?? { lat: "", lng: "", address: {}, district: "", google_maps_url: "", twogis_url: "" }), ...patch } }))}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Phone" htmlFor="f-phone" error={errors.phone}><Input id="f-phone" value={v.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email" htmlFor="f-email" error={errors.email}><Input id="f-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Website" htmlFor="f-web" error={errors.website}><Input id="f-web" value={v.website} placeholder="https://" onChange={(e) => set("website", e.target.value)} /></Field>
        </div>
        <Field label="WhatsApp number" htmlFor="f-whatsapp" error={errors.whatsapp} hint="The number parents write to. Any common format works (0555 123 456, +996 555 123 456). Leave empty if the school has no WhatsApp: no button is shown.">
          <Input id="f-whatsapp" type="tel" inputMode="tel" value={v.whatsapp} placeholder="+996 555 123 456" onChange={(e) => set("whatsapp", e.target.value)} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIALS.map((s) => (
            <Field key={s} label={s[0]!.toUpperCase() + s.slice(1)} htmlFor={`f-${s}`} error={errors[`social.${s}`]}>
              <Input id={`f-${s}`} value={v.social[s] ?? ""} placeholder="https://" onChange={(e) => set("social", { ...v.social, [s]: e.target.value })} />
            </Field>
          ))}
        </div>
      </FormSection>

      <FormSection title="Frequently asked questions">
        <div className="space-y-4">
          {v.faqs.map((f, i) => (
            <div key={i} className="space-y-3 rounded-card border border-ink-200 bg-ink-50 p-4">
              <I18nField label="Question" requiredEn value={f.question} error={errors[`faqs.${i}.question`]} onChange={(question) => set("faqs", v.faqs.map((x, j) => (j === i ? { ...x, question } : x)))} />
              <I18nField label="Answer" multiline rows={3} requiredEn value={f.answer} error={errors[`faqs.${i}.answer`]} onChange={(answer) => set("faqs", v.faqs.map((x, j) => (j === i ? { ...x, answer } : x)))} />
              <Button type="button" size="sm" variant="ghost" className="text-danger-600" onClick={() => set("faqs", v.faqs.filter((_, j) => j !== i))}><Trash2 /> Remove</Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => set("faqs", [...v.faqs, { question: {}, answer: {} }])}><Plus /> Add question</Button>
        </div>
      </FormSection>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" disabled={pending}><Save /> {pending ? "Saving…" : "Save school"}</Button>
          <Button asChild variant="ghost"><Link href="/admin/schools">Cancel</Link></Button>
          {v.id && v.status === "published" ? <Button asChild variant="outline"><a href={`/kg/schools/${v.slug}`} target="_blank" rel="noreferrer">View on site</a></Button> : null}
        </div>
        {v.id ? (
          <Button type="button" variant="ghost" className="text-danger-600 hover:bg-danger-50" disabled={pending}
            onClick={() => {
              if (!window.confirm("Delete this school and all of its reviews permanently?")) return;
              start(async () => {
                const result = await deleteSchoolAction(v.id!);
                if (!result.ok) return toast("error", result.error);
                router.replace("/admin/schools");
              });
            }}><Trash2 /> Delete school</Button>
        ) : null}
      </div>
    </form>
  );
}
