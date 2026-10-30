/** How each demo school bills its tuition and what the fee covers. Schools not listed bill monthly over 9 months and state nothing else. */
export type ExtraCost = [amount: number, period: "one_time" | "year" | "month"];
export type FeePlan = {
  period: "month" | "quarter" | "year";
  months: number;
  /** "included" = covered by the tuition, [amount, period] = paid separately, null = paid separately with no price stated. */
  items: Record<string, "included" | ExtraCost | null>;
};

export const FEE_PLANS: Record<string, FeePlan> = {
  "ala-too-international-school": { period: "year", months: 10, items: { meals: "included", books: "included", stationery: "included", clubs: "included", uniform: [6500, "one_time"], transport: [4500, "month"], exams: [12000, "year"] } },
  "silk-road-lyceum": { period: "month", months: 9, items: { books: "included", meals: [3500, "month"], uniform: [4000, "year"], clubs: "included" } },
  "tengri-stem-gymnasium": { period: "quarter", months: 9, items: { clubs: "included", books: "included", meals: "included", uniform: [5000, "one_time"] } },
  "bilim-secondary-school": { period: "month", months: 9, items: { books: "included", meals: [1200, "month"], uniform: [3000, "year"] } },
  "aigul-montessori-school": { period: "month", months: 10, items: { meals: "included", stationery: "included", uniform: null } },
  "mountain-star-waldorf-school": { period: "year", months: 9, items: { books: "included", stationery: "included", meals: [2800, "month"] } },
  "capital-turkish-kyrgyz-lyceum": { period: "month", months: 10, items: { meals: "included", uniform: [5500, "one_time"], transport: [3000, "month"], books: "included" } },
  "neva-russian-school": { period: "quarter", months: 9, items: { books: "included", clubs: [1500, "month"], uniform: [3800, "year"] } },
  "onor-arts-school": { period: "month", months: 9, items: { clubs: "included", stationery: [2500, "year"] } },
  "sunrise-american-academy": { period: "year", months: 10, items: { transport: "included", meals: "included", books: "included", exams: [18000, "year"], uniform: [8000, "one_time"] } },
  "fergana-gate-lyceum": { period: "month", months: 9, items: { books: "included", meals: [2200, "month"], uniform: [3500, "one_time"] } },
  "osh-bright-future-school": { period: "quarter", months: 9, items: { stationery: "included", transport: [1800, "month"] } },
  "alay-public-gymnasium": { period: "month", months: 9, items: { books: "included", meals: [1000, "month"] } },
  "southern-cambridge-school": { period: "year", months: 10, items: { exams: [15000, "year"], books: "included", meals: "included", uniform: [6000, "one_time"] } },
  "kara-alma-lyceum": { period: "month", months: 9, items: { books: "included", clubs: "included", meals: [2000, "month"] } },
  "walnut-grove-international-school": { period: "year", months: 10, items: { meals: "included", transport: "included", books: "included", stationery: "included", uniform: [7000, "one_time"], exams: [14000, "year"] } },
  "issyk-kul-lake-lyceum": { period: "month", months: 9, items: { meals: [2400, "month"], books: "included" } },
  "chu-valley-lyceum": { period: "quarter", months: 9, items: { meals: "included", uniform: [3500, "year"] } },
};

/** Demo school days: public schools run a six-day week in the morning, private and international schools five longer days. */
export function hoursFor(type: string, slug: string) {
  if (slug === "aigul-montessori-school") return { opening_time: "08:00", closing_time: "17:30", working_days: [1, 2, 3, 4, 5] };
  if (type === "public") return { opening_time: "08:00", closing_time: "13:30", working_days: [1, 2, 3, 4, 5, 6] };
  if (type === "international") return { opening_time: "08:15", closing_time: "15:45", working_days: [1, 2, 3, 4, 5] };
  if (type === "specialized") return { opening_time: "08:30", closing_time: "14:30", working_days: [1, 2, 3, 4, 5, 6] };
  return { opening_time: "08:30", closing_time: "15:30", working_days: slug.length % 3 === 0 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5] };
}

export function feeFor(slug: string, tuition: [number, number]) {
  const plan = FEE_PLANS[slug];
  const months = plan?.months ?? 9;
  const period = plan?.period ?? "month";
  const perYear = period === "month" ? months : period === "quarter" ? 4 : 1;
  const amount = (monthly: number) => Math.round((monthly * months) / perYear / 100) * 100;
  return { fee_period: period, fee_billing_months: months, fee_min: period === "month" ? tuition[0] : amount(tuition[0]), fee_max: period === "month" ? tuition[1] : amount(tuition[1]), items: plan?.items ?? {} };
}
