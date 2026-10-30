import type { Lang } from "@/lib/i18n/config";

export type Schedule = { opening_time: string | null; closing_time: string | null; working_days: number[] };

/** "08:30:00" -> "08:30" */
export const clock = (time: string | null) => (time ? time.slice(0, 5) : null);

const DAYS: Record<Lang, { short: string[]; long: string[] }> = {
  kg: {
    short: ["дүй.", "шейш.", "шарш.", "бейш.", "жума", "ишм.", "жек."],
    long: ["дүйшөмбү", "шейшемби", "шаршемби", "бейшемби", "жума", "ишемби", "жекшемби"],
  },
  ru: {
    short: ["пн", "вт", "ср", "чт", "пт", "сб", "вс"],
    long: ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"],
  },
  en: {
    short: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    long: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  },
};

/** ISO weekday (1 = Monday ... 7 = Sunday) in the visitor's language. A fixed table, so the server and every browser write the same text. */
export function dayName(day: number, lang: Lang, style: "short" | "long" = "short") {
  return DAYS[lang][style][day - 1] ?? "";
}

/** Runs of three or more consecutive days collapse to a range: "Mon–Fri". Otherwise the days are listed. */
export function formatDays(days: number[], lang: Lang): string | null {
  const sorted = [...new Set(days)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j]! + 1) j += 1;
    const run = j - i + 1;
    parts.push(run >= 3 ? `${dayName(sorted[i]!, lang)}–${dayName(sorted[j]!, lang)}` : sorted.slice(i, j + 1).map((d) => dayName(d, lang)).join(", "));
    i = j + 1;
  }
  return parts.join(", ");
}

export function formatHours(s: Pick<Schedule, "opening_time" | "closing_time">): string | null {
  const open = clock(s.opening_time);
  const close = clock(s.closing_time);
  if (open && close) return `${open}–${close}`;
  return open ?? close;
}

/** "08:30–15:30 · Mon–Fri", or null when the school has not given a schedule. */
export function formatSchedule(s: Schedule, lang: Lang): string | null {
  const parts = [formatHours(s), formatDays(s.working_days, lang)].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
