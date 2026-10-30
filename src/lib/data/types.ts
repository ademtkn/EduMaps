import type { FeeItemRow, FeePeriod } from "@/lib/fees";
import type { I18nText } from "@/lib/i18n/localized";

export type CityRef = { slug: string; name: I18nText; provinces?: { slug: string; name: I18nText } | null };

export type SchoolCardData = {
  id: string;
  slug: string;
  name: I18nText;
  tagline: I18nText;
  logo_url: string | null;
  cover_url: string | null;
  rating_avg: number;
  rating_count: number;
  school_type: "public" | "private" | "international" | "specialized";
  education_systems: string[];
  has_transportation: boolean;
  has_boarding: boolean;
  has_sports: boolean;
  tuition_min: number | null;
  tuition_max: number | null;
  fee_min: number | null;
  fee_max: number | null;
  fee_period: FeePeriod;
  fee_billing_months: number;
  opening_time: string | null;
  closing_time: string | null;
  working_days: number[];
  grade_from: number;
  grade_to: number;
  updated_at: string;
  data_status: "demo" | "unverified" | "verified";
  cities: CityRef;
  school_languages: { language_code: string; is_primary: boolean }[];
};

export type SchoolDetail = SchoolCardData & {
  about: I18nText;
  tuition_notes: I18nText;
  schedule_notes: I18nText;
  has_scholarships: boolean;
  scholarships: I18nText;
  transportation_info: I18nText;
  boarding_info: I18nText;
  founded_year: number | null;
  student_count: number | null;
  teacher_count: number | null;
  avg_class_size: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  social: Record<string, string>;
  view_count: number;
  data_status: "demo" | "unverified" | "verified";
  school_locations: { lat: number | null; lng: number | null; address: I18nText; district: string | null; google_maps_url: string | null; twogis_url: string | null } | null;
  school_programs: { id: string; kind: "academic" | "club" | "sport"; name: I18nText; description: I18nText; sort_order: number }[];
  school_facilities: { id: string; facility_key: string; note: I18nText }[];
  school_fee_items: FeeItemRow[];
  school_documents: { id: string; title: string; url: string; sort_order: number }[];
  school_media: { id: string; kind: "image" | "video"; url: string; caption: I18nText; sort_order: number }[];
  school_faqs: { id: string; question: I18nText; answer: I18nText; sort_order: number }[];
};

export type ReviewData = {
  id: string;
  school_id: string;
  user_id: string;
  relationship: "parent" | "student" | "alumni" | "teacher";
  rating: number;
  rating_teaching: number | null;
  rating_facilities: number | null;
  rating_safety: number | null;
  rating_communication: number | null;
  title: string;
  body: string;
  status: "pending" | "published" | "rejected" | "hidden";
  is_flagged: boolean;
  moderation_note: string | null;
  helpful_count: number;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
  schools?: { slug: string; name: I18nText } | null;
};

export type MapSchool = {
  id: string;
  slug: string;
  name: I18nText;
  logo_url: string | null;
  rating_avg: number;
  rating_count: number;
  tuition_min: number | null;
  tuition_max: number | null;
  school_type: string;
  education_systems: string[];
  grade_from: number;
  grade_to: number;
  has_transportation: boolean;
  has_boarding: boolean;
  has_sports: boolean;
  city_slug: string;
  languages: string[];
  lat: number;
  lng: number;
  address: I18nText;
};

export type ArticleCardData = {
  id: string;
  slug: string;
  kind: "article" | "video" | "guide";
  title: I18nText;
  excerpt: I18nText;
  cover_url: string | null;
  reading_minutes: number;
  published_at: string | null;
  is_featured: boolean;
  article_categories: { slug: string; name: I18nText };
  profiles: { display_name: string } | null;
};

export type ArticleDetail = ArticleCardData & {
  body: I18nText;
  video_url: string | null;
  tags: string[];
  updated_at: string;
  view_count: number;
};

export type PostData = {
  id: string;
  title: string;
  body: string;
  status: "pending" | "published" | "rejected" | "hidden";
  is_pinned: boolean;
  comment_count: number;
  view_count: number;
  created_at: string;
  moderation_note: string | null;
  community_categories: { slug: string; name: I18nText };
  profiles: { display_name: string; avatar_url: string | null } | null;
};

export type CommentData = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
};

export type AdData = {
  id: string;
  advertiser_name: string;
  placement: "banner" | "sidebar" | "featured_article" | "home_grid";
  headline: I18nText;
  body: I18nText;
  cta_label: I18nText;
  image_url: string | null;
  target_url: string;
  target_languages: string[];
};

export type CategoryData = { id: string; slug: string; name: I18nText; description: I18nText };
