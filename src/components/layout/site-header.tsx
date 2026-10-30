"use client";

import { Menu, Scale } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { localizedPath, stripLang, type Lang } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { useCompare } from "@/components/compare/compare-provider";
import { useDict, useLang } from "@/components/i18n-provider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";

export function SiteHeader({ enabledLangs }: { enabledLangs: Lang[] }) {
  const dict = useDict();
  const lang = useLang();
  const pathname = usePathname();
  const { path } = stripLang(pathname);
  const { slugs } = useCompare();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/schools", label: dict.nav.schools },
    { href: "/map", label: dict.nav.map },
    { href: "/compare", label: dict.nav.compare },
    { href: "/education", label: dict.nav.education },
    { href: "/community", label: dict.nav.community },
    { href: "/about", label: dict.nav.about },
  ];
  const active = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href={localizedPath(lang)} aria-label="EduMaps.kg" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label={dict.nav.primary} className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={localizedPath(lang, link.href)}
              aria-current={active(link.href) ? "page" : undefined}
              className={cn(
                "relative rounded-control px-3 py-2 text-small font-semibold transition-colors",
                active(link.href) ? "bg-brand-50 text-brand-800" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              )}
            >
              {link.label}
              {link.href === "/compare" && slugs.length > 0 ? (
                <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-leaf-600 text-[0.7rem] font-bold text-white">
                  {slugs.length}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <Link
            href={localizedPath(lang, "/compare")}
            aria-label={dict.nav.compare}
            className="relative hidden size-10 items-center justify-center rounded-control text-ink-600 hover:bg-ink-100 sm:inline-flex lg:hidden"
          >
            <Scale className="size-5" />
            {slugs.length > 0 ? (
              <span className="absolute right-0.5 top-0.5 inline-flex size-4 items-center justify-center rounded-full bg-leaf-600 text-[0.65rem] font-bold text-white">
                {slugs.length}
              </span>
            ) : null}
          </Link>
          <LanguageSwitcher enabled={enabledLangs} />
          <UserMenu />
          <Dialog open={open} onOpenChange={setOpen}>
            <button
              type="button"
              aria-label={dict.nav.openMenu}
              onClick={() => setOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-control text-ink-700 hover:bg-ink-100 lg:hidden"
            >
              <Menu className="size-6" />
            </button>
            <DialogContent title="EduMaps.kg" closeLabel={dict.nav.closeMenu}>
              <nav aria-label={dict.nav.primary} className="-mx-2 flex flex-col">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={localizedPath(lang, link.href)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-control px-3 py-3.5 text-body font-semibold",
                      active(link.href) ? "bg-brand-50 text-brand-800" : "text-ink-800 hover:bg-ink-100"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
