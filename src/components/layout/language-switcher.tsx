"use client";

import { Check, Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import { LANGS, LANG_COOKIE, LANG_META, stripLang, localizedPath, type Lang } from "@/lib/i18n/config";
import { useDict, useLang } from "@/components/i18n-provider";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";

export function LanguageSwitcher({ enabled = LANGS }: { enabled?: readonly Lang[] }) {
  const lang = useLang();
  const dict = useDict();
  const pathname = usePathname();
  const { path } = stripLang(pathname);

  function switchTo(next: Lang) {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.assign(`${localizedPath(next, path)}${window.location.search}${window.location.hash}`);
  }

  return (
    <Dropdown>
      <DropdownTrigger
        aria-label={dict.nav.language}
        className="inline-flex h-10 items-center gap-1.5 rounded-control px-2.5 text-small font-semibold text-ink-700 transition-colors hover:bg-ink-100"
      >
        <Globe className="size-4.5" />
        <span className="uppercase">{lang}</span>
      </DropdownTrigger>
      <DropdownContent className="min-w-44">
        {LANGS.filter((code) => enabled.includes(code)).map((code) => (
          <DropdownItem key={code} onSelect={() => switchTo(code)} lang={LANG_META[code].htmlLang}>
            <span className="flex-1">{LANG_META[code].native}</span>
            {code === lang ? <Check className="size-4 text-brand-700!" /> : null}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
