"use client";

import { AlertTriangle, CheckCircle2, ImagePlus, Loader2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { importSchoolPhotoAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

type SchoolRef = { slug: string; name: string };

type Role = "logo" | "cover" | "gallery";

type Parsed = {
  file: File;
  slug: string;
  role: Role;
  order: number;
  school: SchoolRef | null;
  state: "ready" | "uploading" | "done" | "failed";
  message?: string;
};

/** `<slug>-logo.png` is the logo, `<slug>-1.jpg` the cover, `<slug>-2.jpg`… gallery photos. */
function parseName(file: File): { slug: string; role: Role; order: number } | null {
  const base = file.name.replace(/\.[a-z0-9]+$/i, "").trim();
  const match = /^(.*?)-(logo|\d{1,2})$/i.exec(base);
  if (!match) return null;
  const slug = match[1]!.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const suffix = match[2]!.toLowerCase();
  if (!slug) return null;
  if (suffix === "logo") return { slug, role: "logo", order: 0 };
  const order = Number(suffix);
  return order === 1 ? { slug, role: "cover", order: 0 } : { slug, role: "gallery", order };
}

const ROLE_LABEL: Record<Role, string> = { logo: "Logo", cover: "Cover", gallery: "Gallery" };

/**
 * Adds photos to many schools at once.
 *
 * The file name says where the picture goes, so a folder that was collected from the schools can be
 * dropped in and checked before anything is uploaded. Unmatched files are listed but never sent.
 */
export function PhotoImporter({ schools }: { schools: SchoolRef[] }) {
  const bySlug = useMemo(() => new Map(schools.map((s) => [s.slug, s])), [schools]);
  const [items, setItems] = useState<Parsed[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const input = useRef<HTMLInputElement>(null);

  const choose = (files: FileList | null) => {
    if (!files) return;
    const parsed: Parsed[] = [];
    for (const file of Array.from(files)) {
      const target = parseName(file);
      if (!target) {
        parsed.push({ file, slug: "", role: "gallery", order: 0, school: null, state: "failed", message: "The file name does not end with -logo, -1, -2…" });
        continue;
      }
      const school = bySlug.get(target.slug) ?? null;
      parsed.push({ file, ...target, school, state: school ? "ready" : "failed", message: school ? undefined : `No school with the slug "${target.slug}"` });
    }
    setItems(parsed);
    setProgress({ done: 0, total: parsed.filter((p) => p.state === "ready").length });
  };

  const upload = async () => {
    const ready = items.filter((item) => item.state === "ready" || item.state === "failed" || item.state === "done");
    const queue = items.map((item, index) => ({ item, index })).filter(({ item }) => item.school);
    setRunning(true);
    setProgress({ done: 0, total: queue.length });
    let done = 0;
    for (const { item, index } of queue) {
      setItems((current) => current.map((row, i) => (i === index ? { ...row, state: "uploading", message: undefined } : row)));
      const form = new FormData();
      form.set("file", item.file);
      form.set("slug", item.slug);
      form.set("role", item.role);
      form.set("order", String(item.order));
      const result = await importSchoolPhotoAction(form);
      done += 1;
      setProgress({ done, total: queue.length });
      setItems((current) =>
        current.map((row, i) =>
          i === index ? { ...row, state: result.ok ? "done" : "failed", message: result.ok ? undefined : result.error } : row
        )
      );
    }
    setRunning(false);
    void ready;
  };

  const usable = items.filter((item) => item.school).length;
  const unmatched = items.length - usable;

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-ink-200 bg-white p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-h3 font-semibold"><ImagePlus className="size-5 text-brand-700" /> Choose the photos</h2>
        <p className="mt-2 text-small text-ink-600">
          Name every file after the school slug and the slot it fills: <code className="rounded bg-ink-100 px-1">asylkech-girls-school-logo.jpg</code>,{" "}
          <code className="rounded bg-ink-100 px-1">asylkech-girls-school-1.jpg</code> (cover),{" "}
          <code className="rounded bg-ink-100 px-1">asylkech-girls-school-2.jpg</code> (gallery). JPEG, PNG, WebP and AVIF up to 8 MB; each
          picture is shrunk to 1600 px, converted to WebP and stripped of camera metadata.
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          aria-label="Choose photos"
          onChange={(event) => choose(event.target.files)}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={running}>
            <Upload /> Choose files
          </Button>
          <Button type="button" onClick={() => void upload()} disabled={running || usable === 0}>
            {running ? <Loader2 className="animate-spin" /> : null}
            {running ? `Uploading ${progress.done}/${progress.total}` : `Upload ${usable} photo(s)`}
          </Button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="rounded-card border border-ink-200 bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-4 py-3 text-small">
            <p className="font-semibold text-ink-800">
              {items.length} file(s) · {usable} matched{unmatched > 0 ? ` · ${unmatched} ignored` : ""}
            </p>
            {running ? (
              <p className="flex items-center gap-2 text-ink-600"><Loader2 className="size-4 animate-spin" /> {progress.done} / {progress.total}</p>
            ) : null}
          </div>
          <ul className="divide-y divide-ink-100">
            {items.map((item, index) => (
              <li key={`${item.file.name}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-small">
                <span className="min-w-0 flex-1 truncate text-ink-800">{item.file.name}</span>
                <span className="w-56 shrink-0 truncate text-ink-600">{item.school ? item.school.name : "—"}</span>
                <span className="w-20 shrink-0 text-caption text-ink-500">{item.school ? ROLE_LABEL[item.role] : ""}</span>
                <span className="w-64 shrink-0 text-right">
                  {item.state === "done" ? <span className="inline-flex items-center gap-1 text-leaf-700"><CheckCircle2 className="size-4" /> saved</span> : null}
                  {item.state === "uploading" ? <span className="inline-flex items-center gap-1 text-ink-600"><Loader2 className="size-4 animate-spin" /> uploading</span> : null}
                  {item.state === "failed" ? <span className="inline-flex items-center gap-1 text-danger-600" title={item.message}><AlertTriangle className="size-4" /> {item.message ?? "failed"}</span> : null}
                  {item.state === "ready" ? <span className="text-ink-500">ready</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
