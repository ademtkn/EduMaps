import { AdminPage } from "@/components/admin/ui";
import { MediaCard, MediaUploader } from "@/components/admin/media-manager";
import { Pagination } from "@/components/ui/pagination";
import { createClient } from "@/lib/supabase/server";
import { firstParam, toInt } from "@/lib/utils";

export const metadata = { title: "Media files" };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 24;

export default async function AdminMedia({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const page = Math.max(1, toInt(firstParam((await searchParams).page)) ?? 1);
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("media_files")
    .select("id,public_url,path,mime_type,size_bytes", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  return (
    <AdminPage title="Media files" description="Images stored in the public media bucket. JPEG, PNG, WebP and AVIF up to 8 MB. Copy a URL to use it anywhere, or upload directly from the school, article and ad editors." actions={<MediaUploader />}>
      {(data ?? []).length === 0 ? <p className="rounded-card border border-dashed border-ink-300 bg-white py-16 text-center text-small text-ink-500">No files uploaded yet.</p> : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">{(data ?? []).map((f) => <MediaCard key={f.id} file={f} />)}</div>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))} hrefFor={(p) => `/admin/media?page=${p}`} prevLabel="Previous page" nextLabel="Next page" />
    </AdminPage>
  );
}
