import Link from "next/link";
import { localizedPath, type Lang } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { fmt } from "@/lib/i18n/fmt";
import { tr } from "@/lib/i18n/localized";
import type { CityData } from "@/lib/data/geo";
import { COMPANY } from "@/lib/company";
import { Logo } from "./logo";

export function SiteFooter({ lang, dict, cities }: { lang: Lang; dict: Dictionary; cities: CityData[] }) {
  const col = "space-y-2.5 text-small";
  const link = "text-ink-600 transition-colors hover:text-brand-700";
  return (
    <footer className="mt-20 border-t border-ink-200 bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link href={localizedPath(lang)} aria-label="EduMaps.kg">
            <Logo className="h-12 sm:h-12" />
          </Link>
          <p className="mt-4 max-w-xs text-small text-ink-600">{dict.footer.description}</p>
          <ul className="mt-4 space-y-1.5 text-small">
            <li><a className={link} href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
            <li><a className={link} href={COMPANY.phoneHref}>{COMPANY.phone}</a></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-small font-semibold text-ink-900">{dict.footer.explore}</h2>
          <ul className={col}>
            <li><Link className={link} href={localizedPath(lang, "/schools")}>{dict.nav.schools}</Link></li>
            <li><Link className={link} href={localizedPath(lang, "/map")}>{dict.nav.map}</Link></li>
            <li><Link className={link} href={localizedPath(lang, "/compare")}>{dict.nav.compare}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-small font-semibold text-ink-900">{dict.footer.platform}</h2>
          <ul className={col}>
            <li><Link className={link} href={localizedPath(lang, "/education")}>{dict.nav.education}</Link></li>
            <li><Link className={link} href={localizedPath(lang, "/community")}>{dict.nav.community}</Link></li>
            <li><Link className={link} href={localizedPath(lang, "/for-schools")}>{dict.footer.forSchools}</Link></li>
            <li><Link className={link} href={localizedPath(lang, "/advertise")}>{dict.footer.advertise}</Link></li>
            <li><Link className={link} href={localizedPath(lang, "/about")}>{dict.nav.about}</Link></li>
            <li><Link className={link} href={localizedPath(lang, "/contact")}>{dict.footer.contact}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-small font-semibold text-ink-900">{dict.footer.cities}</h2>
          <ul className={col}>
            {cities.slice(0, 5).map((city) => (
              <li key={city.slug}>
                <Link className={link} href={localizedPath(lang, `/cities/${city.slug}`)}>{tr(city.name, lang)}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-200">
        <div className="container-page flex flex-col gap-2 py-6 text-caption text-ink-500 md:flex-row md:items-center md:justify-between">
          <p className="font-semibold text-ink-700">{dict.footer.operatedBy}</p>
          <p>{dict.footer.independence}</p>
          <p>{fmt(dict.footer.rights, { year: new Date().getFullYear() })}</p>
        </div>
        <div className="container-page flex flex-col gap-3 border-t border-ink-100 py-5 text-caption text-ink-500 md:flex-row md:items-center md:justify-between">
          <p>{COMPANY.legalName[lang]} · {COMPANY.location[lang]}</p>
          <nav aria-label={dict.footer.legalLabel}>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
              <li><Link className={link} href={localizedPath(lang, "/privacy")}>{dict.footer.privacy}</Link></li>
              <li><Link className={link} href={localizedPath(lang, "/terms")}>{dict.footer.terms}</Link></li>
              <li><Link className={link} href={localizedPath(lang, "/guidelines")}>{dict.footer.guidelines}</Link></li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
