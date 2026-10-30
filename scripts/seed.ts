/**
 * Seeds a local EduMaps.kg database with a complete, internally consistent demo dataset.
 *
 * Everything here is fictional: school names, reviews, people and advertisers do not refer to real
 * organisations. Re-running the script wipes previously seeded content and recreates it, so it is safe
 * to run repeatedly. Reference data (languages, regions, cities, categories) comes from the migrations.
 *
 *   npm run db:seed
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "node:path";
import type { Database } from "../src/lib/database.types";
import { ARTICLES } from "./seed/articles";
import { banner, cover, gallery, logo } from "./seed/art";
import { ADS, POSTS } from "./seed/community";
import { CITY_NAMES, PROGRAMS, SYSTEM_LABEL, TYPE_LABEL, LANG_LABEL, t, type I18n } from "./seed/i18n";
import { feeFor, hoursFor } from "./seed/fees";
import { ASPECTS, CLOSING, OPENING, TITLES } from "./seed/reviews";
import { REAL_SCHOOLS, SCHOOLS, type SeedSchool } from "./seed/schools";

config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url) && process.env.ALLOW_REMOTE_SEED !== "1") {
  console.error(`Refusing to seed a non-local database (${url}). Set ALLOW_REMOTE_SEED=1 to override.`);
  process.exit(1);
}

const db: SupabaseClient<Database> = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@edumap.kg";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "EduMap-Admin-2026!";
const USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? "EduMap-Parent-2026!";

type Lang = "kg" | "ru" | "en";
const ZERO = "00000000-0000-0000-0000-000000000000";

const USERS: { email: string; name: string; lang: Lang; role: "admin" | "moderator" | "user"; password: string }[] = [
  { email: ADMIN_EMAIL, name: "EduMaps Admin", lang: "en", role: "admin", password: ADMIN_PASSWORD },
  { email: "moderator@edumap.kg", name: "Айдай (модератор)", lang: "ru", role: "moderator", password: ADMIN_PASSWORD },
  { email: "aigerim@example.com", name: "Айгерим К.", lang: "ru", role: "user", password: USER_PASSWORD },
  { email: "bakyt@example.com", name: "Бакыт Т.", lang: "kg", role: "user", password: USER_PASSWORD },
  { email: "elena@example.com", name: "Елена С.", lang: "ru", role: "user", password: USER_PASSWORD },
  { email: "nurlan@example.com", name: "Нурлан А.", lang: "ru", role: "user", password: USER_PASSWORD },
  { email: "dina@example.com", name: "Дина М.", lang: "kg", role: "user", password: USER_PASSWORD },
  { email: "tilek@example.com", name: "Tilek B.", lang: "en", role: "user", password: USER_PASSWORD },
  { email: "sara@example.com", name: "Sara W.", lang: "en", role: "user", password: USER_PASSWORD },
  { email: "mirlan@example.com", name: "Мирлан О.", lang: "ru", role: "user", password: USER_PASSWORD },
];

/** Small deterministic PRNG so every run produces the same dataset. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rand = rng(20260101);
const pick = <T>(list: T[]): T => list[Math.floor(rand() * list.length)]!;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000 - Math.floor(rand() * 40_000_000)).toISOString();

function must<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data as T;
}
function mustOk(result: { error: { message: string } | null }, what: string) {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
}

async function wipe() {
  // Pictures uploaded through the admin panel live under uploads/. Their presence means real content has been entered,
  // and this script would delete every school, review and article. Stop unless the operator insists.
  const { count: realUploads } = await db.from("media_files").select("id", { count: "exact", head: true }).like("path", "uploads/%");
  const { count: edited } = await db.from("school_documents").select("school_id", { count: "exact", head: true });
  if ((realUploads ?? 0) > 0 || (edited ?? 0) > 0) {
    if (process.env.FORCE_RESEED !== "1") {
      console.error(`\n✖ This database holds real content (${realUploads ?? 0} uploaded picture(s), ${edited ?? 0} document link(s)).\n  Seeding would DELETE every school, review and article. Nothing was changed.\n  To do it anyway, set FORCE_RESEED=1.\n`);
      process.exit(1);
    }
    console.warn("! FORCE_RESEED=1: deleting real content.");
  }
  console.log("• Clearing previous seed data");
  // Child tables first; the schools/articles/posts deletes cascade to most dependants.
  for (const table of [
    "content_reports", "review_votes", "favorites", "community_comments", "community_posts", "reviews",
    "advertisements", "articles", "schools", "media_files", "page_events", "audit_logs", "site_testimonials",
  ] as const) {
    if (table === "page_events" || table === "audit_logs") {
      mustOk(await db.from(table).delete().gt("id", -1), `clear ${table}`);
    } else if (table === "review_votes") {
      mustOk(await db.from(table).delete().neq("review_id", ZERO), `clear ${table}`);
    } else {
      mustOk(await db.from(table).delete().neq("id", ZERO), `clear ${table}`);
    }
  }

  const emails = new Set(USERS.map((u) => u.email));
  let page = 1;
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const user of data.users) if (user.email && emails.has(user.email)) await db.auth.admin.deleteUser(user.id);
    if (data.users.length < 200) break;
    page += 1;
  }

  const { data: objects } = await db.storage.from("media").list("seed", { limit: 1000 });
  for (const folder of objects ?? []) {
    const { data: files } = await db.storage.from("media").list(`seed/${folder.name}`, { limit: 1000 });
    const paths = (files ?? []).map((f) => `seed/${folder.name}/${f.name}`);
    if (paths.length) await db.storage.from("media").remove(paths);
  }
}

async function createUsers(): Promise<Map<string, string>> {
  console.log("• Creating users");
  const ids = new Map<string, string>();
  for (const user of USERS) {
    const { data, error } = await db.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { display_name: user.name, preferred_lang: user.lang },
    });
    if (error || !data.user) throw new Error(`create user ${user.email}: ${error?.message}`);
    ids.set(user.email, data.user.id);
    if (user.role !== "user") mustOk(await db.from("users").update({ role: user.role }).eq("id", data.user.id), `role ${user.email}`);
  }
  return ids;
}

const uploads: { path: string; url: string; size: number; alt: I18n | null }[] = [];

async function upload(storagePath: string, svg: string, alt: I18n | null = null): Promise<string> {
  const body = Buffer.from(svg, "utf8");
  const { error } = await db.storage.from("media").upload(storagePath, body, { contentType: "image/svg+xml", upsert: true });
  if (error) throw new Error(`upload ${storagePath}: ${error.message}`);
  const publicUrl = db.storage.from("media").getPublicUrl(storagePath).data.publicUrl;
  uploads.push({ path: storagePath, url: publicUrl, size: body.length, alt });
  return publicUrl;
}

function fillTemplate(school: SeedSchool, lang: Lang): string {
  const city = CITY_NAMES[school.city]![lang];
  const type = TYPE_LABEL[school.type]![lang];
  const systems = school.systems.map((s) => SYSTEM_LABEL[s]![lang]).join(", ");
  const [from, to] = school.grades;
  const langs = school.languages.map((l) => LANG_LABEL[l.code]?.[lang] ?? l.code);
  const name = school.name[lang];
  const grades = from === 0 ? (lang === "en" ? `preschool to grade ${to}` : lang === "ru" ? `от дошкольной группы до ${to} класса` : `мектепке чейинки топтон ${to}-класска чейин`) : lang === "en" ? `grades ${from}–${to}` : lang === "ru" ? `${from}–${to} классы` : `${from}–${to}-класстар`;

  if (lang === "en") {
    return `${name} is a ${type} school in ${city}, founded in ${school.founded}. It teaches ${grades} using ${systems}, with lessons in ${langs.join(", ")}.\n\nAbout ${school.students} students study here with ${school.teachers} teachers. ${school.extra.en}`;
  }
  if (lang === "ru") {
    return `${name} — ${type} школа в городе ${city.replace(/е$/, "")}, основанная в ${school.founded} году. Здесь обучаются ${grades} по программе: ${systems}. Занятия проходят на следующих языках: ${langs.map((l) => l.replace(/ом$/, "ий")).join(", ")}.\n\nВ школе учатся около ${school.students} учеников, работают ${school.teachers} педагогов. ${school.extra.ru}`;
  }
  return `${name} — ${CITY_NAMES[school.city]!.kg} шаарындагы ${type} мектеп, ${school.founded}-жылы негизделген. Мектепте ${grades} окутулат, окуу программасы: ${systems}. Сабактар ${langs.join(", ")} тилдеринде өтөт.\n\nМектепте болжол менен ${school.students} окуучу окуйт, ${school.teachers} мугалим иштейт. ${school.extra.kg}`;
}

function reviewText(lang: Lang, rating: number) {
  const tone = rating >= 4 ? "pos" : rating === 3 ? "mid" : "neg";
  const keys = ["teaching", "facilities", "safety", "communication"] as const;
  const chosen = [...keys].sort(() => rand() - 0.5).slice(0, 2);
  const sentences = [
    pick(OPENING[tone][lang]),
    ...chosen.map((k) => pick(ASPECTS[k][tone === "pos" ? "pos" : rand() > 0.5 ? "low" : "pos"][lang])),
    pick(CLOSING[tone][lang]),
  ];
  return { title: pick(TITLES[tone][lang]), body: sentences.join(" ") };
}

async function main() {
  const started = Date.now();
  await wipe();
  const userIds = await createUsers();
  const members = USERS.filter((u) => u.role === "user");

  // Geography lookups
  const cities = must(await db.from("cities").select("id,slug,lat,lng"), "cities");
  const cityBySlug = new Map(cities.map((c) => [c.slug, c]));
  const articleCategories = new Map(must(await db.from("article_categories").select("id,slug"), "article categories").map((c) => [c.slug, c.id]));
  const communityCategories = new Map(must(await db.from("community_categories").select("id,slug"), "community categories").map((c) => [c.slug, c.id]));

  // Schools
  console.log(`• Creating ${SCHOOLS.length} schools with media`);
  const schoolIds = new Map<string, string>();
  for (const school of SCHOOLS) {
    const city = cityBySlug.get(school.city)!;
    const logoUrl = await upload(`seed/schools/${school.slug}/logo.svg`, logo(school.slug, school.initial), school.name);
    const coverUrl = await upload(`seed/schools/${school.slug}/cover.svg`, cover(school.slug), school.name);
    const galleryUrls: string[] = [];
    for (const [i, kind] of school.gallery.entries()) {
      galleryUrls.push(await upload(`seed/schools/${school.slug}/gallery-${i + 1}-${kind}.svg`, gallery(school.slug, kind), school.name));
    }

    const hasScholarship = Boolean(school.scholarships);
    const fee = feeFor(school.slug, school.tuition);
    const created = must(
      await db
        .from("schools")
        .insert({
          slug: school.slug,
          name: school.name,
          tagline: school.tagline,
          about: { kg: fillTemplate(school, "kg"), ru: fillTemplate(school, "ru"), en: fillTemplate(school, "en") },
          city_id: city.id,
          school_type: school.type,
          education_systems: school.systems,
          grade_from: school.grades[0],
          grade_to: school.grades[1],
          founded_year: school.founded,
          student_count: school.students,
          teacher_count: school.teachers,
          avg_class_size: school.classSize,
          ...hoursFor(school.type, school.slug),
          // Fictional WhatsApp numbers in the 312 000 block (never assigned), for roughly two schools in three.
          whatsapp: SCHOOLS.indexOf(school) % 3 === 2 ? null : `+996312000${String(100 + SCHOOLS.indexOf(school))}`,
          fee_min: fee.fee_min,
          fee_max: fee.fee_max,
          fee_period: fee.fee_period,
          fee_billing_months: fee.fee_billing_months,
          tuition_notes: school.tuitionNote ?? null,
          has_scholarships: hasScholarship,
          scholarships: school.scholarships ?? null,
          has_transportation: school.transport,
          transportation_info: school.transportInfo ?? null,
          has_boarding: school.boarding,
          boarding_info: school.boarding
            ? t("Жатакана бар, күнү-түнү көзөмөл.", "Есть проживание с круглосуточным присмотром.", "On-site boarding with round-the-clock supervision.")
            : null,
          phone: `+996 312 000 ${String(100 + SCHOOLS.indexOf(school)).padStart(3, "0")}`,
          email: `info@${school.slug}.example`,
          website: `https://${school.slug}.example`,
          logo_url: logoUrl,
          cover_url: coverUrl,
          status: "published",
          data_status: "demo",
          is_featured: Boolean(school.featured),
          created_at: daysAgo(200 + SCHOOLS.indexOf(school) * 3),
        })
        .select("id")
        .single(),
      `school ${school.slug}`
    );
    schoolIds.set(school.slug, created.id);

    mustOk(
      await db.from("school_locations").insert({
        school_id: created.id,
        lat: Number((Number(city.lat) + school.offset[0]).toFixed(6)),
        lng: Number((Number(city.lng) + school.offset[1]).toFixed(6)),
        address: school.street,
        district: school.district ?? null,
      }),
      `location ${school.slug}`
    );
    // The demo schools show full galleries, so they are on the Pro plan; the real, unverified listings start on Free.
    mustOk(await db.from("school_plans").insert({ school_id: created.id, plan: "pro" }), `plan ${school.slug}`);
    mustOk(
      await db.from("school_languages").insert(school.languages.map((l) => ({ school_id: created.id, language_code: l.code, is_primary: Boolean(l.primary) }))),
      `languages ${school.slug}`
    );
    const programRows = [...school.programs, ...school.clubs, ...school.sports].map((key, index) => {
      const p = PROGRAMS[key];
      if (!p) throw new Error(`Unknown program key ${key} on ${school.slug}`);
      return { school_id: created.id, kind: p.kind, name: p.name, description: p.description ?? null, sort_order: index };
    });
    mustOk(await db.from("school_programs").insert(programRows), `programs ${school.slug}`);
    mustOk(
      await db.from("school_facilities").insert(school.facilities.map((facility_key) => ({ school_id: created.id, facility_key }))),
      `facilities ${school.slug}`
    );
    const feeRows = Object.entries(fee.items).map(([item_key, value]) =>
      value === "included"
        ? { school_id: created.id, item_key, included: true }
        : { school_id: created.id, item_key, included: false, extra_amount: value ? value[0] : null, extra_period: value ? value[1] : null }
    );
    if (feeRows.length) mustOk(await db.from("school_fee_items").insert(feeRows), `fee items ${school.slug}`);
    mustOk(
      await db.from("school_media").insert(
        galleryUrls.map((u, i) => ({ school_id: created.id, kind: "image" as const, url: u, caption: school.name, sort_order: i }))
      ),
      `media ${school.slug}`
    );
    mustOk(
      await db.from("school_faqs").insert(school.faqs.map((f, i) => ({ school_id: created.id, question: f.q, answer: f.a, sort_order: i }))),
      `faqs ${school.slug}`
    );
  }

  // Real schools: listed with names only. No ratings, reviews, addresses or coordinates are invented for them;
  // photos are generated illustrations until each school supplies its own.
  console.log(`• Creating ${REAL_SCHOOLS.length} real schools (unverified, demo photos)`);
  const bishkek = cityBySlug.get("bishkek")!;
  for (const school of REAL_SCHOOLS) {
    const logoUrl = await upload(`seed/schools/${school.slug}/logo.svg`, logo(school.slug, school.initial), school.name);
    const coverUrl = await upload(`seed/schools/${school.slug}/cover.svg`, cover(school.slug), school.name);
    const galleryUrls: string[] = [];
    for (const [i, kind] of (["classroom", "sports", "library"] as const).entries()) {
      galleryUrls.push(await upload(`seed/schools/${school.slug}/gallery-${i + 1}-${kind}.svg`, gallery(school.slug, kind), school.name));
    }
    const created = must(
      await db
        .from("schools")
        .insert({
          slug: school.slug,
          name: school.name,
          about: t(
            `${school.name.kg} — Бишкектеги жеке мектеп. Толук маалымат чогултулуп жатат жана мектеп менен ырасталат.`,
            `${school.name.ru} — частная школа в Бишкеке. Подробная информация собирается и будет подтверждена школой.`,
            `${school.name.en} is a private school in Bishkek. Detailed information is being collected and will be confirmed with the school.`
          ),
          city_id: bishkek.id,
          school_type: "private",
          status: "published",
          data_status: "unverified",
          logo_url: logoUrl,
          cover_url: coverUrl,
        })
        .select("id")
        .single(),
      `real school ${school.slug}`
    );
    mustOk(
      await db.from("school_media").insert(
        galleryUrls.map((u, i) => ({
          school_id: created.id, kind: "image" as const, url: u, sort_order: i,
          caption: t("Демо сүрөт (иллюстрация)", "Демо-фото (иллюстрация)", "Demo photo (illustration)"),
        }))
      ),
      `real media ${school.slug}`
    );
  }

  // Reviews
  console.log("• Creating reviews");
  type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
  const reviewRows: ReviewInsert[] = [];
  const qualityOf = (s: SeedSchool) => (s.featured ? 4.6 : s.type === "international" ? 4.3 : s.type === "private" ? 4.0 : s.type === "specialized" ? 4.2 : 3.6);
  for (const school of SCHOOLS) {
    const count = school.featured ? 5 : 1 + Math.floor(rand() * 3);
    const authors = [...members].sort(() => rand() - 0.5).slice(0, count);
    for (const author of authors) {
      const rating = Math.max(1, Math.min(5, Math.round(qualityOf(school) + (rand() - 0.5) * 2.2)));
      const { title, body } = reviewText(author.lang, rating);
      const sub = () => (rand() > 0.35 ? Math.max(1, Math.min(5, rating + Math.round(rand() * 2 - 1))) : null);
      reviewRows.push({
        school_id: schoolIds.get(school.slug)!,
        user_id: userIds.get(author.email)!,
        relationship: pick(["parent", "parent", "parent", "student", "alumni"] as const),
        rating,
        rating_teaching: sub(),
        rating_facilities: sub(),
        rating_safety: sub(),
        rating_communication: sub(),
        title,
        body,
        body_hash: "",
        status: "published",
        helpful_count: 0,
        created_at: daysAgo(3 + Math.floor(rand() * 120)),
      });
    }
  }
  // A few reviews in other moderation states for the admin queue and member dashboards.
  const queue: { school: string; email: string; status: "pending" | "rejected"; flagged?: boolean; note?: string; title: string; body: string; rating: number }[] = [
    { school: "ala-too-international-school", email: "mirlan@example.com", status: "pending", title: "Отличная школа для старших классов", body: "Сын перешёл сюда в девятом классе и быстро адаптировался. Хорошие преподаватели и сильная подготовка по английскому языку.", rating: 5 },
    { school: "silk-road-lyceum", email: "tilek@example.com", status: "pending", title: "Good but expensive transport", body: "Teaching is strong and the lyceum has a friendly atmosphere. The only downside for us was the cost of school transport, which keeps rising.", rating: 4 },
    { school: "bilim-secondary-school", email: "dina@example.com", status: "pending", title: "Мектеп жакшы, класстар толуп калган", body: "Мугалимдер аракет кылышат, бирок класстарда окуучу өтө көп. Спорт аянтчасы жакшы, ата-энелер чогулушу активдүү өтөт.", rating: 3 },
    { school: "neva-russian-school", email: "sara@example.com", status: "rejected", note: "Отзыв содержит рекламу сторонних услуг.", title: "Check out my tutoring service", body: "The school is fine but you should really try my tutoring service at the link below, guaranteed grades improvement for every student.", rating: 5 },
  ];
  for (const q of queue) {
    if (reviewRows.some((r) => r.school_id === schoolIds.get(q.school) && r.user_id === userIds.get(q.email))) continue;
    reviewRows.push({
      school_id: schoolIds.get(q.school)!, user_id: userIds.get(q.email)!, relationship: "parent", rating: q.rating,
      title: q.title, body: q.body, body_hash: "", status: q.status, moderation_note: q.note ?? null, created_at: daysAgo(1),
    });
  }
  const inserted = must(await db.from("reviews").insert(reviewRows, { defaultToNull: false }).select("id,status,school_id,user_id"), "reviews");
  // Flag one published review so the moderation "flagged" filter has data, and add helpful votes.
  const published = inserted.filter((r) => r.status === "published");
  if (published[0]) {
    mustOk(await db.from("reviews").update({ is_flagged: true, flag_reason: "Possible conflict of interest" }).eq("id", published[0].id), "flag review");
  }
  const voteRows = published.slice(1, 14).flatMap((review) =>
    members.filter((m) => userIds.get(m.email) !== review.user_id).slice(0, 1 + Math.floor(rand() * 3)).map((m) => ({
      review_id: review.id, user_id: userIds.get(m.email)!, is_helpful: true,
    }))
  );
  mustOk(await db.from("review_votes").insert(voteRows), "review votes");

  // Articles
  console.log("• Creating articles");
  for (const [index, article] of ARTICLES.entries()) {
    const coverUrl = await upload(`seed/articles/${article.slug}.svg`, banner(article.slug, article.category.replace(/-/g, " ").toUpperCase()), article.title);
    const published = daysAgo(article.daysAgo);
    mustOk(
      await db.from("articles").insert({
        slug: article.slug,
        category_id: articleCategories.get(article.category)!,
        kind: article.kind,
        title: article.title,
        excerpt: article.excerpt,
        body: article.body,
        cover_url: coverUrl,
        author_id: userIds.get(ADMIN_EMAIL)!,
        tags: article.tags,
        reading_minutes: article.minutes,
        status: "published",
        is_featured: Boolean(article.featured),
        view_count: 40 + index * 17,
        published_at: published,
      }),
      `article ${article.slug}`
    );
  }

  // Community
  console.log("• Creating community posts and comments");
  for (const post of POSTS) {
    const author = userIds.get(post.author)!;
    const row = must(
      await db
        .from("community_posts")
        .insert({
          category_id: communityCategories.get(post.category)!,
          user_id: author,
          title: post.title,
          body: post.body,
          body_hash: "",
          status: post.status,
          is_pinned: Boolean(post.pinned),
          moderation_note: post.note ?? null,
          created_at: daysAgo(post.daysAgo),
          view_count: post.status === "published" ? 30 + Math.floor(rand() * 200) : 0,
        })
        .select("id")
        .single(),
      `post ${post.title}`
    );
    for (const [i, comment] of (post.comments ?? []).entries()) {
      mustOk(
        await db.from("community_comments").insert({
          post_id: row.id, user_id: userIds.get(comment.author)!, body: comment.body, created_at: daysAgo(Math.max(0, post.daysAgo - 1 - i)),
        }),
        "comment"
      );
    }
  }

  // Favorites for the first member so the dashboard is populated
  const demoUser = userIds.get("aigerim@example.com")!;
  mustOk(
    await db.from("favorites").insert([
      ...["ala-too-international-school", "silk-road-lyceum", "aigul-montessori-school"].map((slug) => ({ user_id: demoUser, school_id: schoolIds.get(slug)! })),
    ]),
    "favorite schools"
  );
  const firstArticle = must(await db.from("articles").select("id").eq("slug", "school-visit-checklist").single(), "article lookup");
  mustOk(await db.from("favorites").insert({ user_id: demoUser, article_id: firstArticle.id }), "favorite article");

  // Advertising
  console.log("• Creating advertisements");
  for (const ad of ADS) {
    const image = await upload(`seed/ads/${ad.advertiser.toLowerCase().replace(/\s+/g, "-")}.svg`, banner(ad.advertiser, ad.label), null);
    mustOk(
      await db.from("advertisements").insert({
        advertiser_name: ad.advertiser, customer_type: ad.type, placement: ad.placement, headline: ad.headline, body: ad.body,
        cta_label: ad.cta, image_url: image, target_url: ad.url, starts_at: daysAgo(10), ends_at: new Date(Date.now() + 90 * 86_400_000).toISOString(),
        is_active: true, impressions: 300 + Math.floor(rand() * 4000), clicks: 8 + Math.floor(rand() * 120),
      }),
      `ad ${ad.advertiser}`
    );
  }

  // Media library records for everything uploaded
  mustOk(
    await db.from("media_files").insert(
      uploads.map((u) => ({
        bucket: "media", path: u.path, public_url: u.url, mime_type: "image/svg+xml", size_bytes: u.size, alt: u.alt, uploaded_by: userIds.get(ADMIN_EMAIL)!,
      }))
    ),
    "media files"
  );

  // Analytics history: 30 days of page events so the admin charts have real shape
  console.log("• Creating sample opinions about the site");
  const opinions = [
    { kind: "member" as const, email: "aigerim@example.com", name: "Aigerim S.", title: "Parent, Bishkek", quote: t("Мектепти табуу оңой болду: баасын, тилин жана картадагы жайгашкан жерин бир жерден көрдүм. Пикирлерди адам текшергенин билүү ишеним берет.", "Выбрать школу стало проще: цена, язык и расположение на карте в одном месте. Приятно знать, что отзывы читает живой человек.", "Choosing a school got easier: fees, language and the map in one place. It helps to know a person reads every review.") },
    { kind: "member" as const, email: "tilek@example.com", name: "Tilek B.", title: "Parent, Osh", quote: t("Салыштыруу барагы эки мектептин айырмасын бир көз ирмемде көрсөттү. Жарнама жөнүндө так жазылганы да жагат.", "Страница сравнения сразу показала разницу между двумя школами. Нравится и то, что реклама чётко подписана.", "The comparison page showed the difference between two schools at a glance. I also like that ads are clearly labelled.") },
  ];
  for (const o of opinions) {
    mustOk(await db.from("site_testimonials").insert({ kind: o.kind, user_id: userIds.get(o.email)!, author_name: o.name, author_title: o.title, quote: o.quote, status: "published", is_demo: true }), `opinion ${o.name}`);
  }
  mustOk(await db.from("site_testimonials").insert([
    { kind: "invited", author_name: "Sample Guest (demo)", author_title: "Director, Sample Education Foundation", status: "published", is_demo: true, consent_note: "Demo entry: no real person",
      quote: t("Ата-энелер үчүн калыс маалымат — бул абдан маанилүү. Платформа бардык мектепке бирдей мамиле кылса, ишеним өсөт.", "Независимая информация для родителей очень важна. Доверие растёт, когда платформа одинаково относится ко всем школам.", "Independent information for parents matters a great deal. Trust grows when a platform treats every school the same way.") },
    { kind: "invited", author_name: "Sample Teacher (demo)", author_title: "Teacher, Sample School", status: "published", is_demo: true, consent_note: "Demo entry: no real person",
      quote: t("Бир жерден көптөгөн мектептерди көрүү жана алардын тилдерин салыштыруу — ата-энелер үчүн чоң жеңилдик.", "Возможность увидеть много школ в одном месте и сравнить языки обучения — большое подспорье для родителей.", "Seeing many schools in one place and comparing their languages is a real help for parents.") },
  ]), "guest opinions");

  console.log("• Creating analytics history");
  const events: Database["public"]["Tables"]["page_events"]["Insert"][] = [];
  const types = ["school_view", "school_view", "school_view", "article_view", "search", "map_open", "compare", "post_view"] as const;
  for (let d = 0; d < 30; d++) {
    const perDay = 25 + Math.floor(rand() * 40) + (30 - d);
    for (let i = 0; i < perDay; i++) {
      events.push({
        event_type: pick([...types]),
        lang: pick(["kg", "ru", "ru", "en"] as const),
        created_at: new Date(Date.now() - d * 86_400_000 - Math.floor(rand() * 80_000_000)).toISOString(),
      });
    }
  }
  for (let i = 0; i < events.length; i += 500) mustOk(await db.from("page_events").insert(events.slice(i, i + 500)), "events");

  // Per-school interest history for the admin statistics pages (fictional, like everything else in the demo data).
  console.log("• Creating school interest history");
  const demoSchools = must(await db.from("schools").select("id,slug,rating_avg,whatsapp,phone,email,website").in("slug", SCHOOLS.map((s) => s.slug)), "demo schools");
  const SECTION_REACH: Record<string, number> = { overview: 0.97, about: 0.6, programs: 0.45, languages: 0.5, facilities: 0.4, activities: 0.3, tuition: 0.55, transportation: 0.25, gallery: 0.35, location: 0.3, reviews: 0.42, faq: 0.2 };
  const SOURCES = ["directory", "directory", "directory", "home", "map", "compare", "search_engine", "search_engine", "direct", "city", "other_school", "external"] as const;
  const school_events: Database["public"]["Tables"]["page_events"]["Insert"][] = [];
  for (const school of demoSchools) {
    const popularity = 40 + Math.floor(rand() * 160) + Math.round(Number(school.rating_avg) * 20);
    for (let i = 0; i < popularity; i++) {
      const lang = pick(["kg", "ru", "ru", "en"] as const);
      const at = () => new Date(Date.now() - Math.floor(rand() * 30 * 86_400_000)).toISOString();
      const created_at = at();
      const base = { entity_id: school.id, lang, created_at };
      school_events.push({ ...base, event_type: "school_view", meta: pick([...SOURCES]) });
      if (rand() < 0.5) {
        for (const [section, reach] of Object.entries(SECTION_REACH)) if (rand() < reach) school_events.push({ ...base, event_type: "section_view", meta: section });
        const t = rand();
        school_events.push({ ...base, event_type: "time_on_page", meta: t < 0.3 ? "lt10" : t < 0.6 ? "s10_30" : t < 0.9 ? "s30_120" : "gt120" });
      }
      if (school.whatsapp && rand() < 0.07) school_events.push({ ...base, event_type: "contact_click", meta: "whatsapp" });
      if (school.phone && rand() < 0.045) school_events.push({ ...base, event_type: "contact_click", meta: "phone" });
      if (school.email && rand() < 0.02) school_events.push({ ...base, event_type: "contact_click", meta: "email" });
      if (school.website && rand() < 0.04) school_events.push({ ...base, event_type: "contact_click", meta: "website" });
      if (rand() < 0.05) school_events.push({ ...base, event_type: "contact_click", meta: pick(["directions", "google_maps", "gis2"] as const) });
      if (rand() < 0.015) school_events.push({ ...base, event_type: "contact_click", meta: "share" });
      if (rand() < 0.06) school_events.push({ ...base, event_type: "compare_add" });
    }
  }
  for (let i = 0; i < school_events.length; i += 500) mustOk(await db.from("page_events").insert(school_events.slice(i, i + 500)), "school events");

  const counts = await Promise.all(
    (["schools", "reviews", "articles", "community_posts", "advertisements"] as const).map(async (table) => {
      const { count } = await db.from(table).select("id", { count: "exact", head: true });
      return `${table}: ${count}`;
    })
  );
  console.log(`\n✔ Seed complete in ${((Date.now() - started) / 1000).toFixed(1)}s (${counts.join(", ")})`);
  console.log("\nAccounts");
  console.log(`  Admin      ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Moderator  moderator@edumap.kg / ${ADMIN_PASSWORD}`);
  console.log(`  Parent     aigerim@example.com / ${USER_PASSWORD}  (and 7 more *@example.com members)`);
}

main().catch((error) => {
  console.error("\n✖ Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
