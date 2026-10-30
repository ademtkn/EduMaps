"use client";

import { Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteArticleAction, saveArticleAction } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { Check, FormSection, I18nField, ImageField, slugify, type I18nValue } from "./fields";

export type ArticleFormValues = {
  id?: string;
  slug: string;
  category_id: string;
  kind: "article" | "video" | "guide";
  title: I18nValue;
  excerpt: I18nValue;
  body: I18nValue;
  cover_url: string;
  video_url: string;
  tags: string;
  reading_minutes: number | string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
};

export function ArticleForm({ initial, categories }: { initial: ArticleFormValues; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [pending, start] = useTransition();
  const set = <K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) => setV((p) => ({ ...p, [key]: value }));
  const backHref = v.kind === "video" ? "/admin/videos" : "/admin/articles";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    const payload = {
      ...v,
      id: v.id ?? null,
      tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    start(async () => {
      const result = await saveArticleAction(payload);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        return toast("error", result.error);
      }
      toast("success", "Saved");
      if (!v.id) router.replace(`/admin/articles/${result.data!.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {Object.keys(errors).length > 0 ? <Alert tone="danger" title="Please fix the highlighted fields">{Object.entries(errors).slice(0, 4).map(([k, m]) => <p key={k}>{k}: {m}</p>)}</Alert> : null}
      <FormSection title="Content">
        <I18nField label="Title" requiredEn value={v.title} error={errors.title} onChange={(title) => { set("title", title); if (!slugTouched) set("slug", slugify(title.en ?? "")); }} />
        <I18nField label="Summary" multiline rows={3} maxLength={400} value={v.excerpt} onChange={(x) => set("excerpt", x)} hint="Shown on cards and in search results." />
        <I18nField label="Body (Markdown)" multiline rows={16} value={v.body} onChange={(x) => set("body", x)} hint="Supports headings (##), lists, bold, links, quotes and tables. Raw HTML is ignored." />
      </FormSection>

      <FormSection title="Details">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="URL slug" htmlFor="a-slug" error={errors.slug}><Input id="a-slug" value={v.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} /></Field>
          <Field label="Category" htmlFor="a-cat" error={errors.category_id}>
            <Select id="a-cat" value={v.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Type" htmlFor="a-kind">
            <Select id="a-kind" value={v.kind} onChange={(e) => set("kind", e.target.value as ArticleFormValues["kind"])}>
              <option value="article">Article</option><option value="guide">Guide</option><option value="video">Video</option>
            </Select>
          </Field>
          <Field label="Status" htmlFor="a-status">
            <Select id="a-status" value={v.status} onChange={(e) => set("status", e.target.value as ArticleFormValues["status"])}>
              <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
            </Select>
          </Field>
          <Field label="Reading time (minutes)" htmlFor="a-min" error={errors.reading_minutes}><Input id="a-min" type="number" min={1} max={120} value={v.reading_minutes} onChange={(e) => set("reading_minutes", e.target.value)} /></Field>
          <Field label="Tags" htmlFor="a-tags" hint="Comma separated, e.g. ib, cambridge"><Input id="a-tags" value={v.tags} onChange={(e) => set("tags", e.target.value)} /></Field>
        </div>
        {v.kind === "video" ? (
          <Field label="YouTube URL" htmlFor="a-video" error={errors.video_url}><Input id="a-video" placeholder="https://www.youtube.com/watch?v=…" value={v.video_url} onChange={(e) => set("video_url", e.target.value)} /></Field>
        ) : null}
        <ImageField label="Cover image" value={v.cover_url} onChange={(x) => set("cover_url", x)} hint="16:10 works best. Shown on cards and as the social preview." />
        <Check label="Featured" hint="Featured items are listed first in the Education Hub." checked={v.is_featured} onChange={(x) => set("is_featured", x)} />
      </FormSection>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={pending}><Save /> {pending ? "Saving…" : "Save"}</Button>
          <Button asChild variant="ghost"><Link href={backHref}>Cancel</Link></Button>
        </div>
        {v.id ? (
          <Button type="button" variant="ghost" className="text-danger-600 hover:bg-danger-50" disabled={pending}
            onClick={() => {
              if (!window.confirm("Delete this item permanently?")) return;
              start(async () => {
                const result = await deleteArticleAction(v.id!);
                if (!result.ok) return toast("error", result.error);
                router.replace(backHref);
              });
            }}><Trash2 /> Delete</Button>
        ) : null}
      </div>
    </form>
  );
}
