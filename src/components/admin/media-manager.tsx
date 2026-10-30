"use client";

import { Copy, Loader2, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { deleteMediaAction, uploadMediaAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image";
import { useToast } from "@/components/ui/toast";
import { formatBytes, LARGE_BYTES } from "@/lib/media/format";

export function MediaUploader() {
  const router = useRouter();
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  function upload(files: FileList | null) {
    if (!files?.length) return;
    start(async () => {
      let ok = 0;
      let before = 0;
      let after = 0;
      for (const file of Array.from(files)) {
        const data = new FormData();
        data.set("file", file);
        const result = await uploadMediaAction(data);
        if (result.ok) {
          ok += 1;
          before += result.data!.inputBytes;
          after += result.data!.outputBytes;
        } else toast("error", `${file.name}: ${result.error}`);
      }
      if (ok) toast("success", `${ok} file${ok > 1 ? "s" : ""} uploaded and optimised: ${formatBytes(before)} → ${formatBytes(after)}`);
      if (input.current) input.current.value = "";
      router.refresh();
    });
  }

  return (
    <>
      <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" aria-label="Choose images to upload" onChange={(e) => upload(e.target.files)} />
      <Button onClick={() => input.current?.click()} disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Upload />} Upload images</Button>
    </>
  );
}

export function MediaCard({ file }: { file: { id: string; public_url: string; path: string; mime_type: string; size_bytes: number } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <figure className="overflow-hidden rounded-card border border-ink-200 bg-white shadow-card">
      <div className="relative aspect-[4/3] bg-ink-100">
        <MediaImage src={file.public_url} alt="" fill sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw" className="object-cover" />
      </div>
      <figcaption className="space-y-2 p-3">
        <p className="truncate text-caption text-ink-600" title={file.path}>{file.path.split("/").pop()}</p>
        <p className="text-caption text-ink-500">
          {file.mime_type.replace("image/", "").toUpperCase()} · {formatBytes(file.size_bytes)}
          {file.size_bytes >= LARGE_BYTES ? <span className="ml-1.5 rounded bg-warning-50 px-1.5 py-0.5 font-semibold text-warning-700">Large</span> : null}
        </p>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="flex-1" onClick={async () => { await navigator.clipboard.writeText(file.public_url); toast("success", "URL copied"); }}><Copy /> Copy URL</Button>
          <Button size="icon" variant="ghost" className="size-9 text-danger-600 hover:bg-danger-50" aria-label="Delete file" disabled={pending}
            onClick={() => {
              if (!window.confirm("Delete this file? Pages that use it will show a broken image.")) return;
              start(async () => {
                const r = await deleteMediaAction(file.id);
                if (!r.ok) return toast("error", r.error);
                router.refresh();
              });
            }}><Trash2 /></Button>
        </div>
      </figcaption>
    </figure>
  );
}
