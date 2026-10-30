"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { uploadMediaAction } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { MediaImage } from "@/components/ui/media-image";
import { useToast } from "@/components/ui/toast";
import { formatBytes } from "@/lib/media/format";

export type I18nValue = { kg?: string; ru?: string; en?: string };
const LANGS = [["kg", "KG"], ["ru", "RU"], ["en", "EN"]] as const;

/** One field, three languages. A dot on a tab means that language already has text. */
export function I18nField({
  label, value, onChange, multiline = false, rows = 4, requiredEn = false, error, hint, maxLength,
}: {
  label: string; value: I18nValue | null | undefined; onChange: (next: I18nValue) => void; multiline?: boolean; rows?: number;
  requiredEn?: boolean; error?: string; hint?: ReactNode; maxLength?: number;
}) {
  const [active, setActive] = useState<(typeof LANGS)[number][0]>(requiredEn ? "en" : "kg");
  const id = useId();
  const v = value ?? {};
  const Control = multiline ? Textarea : Input;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <Label htmlFor={`${id}-${active}`} className="mb-0">{label}{requiredEn ? <span className="text-danger-600"> *</span> : null}</Label>
        <div role="tablist" aria-label="Choose language" className="inline-flex rounded-lg bg-ink-100 p-0.5">
          {LANGS.map(([code, name]) => (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={active === code}
              onClick={() => setActive(code)}
              className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-caption font-bold", active === code ? "bg-white text-brand-800 shadow-sm" : "text-ink-600")}
            >
              {name}
              <span className={cn("size-1.5 rounded-full", v[code]?.trim() ? "bg-leaf-500" : "bg-ink-300")} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <Control
        id={`${id}-${active}`}
        key={active}
        {...(multiline ? { rows } : {})}
        maxLength={maxLength}
        value={v[active] ?? ""}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange({ ...v, [active]: e.target.value })}
        lang={active === "kg" ? "ky" : active}
      />
      {error ? <p role="alert" className="mt-1.5 text-caption font-medium text-danger-600">{error}</p> : hint ? <p className="mt-1.5 text-caption text-ink-500">{hint}</p> : null}
    </div>
  );
}

/** Image URL with preview and upload to the media library. */
export function ImageField({ label, value, onChange, hint }: { label: string; value: string | null | undefined; onChange: (url: string) => void; hint?: string }) {
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const id = useId();

  function onFile(file: File | undefined) {
    if (!file) return;
    const data = new FormData();
    data.set("file", file);
    start(async () => {
      const result = await uploadMediaAction(data);
      if (!result.ok) return toast("error", result.error);
      onChange(result.data!.url);
      toast("success", `Image uploaded and optimised: ${formatBytes(result.data!.inputBytes)} → ${formatBytes(result.data!.outputBytes)}`);
    });
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-start gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-control border border-ink-200 bg-ink-100">
          {value ? <MediaImage src={value} alt="" fill sizes="80px" className="object-cover" /> : <ImagePlus className="absolute inset-0 m-auto size-6 text-ink-400" />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />
          <div className="flex flex-wrap gap-2">
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" aria-label={`${label} file`} onChange={(e) => onFile(e.target.files?.[0])} />
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => input.current?.click()}>
              {pending ? <Loader2 className="animate-spin" /> : <ImagePlus />} Upload image
            </Button>
            {value ? <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}><Trash2 /> Remove</Button> : null}
          </div>
          {hint ? <p className="text-caption text-ink-500">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-ink-200 bg-white shadow-card">
      <header className="border-b border-ink-200 px-5 py-4 sm:px-6">
        <h2 className="text-body font-semibold">{title}</h2>
        {description ? <p className="mt-0.5 text-small text-ink-600">{description}</p> : null}
      </header>
      <div className="space-y-5 p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function Check({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex items-start gap-3 text-small text-ink-800">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4.5 rounded border-ink-300 text-brand-700" />
      <span><span className="font-medium">{label}</span>{hint ? <span className="block text-caption text-ink-500">{hint}</span> : null}</span>
    </label>
  );
}

export function slugify(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
