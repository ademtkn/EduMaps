import "server-only";
import type { Lang } from "@/lib/i18n/config";
import { createPublicClient } from "@/lib/supabase/public";
import type { AdData } from "./types";

/**
 * Fetches live campaigns for a placement. Row level security already hides inactive and expired ads.
 * Advertising is deliberately independent from school data: nothing here is read by any ranking query.
 */
export async function getAds(placement: AdData["placement"], lang: Lang, limit = 1): Promise<AdData[]> {
  const { data } = await createPublicClient()
    .from("advertisements")
    .select("id,advertiser_name,placement,headline,body,cta_label,image_url,target_url,target_languages")
    .eq("placement", placement);
  const eligible = ((data ?? []) as unknown as AdData[]).filter(
    (ad) => ad.target_languages.length === 0 || ad.target_languages.includes(lang)
  );
  // Fair rotation: shuffle so every live campaign gets equal exposure.
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j]!, eligible[i]!];
  }
  return eligible.slice(0, limit);
}
