"use client";

import { SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { BISHKEK_DISTRICTS } from "@/lib/constants";
import { tr } from "@/lib/i18n/localized";
import type { CityData } from "@/lib/data/geo";
import { useDict, useLang } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { control, Input, Label, Select } from "@/components/ui/form";
import { SearchInput } from "./search-input";

const TYPES = ["public", "private", "international", "specialized"] as const;

function FilterForm({ cities, hideCity, showDistricts, onDone, formId }: { cities: CityData[]; hideCity?: boolean; showDistricts?: boolean; onDone?: () => void; formId?: string }) {
  const dict = useDict();
  // The desktop and mobile forms are both in the DOM, so every field id needs its own prefix.
  const uid = useId();
  const lang = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  // The inputs are uncontrolled. Re-mount them only when the URL changed from outside (back button, a link),
  // never for our own navigation, so a value typed while a previous change is still loading is not wiped.
  const [version, setVersion] = useState(0);
  const lastPushed = useRef<string | null>(null);
  const seen = useRef(params.toString());
  const current = params.toString();
  useEffect(() => {
    if (seen.current === current) return;
    seen.current = current;
    if (lastPushed.current !== current) setVersion((v) => v + 1);
  }, [current]);

  const selected = (key: string) => params.getAll(key);
  const checkbox = "size-4.5 rounded border-ink-300 text-brand-700 focus:ring-brand-500";

  function submit(event?: React.FormEvent) {
    event?.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const next = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (typeof value === "string" && value.trim() !== "") next.append(key, value.trim());
    }
    const sort = params.get("sort");
    if (sort) next.set("sort", sort);
    const query = next.toString();
    lastPushed.current = query;
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // Only an explicit submit (Apply / Show results) closes the sheet, so several filters can be set in a row.
    if (event) onDone?.();
  }

  function reset() {
    const sort = params.get("sort");
    lastPushed.current = null;
    router.push(sort ? `${pathname}?sort=${sort}` : pathname, { scroll: false });
    onDone?.();
  }

  return (
    <form key={version} id={formId} ref={formRef} onSubmit={submit} onChange={(e) => {
        const target = e.target as unknown as HTMLInputElement;
        // Number fields apply on Enter / the Apply button so typing a price is not interrupted.
        if (target.tagName === "INPUT" && target.type === "number") return;
        submit();
      }} className="space-y-6">
      <div>
        <Label htmlFor={`${uid}-q`}>{dict.schools.searchPlaceholder}</Label>
        <SearchInput id={`${uid}-q`} name="q" maxLength={80} defaultValue={params.get("q") ?? ""} onChange={(e) => e.stopPropagation()} className={`${control} h-11`} />
      </div>

      {!hideCity ? (
        <div>
          <Label htmlFor={`${uid}-city`}>{dict.schools.city}</Label>
          <Select id={`${uid}-city`} name="city" defaultValue={params.get("city") ?? ""}>
            <option value="">{dict.schools.allCities}</option>
            {cities.map((c) => <option key={c.slug} value={c.slug}>{tr(c.name, lang)}</option>)}
          </Select>
        </div>
      ) : null}

      {showDistricts ? (
        <div>
          <Label htmlFor={`${uid}-district`}>{dict.schools.district}</Label>
          <Select id={`${uid}-district`} name="district" defaultValue={params.get("district") ?? ""}>
            <option value="">{dict.schools.allDistricts}</option>
            {BISHKEK_DISTRICTS.map((d) => <option key={d} value={d}>{dict.schools.districts[d]}</option>)}
          </Select>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>{dict.schools.tuition}</Label></div>
        <Input aria-label={dict.schools.tuitionFrom} name="tmin" type="number" min={0} step={500} placeholder={dict.schools.tuitionFrom} defaultValue={params.get("tmin") ?? ""} className="-mt-5" />
        <Input aria-label={dict.schools.tuitionTo} name="tmax" type="number" min={0} step={500} placeholder={dict.schools.tuitionTo} defaultValue={params.get("tmax") ?? ""} className="-mt-5" />
        <div className="col-span-2 -mt-3 flex items-start justify-between gap-3">
          <p className="text-caption text-ink-500">{dict.schools.tuitionHint}</p>
          <Button type="submit" variant="soft" size="sm" className="shrink-0">{dict.common.apply}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${uid}-grade`}>{dict.schools.grade}</Label>
          <Select id={`${uid}-grade`} name="grade" defaultValue={params.get("grade") ?? ""}>
            <option value="">{dict.schools.anyGrade}</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{i === 0 ? dict.common.preschoolGrade : i}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`${uid}-type`}>{dict.schools.type}</Label>
          <Select id={`${uid}-type`} name="type" defaultValue={params.get("type") ?? ""}>
            <option value="">{dict.schools.anyType}</option>
            {TYPES.map((t) => <option key={t} value={t}>{dict.schools.types[t]}</option>)}
          </Select>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-small font-medium text-ink-800">{dict.schools.language}</legend>
        <div className="grid grid-cols-2 gap-2">
          {dict.catalog.languages.map((code) => (
            <label key={code} className="flex items-center gap-2 text-small text-ink-700">
              <input type="checkbox" name="lang" value={code} defaultChecked={selected("lang").includes(code)} className={checkbox} />
              {dict.schools.languageNames[code]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-small font-medium text-ink-800">{dict.schools.system}</legend>
        <div className="space-y-2">
          {dict.catalog.systems.map((key) => (
            <label key={key} className="flex items-center gap-2 text-small text-ink-700">
              <input type="checkbox" name="system" value={key} defaultChecked={selected("system").includes(key)} className={checkbox} />
              {dict.schools.systems[key]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-small font-medium text-ink-800">{dict.schools.amenities}</legend>
        <div className="space-y-2">
          {([["transport", dict.schools.transport], ["sports", dict.schools.sports], ["boarding", dict.schools.boarding]] as const).map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-small text-ink-700">
              <input type="checkbox" name={name} value="1" defaultChecked={params.get(name) === "1"} className={checkbox} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="button" variant="ghost" className="w-full" onClick={reset}>{dict.schools.clearFilters}</Button>
    </form>
  );
}

export function SchoolFilters({ cities, hideCity, showDistricts, activeCount }: { cities: CityData[]; hideCity?: boolean; showDistricts?: boolean; activeCount: number }) {
  const dict = useDict();
  const [open, setOpen] = useState(false);
  const mobileFormId = useId();

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-card border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="mb-5 text-h3 font-semibold">{dict.schools.filters}</h2>
          <FilterForm cities={cities} hideCity={hideCity} showDistricts={showDistricts} />
        </div>
      </aside>

      <div className="lg:hidden">
        <Button variant="outline" onClick={() => setOpen(true)} className="w-full">
          <SlidersHorizontal /> {dict.schools.filters}
          {activeCount > 0 ? (
            <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-brand-700 text-caption font-bold text-white">{activeCount}</span>
          ) : null}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent title={dict.schools.filters} closeLabel={dict.common.close}>
            <FilterForm formId={mobileFormId} cities={cities} hideCity={hideCity} showDistricts={showDistricts} onDone={() => setOpen(false)} />
            <Button type="submit" form={mobileFormId} className="mt-6 w-full">{dict.schools.applyFilters}</Button>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
