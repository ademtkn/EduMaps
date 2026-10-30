"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useDict } from "@/components/i18n-provider";
import { useToast } from "@/components/ui/toast";

/** One-off messages carried in the URL by redirects (for example after deleting an account). */
export function NoticeToast() {
  const dict = useDict();
  const { toast } = useToast();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const notice = params.get("notice");

  useEffect(() => {
    if (notice !== "account_deleted") return;
    toast("success", dict.account.deleted);
    const next = new URLSearchParams(params.toString());
    next.delete("notice");
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice]);

  return null;
}
