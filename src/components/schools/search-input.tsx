"use client";

import { Building2, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from "react";
import { useDict, useLang } from "@/components/i18n-provider";
import { localizedPath } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type Option = { key: string; kind: "school" | "city"; label: string; hint?: string; href: string };

/**
 * A search box that suggests schools and cities while the visitor types. It is still a normal text field of a normal form:
 * without JavaScript, or when nothing is chosen, Enter submits the search as before.
 */
export function SearchInput({ className, defaultValue = "", onChange, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue"> & { defaultValue?: string }) {
  const lang = useLang();
  const dict = useDict();
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setOptions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggest?lang=${lang}&q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as { schools: { slug: string; name: string; city: string }[]; cities: { slug: string; name: string }[] };
        setOptions([
          ...data.schools.map((s): Option => ({ key: `s-${s.slug}`, kind: "school", label: s.name, hint: s.city, href: localizedPath(lang, `/schools/${s.slug}`) })),
          ...data.cities.map((c): Option => ({ key: `c-${c.slug}`, kind: "city", label: c.name, href: `${localizedPath(lang, "/schools")}?city=${c.slug}` })),
        ]);
        setActive(-1);
      } catch {
        /* a cancelled or failed request just leaves the list as it was */
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, lang]);

  const listId = `${id}-list`;
  const shown = open && options.length > 0;

  return (
    <div className="relative min-w-0 flex-1">
      <input
        {...props}
        type="search"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={listId}
        aria-activedescendant={shown && active >= 0 ? `${id}-${active}` : undefined}
        value={value}
        className={className}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          onChange?.(event);
        }}
        onFocus={() => { window.clearTimeout(closeTimer.current); setOpen(true); }}
        onBlur={() => { closeTimer.current = window.setTimeout(() => setOpen(false), 120); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") return setOpen(false);
          if (!options.length) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((i) => (i + 1) % options.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
          } else if (event.key === "Enter" && shown && active >= 0) {
            event.preventDefault();
            setOpen(false);
            router.push(options[active]!.href);
          }
        }}
      />
      {shown ? (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-auto rounded-card border border-ink-200 bg-white p-1.5 text-left shadow-lift">
          {options.map((option, index) => (
            <li key={option.key} id={`${id}-${index}`} role="option" aria-selected={index === active}>
              <Link
                href={option.href}
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setOpen(false)}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-small text-ink-800", index === active ? "bg-brand-50" : "hover:bg-ink-100")}
              >
                {option.kind === "school" ? <Building2 className="size-4 shrink-0 text-ink-500" aria-hidden /> : <MapPin className="size-4 shrink-0 text-ink-500" aria-hidden />}
                <span className="min-w-0 flex-1 truncate font-medium">{option.label}</span>
                <span className="shrink-0 text-caption text-ink-500">{option.kind === "city" ? dict.home.suggestCities : option.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
