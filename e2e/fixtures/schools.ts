/**
 * Sample schools for the browser tests.
 *
 * The fictional demo schools were archived on the site, so the tests create their own copies of eight of them
 * before the run and delete them afterwards (see global-setup.ts / global-teardown.ts). The copies reuse the seed
 * definitions so fees, school days, districts and coordinates stay the values the tests check. They are marked
 * `demo`, published, and carry the "E2E" prefix in every name and slug.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "node:path";
import type { Database } from "../../src/lib/database.types";
import { feeFor, hoursFor } from "../../scripts/seed/fees";
import { PROGRAMS } from "../../scripts/seed/i18n";
import { SCHOOLS, type SeedSchool } from "../../scripts/seed/schools";

config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

const PREFIX = "e2e-";

/** Seed slug → fixture slug. Only these eight schools are copied. */
export const E2E_SCHOOL = {
  alaToo: `${PREFIX}ala-too-international-school`,
  silkRoad: `${PREFIX}silk-road-lyceum`,
  tengri: `${PREFIX}tengri-stem-gymnasium`,
  bilim: `${PREFIX}bilim-secondary-school`,
  capital: `${PREFIX}capital-turkish-kyrgyz-lyceum`,
  neva: `${PREFIX}neva-russian-school`,
  chuValley: `${PREFIX}chu-valley-lyceum`,
  talasValley: `${PREFIX}talas-valley-gymnasium`,
} as const;

const SEED_SLUGS = Object.values(E2E_SCHOOL).map((slug) => slug.slice(PREFIX.length));

export function fixtureName(seedSlug: string, lang: "kg" | "ru" | "en" = "en") {
  const school = SCHOOLS.find((s) => s.slug === seedSlug.replace(PREFIX, ""));
  if (!school) throw new Error(`No seed definition for ${seedSlug}`);
  return `E2E ${school.name[lang]}`;
}

/** English display names, e.g. "E2E Ala-Too International School". */
export const E2E_NAME = Object.fromEntries(Object.entries(E2E_SCHOOL).map(([k, slug]) => [k, fixtureName(slug)])) as Record<keyof typeof E2E_SCHOOL, string>;

/** Published reviews on the Ala-Too copy so its page carries an aggregate rating. */
const REVIEWS: { school: string; email: string; rating: number; title: string; body: string }[] = [
  { school: E2E_SCHOOL.alaToo, email: "mirlan@example.com", rating: 5, title: "E2E sample review: strong senior years", body: "Automated test fixture. Our son joined in grade nine and settled in quickly; the teachers are attentive and English preparation is strong." },
  { school: E2E_SCHOOL.alaToo, email: "tilek@example.com", rating: 4, title: "E2E sample review: good but busy", body: "Automated test fixture. Teaching is strong and the atmosphere is friendly; the school day is long and the commute adds to it." },
];

function client(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed in .env.local to create the test schools");
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url)) throw new Error(`Refusing to create test schools on a non-local database (${url})`);
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function must<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data as T;
}
function mustOk(result: { error: { message: string } | null }, what: string) {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
}

const prefixed = (name: SeedSchool["name"]) => ({ kg: `E2E ${name.kg}`, ru: `E2E ${name.ru}`, en: `E2E ${name.en}` });

export async function removeFixtureSchools(db = client()) {
  mustOk(await db.from("schools").delete().like("slug", `${PREFIX}%`), "delete test schools");
}

export async function createFixtureSchools() {
  const db = client();
  await removeFixtureSchools(db);

  const cities = new Map(must(await db.from("cities").select("id,slug,lat,lng"), "cities").map((c) => [c.slug, c]));
  const languageCodes = new Set(must(await db.from("language_options").select("code"), "language options").map((l) => l.code));
  const listed = await db.auth.admin.listUsers({ perPage: 1000 });
  if (listed.error) throw new Error(`users: ${listed.error.message}`);
  const userByEmail = new Map(listed.data.users.map((u) => [u.email ?? "", u.id]));
  const schoolIds = new Map<string, string>();

  for (const seedSlug of SEED_SLUGS) {
    const school = SCHOOLS.find((s) => s.slug === seedSlug);
    if (!school) throw new Error(`Seed definition ${seedSlug} is missing`);
    const city = cities.get(school.city);
    if (!city) throw new Error(`City ${school.city} is missing`);
    const slug = `${PREFIX}${seedSlug}`;
    const fee = feeFor(seedSlug, school.tuition);
    const index = SCHOOLS.indexOf(school);
    const inserted = await db
        .from("schools")
        .insert({
          slug,
          name: prefixed(school.name),
          tagline: school.tagline,
          about: { kg: `${school.extra.kg} (Сыноо маалыматы.)`, ru: `${school.extra.ru} (Тестовые данные.)`, en: `${school.extra.en} (Test data created by the automated browser tests.)` },
          city_id: city.id,
          school_type: school.type,
          education_systems: school.systems,
          grade_from: school.grades[0],
          grade_to: school.grades[1],
          founded_year: school.founded,
          student_count: school.students,
          teacher_count: school.teachers,
          avg_class_size: school.classSize,
          ...hoursFor(school.type, seedSlug),
          // the same fictional 312 000 numbers as the seed, so the WhatsApp assertions keep their values
          whatsapp: index % 3 === 2 ? null : `+996312000${String(100 + index)}`,
          fee_min: fee.fee_min,
          fee_max: fee.fee_max,
          fee_period: fee.fee_period,
          fee_billing_months: fee.fee_billing_months,
          tuition_notes: school.tuitionNote ?? null,
          has_scholarships: Boolean(school.scholarships),
          scholarships: school.scholarships ?? null,
          has_transportation: school.transport,
          transportation_info: school.transportInfo ?? null,
          has_boarding: school.boarding,
          phone: `+996 312 000 ${String(100 + index).padStart(3, "0")}`,
          email: `info@${slug}.example`,
          website: `https://${slug}.example`,
          status: "published",
          data_status: "demo",
          is_featured: Boolean(school.featured),
        })
        .select("id")
        .single();
    if (inserted.error || !inserted.data) throw new Error(`school ${slug}: ${inserted.error?.message ?? "no row returned"}`);
    const created = inserted.data;
    schoolIds.set(slug, created.id);

    mustOk(
      await db.from("school_locations").insert({
        school_id: created.id,
        lat: Number((Number(city.lat) + school.offset[0]).toFixed(6)),
        lng: Number((Number(city.lng) + school.offset[1]).toFixed(6)),
        address: school.street,
        district: school.district ?? null,
      }),
      `location ${slug}`
    );
    mustOk(await db.from("school_plans").insert({ school_id: created.id, plan: "pro" }), `plan ${slug}`);
    const languages = school.languages.filter((l) => languageCodes.has(l.code));
    if (languages.length) {
      mustOk(await db.from("school_languages").insert(languages.map((l) => ({ school_id: created.id, language_code: l.code, is_primary: Boolean(l.primary) }))), `languages ${slug}`);
    }
    const programs = [...school.programs, ...school.clubs, ...school.sports].map((key, sort_order) => {
      const p = PROGRAMS[key];
      if (!p) throw new Error(`Unknown program ${key} on ${slug}`);
      return { school_id: created.id, kind: p.kind, name: p.name, description: p.description ?? null, sort_order };
    });
    mustOk(await db.from("school_programs").insert(programs), `programs ${slug}`);
    mustOk(await db.from("school_facilities").insert(school.facilities.map((facility_key) => ({ school_id: created.id, facility_key }))), `facilities ${slug}`);
    const feeRows = Object.entries(fee.items).map(([item_key, value]) =>
      value === "included"
        ? { school_id: created.id, item_key, included: true }
        : { school_id: created.id, item_key, included: false, extra_amount: value ? value[0] : null, extra_period: value ? value[1] : null }
    );
    if (feeRows.length) mustOk(await db.from("school_fee_items").insert(feeRows), `fee items ${slug}`);
    mustOk(await db.from("school_faqs").insert(school.faqs.map((f, sort_order) => ({ school_id: created.id, question: f.q, answer: f.a, sort_order }))), `faqs ${slug}`);
  }

  for (const review of REVIEWS) {
    const user_id = userByEmail.get(review.email) ?? userByEmail.get(process.env.SEED_ADMIN_EMAIL ?? "admin@edumap.kg");
    const school_id = schoolIds.get(review.school);
    if (!user_id || !school_id) continue;
    mustOk(
      // body_hash is filled in by the database trigger
      await db.from("reviews").insert({ school_id, user_id, relationship: "parent", rating: review.rating, title: review.title, body: review.body, body_hash: "", status: "published" }),
      `review on ${review.school}`
    );
  }
  return schoolIds;
}
