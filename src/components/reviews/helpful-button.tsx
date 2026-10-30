"use client";

import { ThumbsUp } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toggleHelpfulAction } from "@/lib/actions/content";
import { errorText } from "@/lib/form-errors";
import { localizedPath } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useDict, useLang } from "@/components/i18n-provider";
import { useToast } from "@/components/ui/toast";

export function HelpfulButton({ reviewId, initialCount, ownerId }: { reviewId: string; initialCount: number; ownerId: string }) {
  const { member } = useAuth();
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [count, setCount] = useState(initialCount);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!member) return setActive(false);
    createClient()
      .from("review_votes")
      .select("review_id")
      .eq("review_id", reviewId)
      .eq("user_id", member.id)
      .maybeSingle()
      .then(({ data }) => setActive(Boolean(data)));
  }, [member, reviewId]);

  async function onClick() {
    if (!member) return router.push(`${localizedPath(lang, "/auth/login")}?next=${encodeURIComponent(pathname)}`);
    if (member.id === ownerId || busy) return;
    setBusy(true);
    const result = await toggleHelpfulAction(reviewId);
    setBusy(false);
    if (!result.ok) return toast("error", errorText(dict, result.error) ?? dict.errors.unknown);
    const helpful = result.data?.helpful ?? false;
    setActive(helpful);
    setCount((c) => c + (helpful ? 1 : -1));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={member?.id === ownerId}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-caption font-semibold transition-colors disabled:opacity-50",
        active ? "border-brand-300 bg-brand-50 text-brand-800" : "border-ink-200 text-ink-600 hover:bg-ink-50"
      )}
    >
      <ThumbsUp className={cn("size-3.5", active && "fill-current")} />
      {fmt(dict.reviews.helpfulCount, { count })}
    </button>
  );
}
