import { notFound } from "next/navigation";
import { z } from "zod";
import { AdForm, type AdFormValues } from "@/components/admin/ad-form";
import { toLocalInput } from "@/lib/admin-defaults";
import type { I18nValue } from "@/components/admin/fields";
import { AdminPage } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit campaign" };
export const dynamic = "force-dynamic";
const i = (v: unknown): I18nValue => (v && typeof v === "object" ? (v as I18nValue) : {});

export default async function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const { data: ad } = await supabase.from("advertisements").select("*").eq("id", id).maybeSingle();
  if (!ad) notFound();
  const initial: AdFormValues = {
    id: ad.id, advertiser_name: ad.advertiser_name, customer_type: ad.customer_type, placement: ad.placement,
    headline: i(ad.headline), body: i(ad.body), cta_label: i(ad.cta_label), image_url: ad.image_url ?? "", target_url: ad.target_url,
    target_languages: ad.target_languages as AdFormValues["target_languages"], starts_at: toLocalInput(ad.starts_at), ends_at: toLocalInput(ad.ends_at), is_active: ad.is_active,
  };
  return (
    <AdminPage title={(ad.headline as { en?: string }).en ?? "Campaign"} description={`${Number(ad.impressions).toLocaleString("en-GB")} impressions · ${Number(ad.clicks).toLocaleString("en-GB")} clicks`}>
      <AdForm initial={initial} />
    </AdminPage>
  );
}
