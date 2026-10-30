import { ExternalLink } from "lucide-react";
import type { Lang } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/fmt";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { tr } from "@/lib/i18n/localized";
import type { AdData } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image";
import { AdTracker } from "./ad-tracker";

function AdLabel({ ad, dict }: { ad: AdData; dict: Dictionary }) {
  return (
    <div className="flex items-center gap-2 text-caption">
      <span className="rounded bg-ink-800 px-1.5 py-0.5 font-bold uppercase tracking-wide text-white">{dict.ads.label}</span>
      <span className="truncate text-ink-500">{fmt(dict.ads.by, { name: ad.advertiser_name })}</span>
    </div>
  );
}

export function AdCard({ ad, lang, dict, className }: { ad: AdData; lang: Lang; dict: Dictionary; className?: string }) {
  const href = `/api/ads/${ad.id}/click?lang=${lang}`;
  const headline = tr(ad.headline, lang);
  const body = tr(ad.body, lang);
  const cta = tr(ad.cta_label, lang) || dict.common.learnMore;
  const linkProps = { href, target: "_blank", rel: "sponsored nofollow noopener noreferrer" } as const;

  if (ad.placement === "banner") {
    return (
      <AdTracker adId={ad.id} className={cn("overflow-hidden rounded-card border border-ink-200 bg-white shadow-card", className)}>
        <aside aria-label={dict.ads.label} className="flex flex-col sm:flex-row">
          {ad.image_url ? (
            <a {...linkProps} className="relative block aspect-[16/7] shrink-0 sm:aspect-auto sm:w-72">
              <MediaImage src={ad.image_url} alt="" fill sizes="(min-width: 640px) 288px, 100vw" className="object-cover" />
            </a>
          ) : null}
          <div className="flex flex-1 flex-col justify-center gap-3 p-5 sm:p-6">
            <AdLabel ad={ad} dict={dict} />
            <a {...linkProps} className="text-h3 font-semibold text-ink-900 hover:text-brand-700">{headline}</a>
            {body ? <p className="line-clamp-2 text-small text-ink-600">{body}</p> : null}
            <div>
              <Button asChild size="sm" variant="outline"><a {...linkProps}>{cta}<ExternalLink /></a></Button>
            </div>
          </div>
        </aside>
      </AdTracker>
    );
  }

  return (
    <AdTracker adId={ad.id} className={cn("overflow-hidden rounded-card border border-ink-200 bg-white shadow-card", className)}>
      <aside aria-label={dict.ads.label}>
        {ad.image_url ? (
          <a {...linkProps} className="relative block aspect-[16/9]">
            <MediaImage src={ad.image_url} alt="" fill sizes="(min-width: 1024px) 320px, 100vw" className="object-cover" />
          </a>
        ) : null}
        <div className="space-y-2.5 p-5">
          <AdLabel ad={ad} dict={dict} />
          <a {...linkProps} className="block text-h3 font-semibold leading-snug text-ink-900 hover:text-brand-700">{headline}</a>
          {body ? <p className={cn("text-small text-ink-600", ad.placement === "featured_article" ? "line-clamp-3" : "line-clamp-2")}>{body}</p> : null}
          <a {...linkProps} className="inline-flex items-center gap-1 text-small font-semibold text-brand-700 hover:text-brand-900">
            {cta} <ExternalLink className="size-3.5" />
          </a>
        </div>
      </aside>
    </AdTracker>
  );
}
