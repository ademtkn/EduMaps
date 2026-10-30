"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDict } from "@/components/i18n-provider";
import { Select } from "@/components/ui/form";

export function SortSelect({ current }: { current: string }) {
  const dict = useDict();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2">
      <span className="hidden text-small text-ink-600 sm:inline">{dict.common.sortBy}</span>
      <Select
        aria-label={dict.common.sortBy}
        value={current}
        className="h-10 w-auto min-w-44"
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", event.target.value);
          next.delete("page");
          router.push(`${pathname}?${next.toString()}`, { scroll: false });
        }}
      >
        <option value="rating">{dict.schools.sortRating}</option>
        <option value="reviews">{dict.schools.sortReviews}</option>
        <option value="name">{dict.schools.sortName}</option>
        <option value="updated">{dict.schools.sortUpdated}</option>
      </Select>
    </label>
  );
}
