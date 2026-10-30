import type { SchoolFormValues } from "@/components/admin/school-form";
import { EMPTY_SCHOOL } from "@/lib/admin-defaults";
import { SCHOOL_TYPES } from "@/lib/constants";
import { schoolPayloadSchema } from "@/lib/validation/admin";
import { normalizeWhatsapp } from "@/lib/whatsapp";

/* ------------------------------------------------------------------------------------------------
 * Columns of the school spreadsheet
 * ---------------------------------------------------------------------------------------------- */

export type Column = { key: string; group: string; required?: boolean; help: string; example1: string; example2: string };

const col = (key: string, group: string, help: string, example1 = "", example2 = "", required = false): Column => ({ key, group, help, example1, example2, required });

export const COLUMNS: Column[] = [
  col("slug", "Identity", "Web address part (lowercase letters, numbers, hyphens). Leave empty to create it from name_en. An existing slug means “update this school”."),
  col("name_en", "Identity", "School name in English. Required for a new school.", "Example Lyceum (delete this row)", "Example Gymnasium (delete this row)", true),
  col("name_ru", "Identity", "School name in Russian.", "Пример лицей (удалите эту строку)", "Пример гимназия (удалите эту строку)"),
  col("name_kg", "Identity", "School name in Kyrgyz.", "Үлгү лицей (бул саптан арылыңыз)", "Үлгү гимназия (бул саптан арылыңыз)"),
  col("tagline_en", "Identity", "One-line description (max 200 characters).", "A modern lyceum", "A friendly gymnasium"),
  col("tagline_ru", "Identity", "One-line description in Russian."),
  col("tagline_kg", "Identity", "One-line description in Kyrgyz."),
  col("about_en", "Identity", "Longer description (max 6000 characters).", "Example text.", "Example text."),
  col("about_ru", "Identity", "Longer description in Russian."),
  col("about_kg", "Identity", "Longer description in Kyrgyz."),
  col("city", "Location", "City: its slug or its name in any language (see the list below). Required for a new school.", "bishkek", "osh", true),
  col("school_type", "Location", "public, private, international or specialized (Russian and Kyrgyz words also work). Required for a new school.", "private", "public", true),
  col("district", "Location", "District or neighbourhood.", "Pervomaisky", ""),
  col("address_en", "Location", "Street address in English. Required when you give coordinates.", "1 Example Street", "2 Example Street"),
  col("address_ru", "Location", "Street address in Russian."),
  col("address_kg", "Location", "Street address in Kyrgyz."),
  col("lat", "Location", "Latitude, 39 to 44. A school without coordinates is not shown on the map.", "42.8746", "40.5283"),
  col("lng", "Location", "Longitude, 69 to 81.", "74.5698", "72.7985"),
  col("education_systems", "Academics", "Education systems, separated by semicolons (key or name; see the list below).", "national; cambridge", "national"),
  col("grade_from", "Academics", "First grade (0 = preschool).", "1", "1"),
  col("grade_to", "Academics", "Last grade.", "11", "11"),
  col("languages", "Academics", "Languages of instruction, separated by semicolons. The first one is the main language.", "kg; ru; en", "ru; kg"),
  col("founded_year", "Academics", "Year founded.", "2008", ""),
  col("student_count", "Academics", "Number of students.", "640", ""),
  col("teacher_count", "Academics", "Number of teachers.", "78", ""),
  col("avg_class_size", "Academics", "Average class size.", "16", ""),
  col("facilities", "Academics", "Facilities, separated by semicolons (key or name; see the list below).", "library; gym; canteen", "library"),
  col("opening_time", "School day", "When classes start, e.g. 08:30.", "08:30", "08:00"),
  col("closing_time", "School day", "When classes finish, e.g. 15:30.", "15:30", "13:30"),
  col("working_days", "School day", "Working days: Mon-Fri, Mon-Sat, 1-5 or a list such as Mon, Wed, Fri (Russian abbreviations work too).", "Mon-Fri", "Mon-Sat"),
  col("fee_min", "Tuition", "Fee as the school states it, in KGS. Use 0 for free schools.", "15000", "0"),
  col("fee_max", "Tuition", "Upper end of the fee, if there is a range.", "22000", ""),
  col("fee_period", "Tuition", "How often the fee is paid: month, quarter or year. Default: month.", "month", ""),
  col("fee_billing_months", "Tuition", "Months in the school year, 9 to 12. Default: 9.", "9", ""),
  col("fee_items", "Tuition", "What the fee covers: key:included, key:paid, or key:amount/one_time|year|month, separated by semicolons.", "meals:included; uniform:5000/one_time; transport:4500/month", ""),
  col("has_scholarships", "Services", "yes or no.", "yes", "no"),
  col("has_transportation", "Services", "yes or no.", "yes", "no"),
  col("has_boarding", "Services", "yes or no.", "no", "no"),
  col("phone", "Contact", "Phone number.", "+996 312 000 111", ""),
  col("whatsapp", "Contact", "WhatsApp number in any common format. No number means no WhatsApp button.", "+996 312 000 112", ""),
  col("email", "Contact", "Email address.", "info@example-lyceum.example", ""),
  col("website", "Contact", "Website, starting with https://.", "https://example-lyceum.example", ""),
  col("facebook", "Contact", "Facebook page address."),
  col("instagram", "Contact", "Instagram page address."),
  col("telegram", "Contact", "Telegram channel address."),
  col("youtube", "Contact", "YouTube channel address."),
  col("tiktok", "Contact", "TikTok page address."),
  col("logo_url", "Photos", "Address of the logo image (only with the school's permission)."),
  col("cover_url", "Photos", "Address of the cover image (only with the school's permission)."),
  col("plan", "Publishing", "free (2 gallery photos, 1 video) or pro (10 photos, 5 videos). Only administrators see it. Empty = free for new schools.", "free", "free"),
  col("status", "Publishing", "draft, published or archived. Empty = the default chosen on the import screen (new schools only).", "draft", "draft"),
  col("data_status", "Publishing", "unverified, verified or demo. Empty = the default chosen on the import screen (new schools only).", "demo", "demo"),
];

export const COLUMN_KEYS = COLUMNS.map((c) => c.key);

const ALIASES: Record<string, string> = {
  name: "name_en", title: "name_en", school: "name_en", school_name: "name_en", name_english: "name_en",
  type: "school_type", systems: "education_systems", education_system: "education_systems", language: "languages",
  tuition_from: "fee_min", tuition_to: "fee_max", tuition_min: "fee_min", tuition_max: "fee_max", fee_from: "fee_min", fee_to: "fee_max",
  latitude: "lat", longitude: "lng", lon: "lng", long: "lng", site: "website", web: "website", tel: "phone", telephone: "phone", mail: "email", "e_mail": "email",
  start_time: "opening_time", end_time: "closing_time", days: "working_days", facility: "facilities", scholarships: "has_scholarships",
  transport: "has_transportation", transportation: "has_transportation", boarding: "has_boarding", year_founded: "founded_year", students: "student_count",
  teachers: "teacher_count", class_size: "avg_class_size", address: "address_en", whats_app: "whatsapp", logo: "logo_url", cover: "cover_url",
};

export const normalizeHeader = (h: string) => {
  const key = h.trim().toLowerCase().replace(/[\s\-]+/g, "_");
  return ALIASES[key] ?? key;
};

/* ------------------------------------------------------------------------------------------------
 * Lookups (cities, systems, languages, facilities, fee items) and small value parsers
 * ---------------------------------------------------------------------------------------------- */

export type Named = { key: string; id?: string; names: string[] };
export type Lookups = { cities: Named[]; systems: Named[]; languages: Named[]; facilities: Named[]; feeItems: Named[] };

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const find = (list: Named[], token: string): Named | undefined => {
  const n = norm(token);
  if (!n) return undefined;
  return list.find((item) => norm(item.key) === n || item.names.some((name) => norm(name) === n));
};

export const splitList = (s: string) => s.split(/[;|\n,]+/).map((x) => x.trim()).filter(Boolean);

export function parseInteger(raw: string): number | null {
  const s = raw.replace(/[\s ]/g, " ").trim();
  if (!s) return null;
  if (/^\d{1,3}( \d{3})+$/.test(s) || /^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[^\d]/g, ""));
  if (/^\d+([.,]\d+)?$/.test(s.replace(/ /g, ""))) return Math.round(Number(s.replace(/ /g, "").replace(",", ".")));
  return null;
}

export function parseDecimal(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export function parseTime(raw: string): string | null {
  const m = /^(\d{1,2})(?:[:.hHчч]?(\d{2}))?\s*(am|pm)?$/i.exec(raw.trim());
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (m[3]) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0);
  }
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function parseBoolean(raw: string): boolean | null {
  const s = norm(raw);
  if (["yes", "y", "true", "1", "да", "ооба", "бар", "+"].includes(s)) return true;
  if (["no", "n", "false", "0", "нет", "жок", "-", "none"].includes(s)) return false;
  return null;
}

const DAY_NAMES: Record<string, number> = {
  mon: 1, monday: 1, "пн": 1, "пон": 1, "понедельник": 1, "дүй": 1, "дуй": 1, "дүйшөмбү": 1,
  tue: 2, tues: 2, tuesday: 2, "вт": 2, "вто": 2, "вторник": 2, "шей": 2, "шейшемби": 2,
  wed: 3, wednesday: 3, "ср": 3, "сре": 3, "среда": 3, "шар": 3, "шаршемби": 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4, "чт": 4, "чет": 4, "четверг": 4, "бей": 4, "бейшемби": 4,
  fri: 5, friday: 5, "пт": 5, "пят": 5, "пятница": 5, "жум": 5, "жума": 5,
  sat: 6, saturday: 6, "сб": 6, "суб": 6, "суббота": 6, "ише": 6, "ишемби": 6,
  sun: 7, sunday: 7, "вс": 7, "вос": 7, "воскресенье": 7, "жек": 7, "жекшемби": 7,
};

export function parseDays(raw: string): number[] | null {
  const days = new Set<number>();
  const one = (t: string): number | null => {
    const n = norm(t).replace(/ /g, "");
    if (/^[1-7]$/.test(n)) return Number(n);
    return DAY_NAMES[n] ?? null;
  };
  for (const part of raw.split(/[,;/|]+/).map((p) => p.trim()).filter(Boolean)) {
    const range = /^(.+?)\s*(?:-|–|—|\bto\b|до)\s*(.+)$/i.exec(part);
    if (range) {
      const a = one(range[1]!);
      const b = one(range[2]!);
      if (a == null || b == null) return null;
      for (let d = a; ; d = (d % 7) + 1) {
        days.add(d);
        if (d === b) break;
      }
      continue;
    }
    for (const word of part.split(/\s+/)) {
      const d = one(word);
      if (d == null) return null;
      days.add(d);
    }
  }
  return days.size ? [...days].sort((a, b) => a - b) : null;
}

const SHORT_DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function daysToText(days: number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j]! + 1) j += 1;
    parts.push(j - i + 1 >= 3 ? `${SHORT_DAY[sorted[i]! - 1]}-${SHORT_DAY[sorted[j]! - 1]}` : sorted.slice(i, j + 1).map((d) => SHORT_DAY[d - 1]).join(", "));
    i = j + 1;
  }
  return parts.join(", ");
}

const TYPE_WORDS: Record<string, (typeof SCHOOL_TYPES)[number]> = {
  public: "public", state: "public", "государственная": "public", "государственный": "public", "мамлекеттик": "public",
  private: "private", "частная": "private", "частный": "private", "жеке": "private",
  international: "international", "международная": "international", "международный": "international", "эл аралык": "international",
  specialized: "specialized", specialised: "specialized", "специализированная": "specialized", "специализированный": "specialized", "адистештирилген": "specialized",
};

const PERIOD_WORDS: Record<string, "month" | "quarter" | "year"> = {
  month: "month", monthly: "month", "мес": "month", "месяц": "month", "ай": "month", "айына": "month",
  quarter: "quarter", quarterly: "quarter", "четверть": "quarter", "чейрек": "quarter",
  year: "year", yearly: "year", annual: "year", annually: "year", "год": "year", "жыл": "year", "жылына": "year",
};
const EXTRA_WORDS: Record<string, "one_time" | "year" | "month"> = {
  one_time: "one_time", onetime: "one_time", once: "one_time", "one time": "one_time", single: "one_time", "разово": "one_time", "бир жолу": "one_time",
  year: "year", yearly: "year", annual: "year", "год": "year", "жыл": "year",
  month: "month", monthly: "month", "мес": "month", "месяц": "month", "ай": "month",
};

const slugifyAscii = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
export { slugifyAscii as slugifyName };

/* ------------------------------------------------------------------------------------------------
 * One spreadsheet row -> the fields it provides, in the shape the school editor saves
 * ---------------------------------------------------------------------------------------------- */

export type Partial_ = Record<string, unknown>;
export type ReadRow = { line: number; name: string; slug: string; partial: Partial_; errors: string[]; warnings: string[] };

export type ImportDefaults = { status: "draft" | "published"; dataStatus: "demo" | "unverified" | "verified" };

const I18N_GROUPS = ["name", "tagline", "about"] as const;

export function readRow(cells: Record<string, string>, line: number, lookups: Lookups): ReadRow {
  const errors: string[] = [];
  const warnings: string[] = [];
  const partial: Partial_ = {};
  const get = (k: string) => (cells[k] ?? "").trim();
  const bad = (k: string, msg: string) => errors.push(`${k}: ${msg}`);

  const slugCell = get("slug");
  if (slugCell) {
    const slug = slugCell.toLowerCase();
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) bad("slug", "use lowercase letters, numbers and hyphens only");
    else partial.slug = slug;
  }

  for (const group of I18N_GROUPS) {
    const value: Record<string, string> = {};
    for (const lang of ["en", "ru", "kg"] as const) if (get(`${group}_${lang}`)) value[lang] = get(`${group}_${lang}`);
    if (Object.keys(value).length) partial[group] = value;
  }
  const tuitionNotes: Record<string, string> = {};
  for (const lang of ["en", "ru", "kg"] as const) if (get(`tuition_notes_${lang}`)) tuitionNotes[lang] = get(`tuition_notes_${lang}`);
  if (Object.keys(tuitionNotes).length) partial.tuition_notes = tuitionNotes;

  if (get("city")) {
    const city = find(lookups.cities, get("city"));
    if (city) partial.city_id = city.id;
    else bad("city", `“${get("city")}” is not a known city (see the list below)`);
  }
  if (get("school_type")) {
    const t = TYPE_WORDS[norm(get("school_type"))];
    if (t) partial.school_type = t;
    else bad("school_type", `“${get("school_type")}” is not one of public, private, international, specialized`);
  }
  if (get("district") || get("address_en") || get("address_ru") || get("address_kg") || get("lat") || get("lng")) {
    const location: Record<string, unknown> = {};
    const address: Record<string, string> = {};
    for (const lang of ["en", "ru", "kg"] as const) if (get(`address_${lang}`)) address[lang] = get(`address_${lang}`);
    if (Object.keys(address).length) location.address = address;
    if (get("district")) location.district = get("district");
    if (get("lat")) {
      const lat = parseDecimal(get("lat"));
      if (lat == null) bad("lat", `“${get("lat")}” is not a number`);
      else location.lat = lat;
    }
    if (get("lng")) {
      const lng = parseDecimal(get("lng"));
      if (lng == null) bad("lng", `“${get("lng")}” is not a number`);
      else location.lng = lng;
    }
    partial.location = location;
  }

  const listColumn = (key: string, lookup: Named[], field: string, what: string) => {
    if (!get(key)) return null;
    const found: string[] = [];
    for (const token of splitList(get(key))) {
      const match = find(lookup, token);
      if (match) found.push(match.key);
      else bad(key, `“${token}” is not a known ${what} (see the list below)`);
    }
    partial[field] = [...new Set(found)];
    return found;
  };
  listColumn("education_systems", lookups.systems, "education_systems", "education system");
  const langs = listColumn("languages", lookups.languages, "_language_codes", "language");
  if (langs) partial.languages = [...new Set(langs)].map((code, i) => ({ code, is_primary: i === 0 }));
  delete partial._language_codes;
  const facilities = listColumn("facilities", lookups.facilities, "_facility_keys", "facility");
  if (facilities) partial.facilities = [...new Set(facilities)].map((facility_key) => ({ facility_key, note: {} }));
  delete partial._facility_keys;

  const integer = (key: string, field = key) => {
    if (!get(key)) return;
    const n = parseInteger(get(key));
    if (n == null) bad(key, `“${get(key)}” is not a whole number`);
    else partial[field] = n;
  };
  for (const key of ["grade_from", "grade_to", "founded_year", "student_count", "teacher_count", "avg_class_size", "fee_min", "fee_max", "fee_billing_months"]) integer(key);

  if (get("fee_period")) {
    const p = PERIOD_WORDS[norm(get("fee_period"))];
    if (p) partial.fee_period = p;
    else bad("fee_period", `“${get("fee_period")}” is not month, quarter or year`);
  }

  for (const key of ["opening_time", "closing_time"] as const) {
    if (!get(key)) continue;
    const t = parseTime(get(key));
    if (t) partial[key] = t;
    else bad(key, `“${get(key)}” is not a time like 08:30`);
  }
  if (get("working_days")) {
    const d = parseDays(get("working_days"));
    if (d) partial.working_days = d;
    else bad("working_days", `“${get("working_days")}” is not understood (try Mon-Fri, Mon-Sat or 1-5)`);
  }

  for (const key of ["has_scholarships", "has_transportation", "has_boarding"] as const) {
    if (!get(key)) continue;
    const b = parseBoolean(get(key));
    if (b == null) bad(key, `“${get(key)}” should be yes or no`);
    else partial[key] = b;
  }

  if (get("fee_items")) {
    const items: { item_key: string; included: boolean; extra_amount: number | string; extra_period: string }[] = [];
    for (const token of get("fee_items").split(/[;|\n]+/).map((t) => t.trim()).filter(Boolean)) {
      const [name, ...rest] = token.split(":");
      const value = rest.join(":").trim();
      const item = find(lookups.feeItems, name ?? "");
      if (!item) {
        bad("fee_items", `“${name}” is not a known fee item (see the list below)`);
        continue;
      }
      const v = norm(value);
      if (["included", "inc", "yes", "covered", "входит", "кирет"].includes(v)) items.push({ item_key: item.key, included: true, extra_amount: "", extra_period: "" });
      else if (["", "paid", "extra", "separate", "separately", "no", "отдельно", "өзүнчө"].includes(v)) items.push({ item_key: item.key, included: false, extra_amount: "", extra_period: "" });
      else {
        const m = /^(.+?)\s*\/\s*(.+)$/.exec(value);
        const amount = m ? parseInteger(m[1]!) : null;
        const period = m ? EXTRA_WORDS[norm(m[2]!).replace(/ /g, "_")] ?? EXTRA_WORDS[norm(m[2]!)] : undefined;
        if (amount == null || !period) bad("fee_items", `“${token}”: write key:included, key:paid or key:amount/one_time (or /year, /month)`);
        else items.push({ item_key: item.key, included: false, extra_amount: amount, extra_period: period });
      }
    }
    partial.fee_items = items;
  }

  for (const key of ["phone", "email", "website", "logo_url", "cover_url"] as const) if (get(key)) partial[key] = get(key);
  if (get("whatsapp")) {
    const n = normalizeWhatsapp(get("whatsapp"));
    if (n) partial.whatsapp = n;
    else bad("whatsapp", `“${get("whatsapp")}” is not a valid phone number`);
  }
  const social: Record<string, string> = {};
  for (const key of ["facebook", "instagram", "telegram", "youtube", "tiktok"]) if (get(key)) social[key] = get(key);
  if (Object.keys(social).length) partial.social = social;

  if (get("plan")) {
    const p = norm(get("plan"));
    if (p === "free" || p === "pro") partial.plan = p;
    else bad("plan", `“${get("plan")}” is not free or pro`);
  }
  if (get("status")) {
    const s = norm(get("status"));
    if (["draft", "published", "archived"].includes(s)) partial.status = s;
    else bad("status", `“${get("status")}” is not draft, published or archived`);
  }
  if (get("data_status")) {
    const s = norm(get("data_status"));
    if (["demo", "unverified", "verified"].includes(s)) partial.data_status = s;
    else bad("data_status", `“${get("data_status")}” is not unverified, verified or demo`);
  }

  const name = (partial.name as Record<string, string> | undefined)?.en ?? "";
  const slug = (partial.slug as string | undefined) ?? slugifyAscii(name);
  return { line, name, slug, partial, errors, warnings };
}

/* ------------------------------------------------------------------------------------------------
 * Combine the row with defaults (new school) or with the saved school (update), then validate
 * ---------------------------------------------------------------------------------------------- */

const isPlain = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);

/** Overlays the provided fields on a base. Text in a language and social links are merged one by one; lists are replaced. */
export function overlay(base: SchoolFormValues, partial: Partial_): SchoolFormValues {
  const out = structuredClone(base) as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(partial)) {
    if (key === "location" && isPlain(value)) {
      const current = (isPlain(out.location) ? out.location : { lat: "", lng: "", address: {}, district: "", google_maps_url: "", twogis_url: "" }) as Record<string, unknown>;
      const next: Record<string, unknown> = { ...current };
      for (const [k, v] of Object.entries(value)) next[k] = k === "address" && isPlain(v) ? { ...(isPlain(current.address) ? current.address : {}), ...v } : v;
      out.location = next;
    } else if (isPlain(value) && isPlain(out[key])) {
      out[key] = { ...(out[key] as object), ...value };
    } else out[key] = value;
  }
  return out as unknown as SchoolFormValues;
}

export const PAYLOAD_COLUMN: Record<string, string> = {
  working_days: "working_days", education_systems: "education_systems", languages: "languages", facilities: "facilities", fee_items: "fee_items", whatsapp: "whatsapp",
};

function columnFor(path: (string | number)[]): string {
  const [root, second] = path;
  if (root === "name" || root === "tagline" || root === "about" || root === "tuition_notes") return `${root}_${typeof second === "string" ? second : "en"}`;
  if (root === "location") return second === "address" ? `address_${typeof path[2] === "string" ? path[2] : "en"}` : String(second ?? "lat");
  if (root === "social") return String(second ?? "social");
  return PAYLOAD_COLUMN[String(root)] ?? String(root);
}

export type Assembled = { payload: Record<string, unknown> | null; errors: string[]; warnings: string[] };

export function assemble(row: ReadRow, base: SchoolFormValues | null, defaults: ImportDefaults): Assembled {
  const errors = [...row.errors];
  const warnings = [...row.warnings];
  const creating = !base;
  if (creating) {
    const name = (row.partial.name as Record<string, string> | undefined)?.en;
    if (!name) errors.push("name_en: required for a new school");
    if (!row.partial.city_id && !errors.some((e) => e.startsWith("city:"))) errors.push("city: required for a new school");
    if (!row.partial.school_type && !errors.some((e) => e.startsWith("school_type:"))) errors.push("school_type: required for a new school");
  }

  const start = base ?? ({ ...structuredClone(EMPTY_SCHOOL), status: defaults.status, data_status: defaults.dataStatus, education_systems: [], languages: [] } as SchoolFormValues);
  const merged = overlay(start, { ...row.partial, ...(creating && !row.partial.slug ? { slug: row.slug } : {}) });

  if (creating) {
    if (!row.partial.grade_from && !row.partial.grade_to) warnings.push("grades not given: using 1 to 11");
    if (!row.partial.education_systems) {
      merged.education_systems = ["national"];
      warnings.push("education_systems not given: using “national”");
    }
    if (!row.partial.languages) warnings.push("languages not given");
  }

  const place = merged.location;
  const hasCoordinates = Boolean(place && place.lat !== "" && place.lng !== "" && place.lat != null && place.lng != null);
  const hasPlace = Boolean(place && (place.lat !== "" || place.lng !== "" || (place.district ?? "") !== "" || Object.values(place.address ?? {}).some(Boolean)));
  if (!hasCoordinates) warnings.push("no coordinates: the school will not appear on the map");
  if (!merged.phone && !merged.email && !merged.whatsapp) warnings.push("no phone, email or WhatsApp: parents cannot contact the school from its page");
  if (creating && !merged.name.ru && !merged.name.kg) warnings.push("name_ru and name_kg empty: Russian and Kyrgyz visitors will see the English name");
  if (merged.fee_min === "" || merged.fee_min == null) warnings.push("no fee given: the page will say “on request”");

  const payload = {
    ...merged,
    id: base?.id ?? null,
    location: hasPlace ? merged.location : null,
  } as Record<string, unknown>;

  const parsed = schoolPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const column = columnFor(issue.path as (string | number)[]);
      const text = `${column}: ${issue.message}`;
      if (!errors.includes(text) && !errors.some((e) => e.startsWith(`${column}:`))) errors.push(text);
    }
  }
  return { payload: errors.length ? null : payload, errors, warnings };
}

/** Which fields a spreadsheet row would change on an existing school. */
export function changedFields(base: SchoolFormValues, merged: SchoolFormValues): string[] {
  const a = base as unknown as Record<string, unknown>;
  const b = merged as unknown as Record<string, unknown>;
  const norm1 = (v: unknown) => JSON.stringify(v ?? "", (_k, x) => (typeof x === "number" ? String(x) : x === null ? "" : x));
  return Object.keys(b).filter((k) => k !== "id" && norm1(a[k]) !== norm1(b[k]));
}

/* ------------------------------------------------------------------------------------------------
 * Reading a whole file
 * ---------------------------------------------------------------------------------------------- */

export const MAX_ROWS = 300;
export const MAX_BYTES = 2_000_000;

export function readTable(rows: string[][]): { header: string[]; ignored: string[]; records: { line: number; cells: Record<string, string> }[]; error?: string } {
  const [head, ...rest] = rows;
  if (!head) return { header: [], ignored: [], records: [], error: "The file is empty." };
  const header = head.map(normalizeHeader);
  const known = new Set(COLUMN_KEYS);
  const ignored = header.filter((h) => h && !known.has(h) && !h.startsWith("tuition_notes_"));
  if (!header.includes("name_en") && !header.includes("slug")) {
    return { header, ignored, records: [], error: "The first row must contain column names such as name_en and city. Download the template to see them." };
  }
  if (rest.length > MAX_ROWS) return { header, ignored, records: [], error: `A file can hold at most ${MAX_ROWS} schools; this one has ${rest.length}. Split it into several files.` };
  const records = rest.map((cells, i) => ({
    line: i + 2,
    cells: Object.fromEntries(header.map((h, idx) => [h, cells[idx] ?? ""]).filter(([h]) => h)) as Record<string, string>,
  }));
  return { header, ignored, records };
}

/* ------------------------------------------------------------------------------------------------
 * Writing schools back out (export and template)
 * ---------------------------------------------------------------------------------------------- */

const keyList = (items: string[]) => items.join("; ");

export function formToRecord(v: SchoolFormValues, lookups: Lookups): Record<string, string> {
  const str = (x: unknown) => (x == null ? "" : String(x));
  const city = lookups.cities.find((c) => c.id === v.city_id);
  const loc = v.location;
  const feeItem = (f: SchoolFormValues["fee_items"][number]) =>
    f.included ? `${f.item_key}:included` : f.extra_amount !== "" && f.extra_period ? `${f.item_key}:${f.extra_amount}/${f.extra_period}` : `${f.item_key}:paid`;
  return {
    slug: v.slug, name_en: str(v.name.en), name_ru: str(v.name.ru), name_kg: str(v.name.kg),
    tagline_en: str(v.tagline.en), tagline_ru: str(v.tagline.ru), tagline_kg: str(v.tagline.kg),
    about_en: str(v.about.en), about_ru: str(v.about.ru), about_kg: str(v.about.kg),
    city: city?.key ?? "", school_type: v.school_type, district: str(loc?.district),
    address_en: str(loc?.address.en), address_ru: str(loc?.address.ru), address_kg: str(loc?.address.kg),
    lat: str(loc?.lat), lng: str(loc?.lng),
    education_systems: keyList(v.education_systems), grade_from: str(v.grade_from), grade_to: str(v.grade_to),
    languages: keyList([...v.languages].sort((a, b) => Number(b.is_primary) - Number(a.is_primary)).map((l) => l.code)),
    founded_year: str(v.founded_year), student_count: str(v.student_count), teacher_count: str(v.teacher_count), avg_class_size: str(v.avg_class_size),
    facilities: keyList(v.facilities.map((f) => f.facility_key)),
    opening_time: v.opening_time, closing_time: v.closing_time, working_days: daysToText(v.working_days),
    fee_min: str(v.fee_min), fee_max: str(v.fee_max), fee_period: v.fee_period, fee_billing_months: str(v.fee_billing_months),
    fee_items: keyList(v.fee_items.map(feeItem)),
    has_scholarships: v.has_scholarships ? "yes" : "no", has_transportation: v.has_transportation ? "yes" : "no", has_boarding: v.has_boarding ? "yes" : "no",
    phone: v.phone, whatsapp: v.whatsapp, email: v.email, website: v.website,
    facebook: str(v.social.facebook), instagram: str(v.social.instagram), telegram: str(v.social.telegram), youtube: str(v.social.youtube), tiktok: str(v.social.tiktok),
    logo_url: v.logo_url, cover_url: v.cover_url, plan: v.plan, status: v.status, data_status: v.data_status,
  };
}

export const headerRow = () => COLUMN_KEYS;
export const recordToRow = (r: Record<string, string>) => COLUMN_KEYS.map((k) => r[k] ?? "");
export const exampleRows = (): string[][] => [COLUMNS.map((c) => c.example1), COLUMNS.map((c) => c.example2)];
