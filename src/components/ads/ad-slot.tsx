import type { Lang } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { getAds } from "@/lib/data/ads";
import type { AdData } from "@/lib/data/types";
import { AdCard } from "./ad-card";

export { AdCard };

/** Server component: picks a live campaign for the placement. Renders nothing when none is running. */
export async function AdSlot({ placement, lang, dict, className }: { placement: AdData["placement"]; lang: Lang; dict: Dictionary; className?: string }) {
  const [ad] = await getAds(placement, lang, 1);
  if (!ad) return null;
  return <AdCard ad={ad} lang={lang} dict={dict} className={className} />;
}
