import type { Lang } from "./config";

/*
 * Numbers and dates are written by fixed rules, not by Intl for the visitor's locale. The server (Node) and each browser ship
 * different language data, and for Kyrgyz they disagree ("7 000" against "7,000"), which makes React rebuild the page on load.
 * The English locale's digits and parts are the same everywhere, so only those are taken from Intl.
 */

const GROUP: Record<Lang, string> = { kg: "\u00a0", ru: "\u00a0", en: "," };
const DECIMAL: Record<Lang, string> = { kg: ",", ru: ",", en: "." };

export function formatNumber(value: number, lang: Lang): string {
  const digits = new Intl.NumberFormat("en-US", { useGrouping: false, maximumFractionDigits: 3 }).format(value);
  const negative = digits.startsWith("-");
  const [whole = "0", fraction] = digits.replace("-", "").split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP[lang]);
  return `${negative ? "-" : ""}${grouped}${fraction ? DECIMAL[lang] + fraction : ""}`;
}

const MONTHS: Record<Lang, { long: string[]; short: string[] }> = {
  kg: {
    long: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
    short: ["янв.", "фев.", "мар.", "апр.", "май", "июн.", "июл.", "авг.", "сен.", "окт.", "ноя.", "дек."],
  },
  ru: {
    long: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
    short: ["янв.", "февр.", "мар.", "апр.", "мая", "июн.", "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."],
  },
  en: {
    long: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
};

const BISHKEK_PARTS = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Bishkek" });

export function formatDate(value: string | Date, lang: Lang, style: "short" | "long" = "long"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const part = (type: string) => Number(BISHKEK_PARTS.formatToParts(date).find((p) => p.type === type)?.value);
  const [year, day] = [part("year"), part("day")];
  const month = MONTHS[lang][style][part("month") - 1] ?? "";
  if (lang === "kg") return style === "long" ? `${year}-ж., ${day}-${month}` : `${year}-ж. ${day}-${month}`;
  if (lang === "ru") return `${day} ${month} ${year} г.`;
  return `${month} ${day}, ${year}`;
}

/** "12 000" style group separator is locale driven; currency is always Kyrgyz som. */
export function formatTuition(
  min: number | null,
  max: number | null,
  lang: Lang,
  labels: { currency: string; perMonth: string; free: string; onRequest: string }
): string {
  if (min == null && max == null) return labels.onRequest;
  if ((max ?? min) === 0) return labels.free;
  const low = min ?? max!;
  const high = max ?? min!;
  const range = low === high ? formatNumber(low, lang) : `${formatNumber(low, lang)} – ${formatNumber(high, lang)}`;
  return `${range} ${labels.currency} ${labels.perMonth}`;
}
