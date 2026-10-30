"use client";

import { Bookmark } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { localizedPath } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useDict, useLang } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";

type Props = {
  kind: "school" | "article";
  id: string;
  /** "icon" is a round overlay button, "button" is a labelled action. */
  variant?: "icon" | "button";
  className?: string;
};

export function FavoriteButton({ kind, id, variant = "icon", className }: Props) {
  const { member, ready, isSaved, toggleSaved } = useAuth();
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const saved = isSaved(kind, id);
  const label =
    kind === "school"
      ? saved ? dict.schools.unsaveSchool : dict.schools.saveSchool
      : saved ? dict.education.unsaveArticle : dict.education.saveArticle;

  async function onClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!ready) return;
    if (!member) {
      router.push(`${localizedPath(lang, "/auth/login")}?next=${encodeURIComponent(pathname)}`);
      return;
    }
    await toggleSaved(kind, id);
  }

  if (variant === "button") {
    return (
      <Button variant={saved ? "soft" : "outline"} onClick={onClick} aria-pressed={saved} className={className}>
        <Bookmark className={cn(saved && "fill-current")} />
        {saved ? dict.common.saved : dict.common.save}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={cn(
        "relative z-10 inline-flex size-9 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur transition hover:scale-105",
        saved ? "text-brand-700" : "text-ink-600 hover:text-brand-700",
        className
      )}
    >
      <Bookmark className={cn("size-4.5", saved && "fill-current")} />
    </button>
  );
}
