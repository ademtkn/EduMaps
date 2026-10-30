import type { I18nValue } from "@/components/admin/fields";
import type { SchoolFormValues } from "@/components/admin/school-form";
import type { Database } from "@/lib/database.types";

/** Everything the school editor (and the importer) needs about one school, with its child records. */
export const SCHOOL_WITH_CHILDREN =
  "*, school_locations(*), school_languages(*), school_programs(*), school_facilities(*), school_fee_items(*), school_media(*), school_faqs(*), school_documents(*), school_plans(plan)";

type Row = Database["public"]["Tables"]["schools"]["Row"] & {
  school_locations: Database["public"]["Tables"]["school_locations"]["Row"] | Database["public"]["Tables"]["school_locations"]["Row"][] | null;
  school_languages: Database["public"]["Tables"]["school_languages"]["Row"][];
  school_programs: Database["public"]["Tables"]["school_programs"]["Row"][];
  school_facilities: Database["public"]["Tables"]["school_facilities"]["Row"][];
  school_fee_items: Database["public"]["Tables"]["school_fee_items"]["Row"][];
  school_media: Database["public"]["Tables"]["school_media"]["Row"][];
  school_faqs: Database["public"]["Tables"]["school_faqs"]["Row"][];
  school_documents: Database["public"]["Tables"]["school_documents"]["Row"][];
  school_plans: { plan: string } | { plan: string }[] | null;
};

const i = (v: unknown): I18nValue => (v && typeof v === "object" ? (v as I18nValue) : {});

export function toFormValues(s: Row): SchoolFormValues {
  const loc = Array.isArray(s.school_locations) ? s.school_locations[0] : s.school_locations;
  return {
    id: s.id,
    slug: s.slug,
    name: i(s.name), tagline: i(s.tagline), about: i(s.about),
    city_id: s.city_id,
    school_type: s.school_type,
    education_systems: s.education_systems,
    grade_from: s.grade_from, grade_to: s.grade_to,
    founded_year: s.founded_year ?? "", student_count: s.student_count ?? "", teacher_count: s.teacher_count ?? "", avg_class_size: s.avg_class_size ?? "",
    opening_time: s.opening_time?.slice(0, 5) ?? "", closing_time: s.closing_time?.slice(0, 5) ?? "", working_days: s.working_days, schedule_notes: i(s.schedule_notes), fee_min: s.fee_min ?? "", fee_max: s.fee_max ?? "", fee_period: s.fee_period as SchoolFormValues["fee_period"], fee_billing_months: s.fee_billing_months, tuition_notes: i(s.tuition_notes),
    has_scholarships: s.has_scholarships, scholarships: i(s.scholarships),
    has_transportation: s.has_transportation, transportation_info: i(s.transportation_info),
    has_boarding: s.has_boarding, boarding_info: i(s.boarding_info),
    phone: s.phone ?? "", email: s.email ?? "", website: s.website ?? "", whatsapp: s.whatsapp ?? "",
    social: (s.social ?? {}) as Record<string, string>,
    logo_url: s.logo_url ?? "", cover_url: s.cover_url ?? "",
    status: s.status, is_featured: s.is_featured, plan: (Array.isArray(s.school_plans) ? s.school_plans[0]?.plan : s.school_plans?.plan) === "pro" ? "pro" : "free", data_status: s.data_status as "demo" | "unverified" | "verified",
    location: loc ? { lat: loc.lat == null ? "" : Number(loc.lat), lng: loc.lng == null ? "" : Number(loc.lng), address: i(loc.address), district: loc.district ?? "", google_maps_url: loc.google_maps_url ?? "", twogis_url: loc.twogis_url ?? "" } : { lat: "", lng: "", address: {}, district: "", google_maps_url: "", twogis_url: "" },
    languages: s.school_languages.map((l) => ({ code: l.language_code, is_primary: l.is_primary })),
    programs: [...s.school_programs].sort((a, b) => a.sort_order - b.sort_order).map((p) => ({ kind: p.kind, name: i(p.name), description: i(p.description) })),
    facilities: s.school_facilities.map((f) => ({ facility_key: f.facility_key, note: i(f.note) })),
    fee_items: s.school_fee_items.map((f) => ({ item_key: f.item_key, included: f.included, extra_amount: f.extra_amount ?? "", extra_period: (f.extra_period ?? "") as "" | "one_time" | "year" | "month" })),
    media: [...s.school_media].sort((a, b) => a.sort_order - b.sort_order).map((m) => ({ kind: m.kind, url: m.url, storage_path: m.storage_path ?? "", caption: i(m.caption) })),
    documents: [...(s.school_documents ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((d) => ({ title: d.title, url: d.url })),
    faqs: [...s.school_faqs].sort((a, b) => a.sort_order - b.sort_order).map((f) => ({ question: i(f.question), answer: i(f.answer) })),
  };
}
