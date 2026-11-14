import { Skeleton } from "@/components/ui/skeleton";

/** Shown while a school profile is fetched (nine related tables are read for one page). */
export default function SchoolProfileLoading() {
  return (
    <div aria-busy="true">
      <div className="bg-brand-900 py-10">
        <div className="container-page">
          <Skeleton className="h-3 w-56 bg-white/20" />
          <div className="mt-6 flex items-start gap-5">
            <Skeleton className="size-16 rounded-xl bg-white/20" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-2/3 bg-white/20" />
              <Skeleton className="h-4 w-1/2 bg-white/20" />
            </div>
          </div>
        </div>
      </div>
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
