import { Check, CircleDollarSign, HelpCircle } from "lucide-react";
import { feeLabels, formatExtra, type FeeItemRow } from "@/lib/fees";
import type { Lang } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { FacilityIcon } from "./facility-icons";

/** What the tuition covers: included items, items paid separately (with their price) and items the school has not stated. */
export function FeeCoverage({ dict, lang, items }: { dict: Dictionary; lang: Lang; items: FeeItemRow[] }) {
  const names = dict.school.feeItemNames;
  const byKey = new Map(items.map((i) => [i.item_key, i]));
  const keys = dict.catalog.feeItems;
  const included = keys.filter((k) => byKey.get(k)?.included === true);
  const separate = keys.filter((k) => byKey.get(k)?.included === false);
  const unknown = keys.filter((k) => !byKey.has(k));
  if (keys.length === 0 || (included.length === 0 && separate.length === 0)) return null;

  const icon = (key: string) => <FacilityIcon name={dict.catalog.feeItemIcons[key] ?? "check"} className="size-4 shrink-0 text-ink-500" />;

  return (
    <div className="mt-5 border-t border-ink-200 pt-4">
      <h3 className="text-h3 font-semibold">{dict.school.feeCoverTitle}</h3>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        {included.length > 0 ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-small font-semibold text-leaf-700"><Check className="size-4" />{dict.school.feeIncluded}</p>
            <ul className="space-y-1.5 text-small text-ink-800">
              {included.map((k) => <li key={k} className="flex items-center gap-2">{icon(k)}{names[k] ?? k}</li>)}
            </ul>
          </div>
        ) : null}
        {separate.length > 0 ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-small font-semibold text-warning-700"><CircleDollarSign className="size-4" />{dict.school.feePaidSeparately}</p>
            <ul className="space-y-1.5 text-small text-ink-800">
              {separate.map((k) => {
                const extra = formatExtra(byKey.get(k)!, lang, feeLabels(dict));
                return (
                  <li key={k} className="flex flex-wrap items-center gap-x-2">
                    <span className="flex items-center gap-2">{icon(k)}{names[k] ?? k}</span>
                    {extra ? <span className="text-ink-600">· {extra}</span> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
      {unknown.length > 0 ? (
        <p className="mt-4 flex items-start gap-1.5 text-caption text-ink-500">
          <HelpCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>{dict.school.feeAskSchool}: {unknown.map((k) => names[k] ?? k).join(", ")}</span>
        </p>
      ) : null}
    </div>
  );
}
