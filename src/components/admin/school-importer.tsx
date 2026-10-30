"use client";

import { CheckCircle2, FileSpreadsheet, TriangleAlert, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { previewSchoolImportAction, runSchoolImportAction, type ImportPreview, type ImportRun, type PreviewRow } from "@/lib/actions/import";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Panel } from "./ui";

const ACTION_LABEL: Record<PreviewRow["action"], { label: string; tone: "success" | "info" | "neutral" | "danger" }> = {
  create: { label: "New school", tone: "success" },
  update: { label: "Update", tone: "info" },
  unchanged: { label: "No change", tone: "neutral" },
  skip: { label: "Skipped", tone: "neutral" },
  error: { label: "Has errors", tone: "danger" },
};

export function SchoolImporter() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<"create" | "update">("create");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [dataStatus, setDataStatus] = useState<"unverified" | "verified" | "demo">("unverified");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [run, setRun] = useState<ImportRun | null>(null);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [pending, start] = useTransition();

  const build = () => {
    const data = new FormData();
    const file = fileInput.current?.files?.[0];
    if (file) data.set("file", file);
    data.set("mode", mode);
    data.set("status", status);
    data.set("data_status", dataStatus);
    return data;
  };
  const invalidate = () => {
    setPreview(null);
    setRun(null);
  };

  const ready = preview?.ok ? preview.counts.create + preview.counts.update : 0;
  const rows = preview?.ok ? (onlyProblems ? preview.rows.filter((r) => r.errors.length || r.warnings.length) : preview.rows) : [];

  return (
    <div className="space-y-6">
      <Panel title="1. Choose the file">
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInput}
              id="import-file"
              type="file"
              accept=".csv,text/csv,text/plain"
              className="sr-only"
              onChange={(e) => {
                setFileName(e.target.files?.[0]?.name ?? "");
                invalidate();
              }}
            />
            <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}><Upload /> {fileName ? "Choose another file" : "Choose a CSV file"}</Button>
            {fileName ? <span className="flex items-center gap-2 text-small text-ink-700"><FileSpreadsheet className="size-4 text-ink-500" />{fileName}</span> : <span className="text-small text-ink-500">No file chosen</span>}
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Schools that already exist" htmlFor="imp-mode" hint="Update changes only the columns that are filled in. Photos, programs and questions are never touched.">
              <Select id="imp-mode" value={mode} onChange={(e) => { setMode(e.target.value as typeof mode); invalidate(); }}>
                <option value="create">Leave them as they are</option>
                <option value="update">Update them from the file</option>
              </Select>
            </Field>
            <Field label="New schools are saved as" htmlFor="imp-status" hint="Used when the status column is empty. Draft schools are not public.">
              <Select id="imp-status" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); invalidate(); }}>
                <option value="draft">Draft (not public yet)</option>
                <option value="published">Published</option>
              </Select>
            </Field>
            <Field label="Information status of new schools" htmlFor="imp-ds" hint="Unverified profiles show a notice to visitors. Use Verified only after the school confirmed its details.">
              <Select id="imp-ds" value={dataStatus} onChange={(e) => { setDataStatus(e.target.value as typeof dataStatus); invalidate(); }}>
                <option value="unverified">Unverified</option>
                <option value="verified">Verified with the school</option>
                <option value="demo">Demo (fictional)</option>
              </Select>
            </Field>
          </div>
          <Button
            type="button"
            disabled={pending || !fileName}
            onClick={() => start(async () => { setRun(null); setPreview(await previewSchoolImportAction(build())); })}
          >
            {pending && !preview ? "Checking…" : "Check the file"}
          </Button>
          <p className="text-caption text-ink-500">Nothing is saved at this step.</p>
        </div>
      </Panel>

      {preview && !preview.ok ? <Alert tone="danger" title="This file cannot be used">{preview.error}</Alert> : null}

      {preview?.ok ? (
        <Panel title="2. Check the result">
          <div className="space-y-5 p-5">
            <div className="flex flex-wrap gap-2 text-small">
              {(Object.keys(ACTION_LABEL) as PreviewRow["action"][]).map((k) => (
                <Badge key={k} tone={ACTION_LABEL[k].tone}>{preview.counts[k]} {ACTION_LABEL[k].label.toLowerCase()}</Badge>
              ))}
            </div>
            {preview.ignored.length ? <Alert tone="warning" title="Columns that were not recognised and will be ignored">{preview.ignored.join(", ")}</Alert> : null}
            {preview.counts.error > 0 ? <Alert tone="warning">Rows with errors are not saved. Fix them in the file and check it again, or import the valid rows now and the rest later.</Alert> : null}
            <label className="flex items-center gap-2 text-small text-ink-700">
              <input type="checkbox" className="size-4 rounded border-ink-300" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} /> Show only rows with errors or notes
            </label>
            <div className="overflow-x-auto rounded-card border border-ink-200">
              <table className="w-full min-w-[40rem] text-left text-small">
                <thead className="bg-ink-50 text-caption font-semibold uppercase tracking-wide text-ink-500">
                  <tr><th className="px-4 py-3">Row</th><th className="px-4 py-3">School</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Details</th></tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {rows.map((r) => (
                    <tr key={r.line} className={cn("align-top", r.action === "error" && "bg-danger-50/40")}>
                      <td className="px-4 py-3 text-ink-500">{r.line}</td>
                      <td className="px-4 py-3"><p className="font-semibold">{r.name || "—"}</p><p className="text-caption text-ink-500">{r.slug}</p></td>
                      <td className="px-4 py-3"><Badge tone={ACTION_LABEL[r.action].tone}>{ACTION_LABEL[r.action].label}</Badge></td>
                      <td className="space-y-1 px-4 py-3">
                        {r.errors.map((e) => <p key={e} className="flex gap-1.5 font-medium text-danger-700"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" />{e}</p>)}
                        {r.changes.length ? <p className="text-ink-700">Will change: {r.changes.join(", ")}</p> : null}
                        {r.warnings.map((w) => <p key={w} className="text-warning-700">• {w}</p>)}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-500">Nothing to show.</td></tr> : null}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                size="lg"
                disabled={pending || ready === 0}
                onClick={() => {
                  if (!window.confirm(`Save ${ready} school${ready === 1 ? "" : "s"}?`)) return;
                  start(async () => { setRun(await runSchoolImportAction(build())); });
                }}
              >
                {pending && preview ? "Importing…" : `Import ${ready} school${ready === 1 ? "" : "s"}`}
              </Button>
              <p className="text-caption text-ink-500">Every row is checked again while saving. Changes are recorded in the audit log.</p>
            </div>
          </div>
        </Panel>
      ) : null}

      {run && !run.ok ? <Alert tone="danger" title="Import stopped">{run.error}</Alert> : null}
      {run?.ok ? (
        <Panel title="3. Done">
          <div className="space-y-4 p-5">
            <Alert tone={run.results.some((r) => r.result === "failed") ? "warning" : "success"} title={`${run.results.filter((r) => r.result !== "failed").length} saved, ${run.results.filter((r) => r.result === "failed").length} failed, ${run.skipped} skipped`}>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4" />Saved schools are visible on the site as soon as their status is Published.</span>
            </Alert>
            <ul className="divide-y divide-ink-200 rounded-card border border-ink-200 text-small">
              {run.results.map((r) => (
                <li key={r.line} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <span><span className="mr-2 text-ink-500">Row {r.line}</span><span className="font-semibold">{r.name}</span></span>
                  <span className="flex items-center gap-3">
                    {r.result === "failed" ? <span className="text-danger-700">{r.error}</span> : r.id ? <Link href={`/admin/schools/${r.id}`} className="font-semibold text-brand-700 hover:underline">Open</Link> : null}
                    <Badge tone={r.result === "failed" ? "danger" : r.result === "created" ? "success" : "info"}>{r.result === "created" ? "Created" : r.result === "updated" ? "Updated" : "Failed"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
