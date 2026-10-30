import type { AdFormValues } from "@/components/admin/ad-form";
import type { ArticleFormValues } from "@/components/admin/article-form";
import type { SchoolFormValues } from "@/components/admin/school-form";

// Defaults live outside the "use client" form modules so server pages can call them.

export const EMPTY_SCHOOL: SchoolFormValues = {
  slug: "", name: {}, tagline: {}, about: {}, city_id: "", school_type: "private", education_systems: ["national"], grade_from: 1, grade_to: 11,
  founded_year: "", student_count: "", teacher_count: "", avg_class_size: "", opening_time: "", closing_time: "", working_days: [], schedule_notes: {}, fee_min: "", fee_max: "", fee_period: "month", fee_billing_months: 9, tuition_notes: {},
  has_scholarships: false, scholarships: {}, has_transportation: false, transportation_info: {}, has_boarding: false, boarding_info: {},
  phone: "", email: "", website: "", whatsapp: "", social: {}, logo_url: "", cover_url: "", status: "draft", is_featured: false, plan: "free", data_status: "unverified",
  location: { lat: "", lng: "", address: {}, district: "", google_maps_url: "", twogis_url: "" }, languages: [{ code: "kg", is_primary: true }], programs: [], facilities: [], fee_items: [], media: [], documents: [], faqs: [],
};

export const EMPTY_ARTICLE = (kind: ArticleFormValues["kind"] = "article"): ArticleFormValues => ({
  slug: "", category_id: "", kind, title: {}, excerpt: {}, body: {}, cover_url: "", video_url: "", tags: "", reading_minutes: 5, status: "draft", is_featured: false,
});

/** datetime-local value in the browser's local zone */
export const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const EMPTY_AD = (): AdFormValues => ({
  advertiser_name: "", customer_type: "language_school", placement: "banner", headline: {}, body: {}, cta_label: {}, image_url: "", target_url: "",
  target_languages: [], starts_at: toLocalInput(new Date().toISOString()), ends_at: "", is_active: true,
});

