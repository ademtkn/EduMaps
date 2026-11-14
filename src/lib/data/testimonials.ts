import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { I18nText } from "@/lib/i18n/localized";

export type TestimonialData = {
  id: string;
  kind: "member" | "invited";
  author_name: string;
  author_title: string | null;
  quote: I18nText;
  is_demo: boolean;
};

/** Published opinions about EduMaps.kg (members whose text was approved, and guests added by the team). */
export async function getPublicTestimonials(limit = 30): Promise<TestimonialData[]> {
  const { data } = await createPublicClient().from("public_testimonials").select("id,kind,author_name,author_title,quote,is_demo").limit(limit);
  // Sample opinions stay out of the public site: the home page shows the section only once a real
  // member or a guest with recorded permission has been approved.
  const rows = ((data ?? []) as unknown as TestimonialData[]).filter((row) => !row.is_demo);
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j]!, rows[i]!];
  }
  return rows;
}
