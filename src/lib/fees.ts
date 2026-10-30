import type { Lang } from "@/lib/i18n/config";
import { formatNumber } from "@/lib/i18n/format";

export const FEE_PERIODS = ["month", "quarter", "year"] as const;
export type FeePeriod = (typeof FEE_PERIODS)[number];
export const EXTRA_PERIODS = ["one_time", "year", "month"] as const;
export type ExtraPeriod = (typeof EXTRA_PERIODS)[number];
export const BILLING_MONTHS = [9, 10, 11, 12] as const;
export const DEFAULT_BILLING_MONTHS = 9;

export type FeeData = {
  fee_min: number | null;
  fee_max: number | null;
  fee_period: FeePeriod;
  fee_billing_months: number;
  tuition_min: number | null;
  tuition_max: number | null;
};

export type FeeItemRow = { item_key: string; included: boolean; extra_amount: number | null; extra_period: ExtraPeriod | null };

/** How many billing periods fall in one school year. */
export const periodsPerYear = (period: FeePeriod, billingMonths: number) => (period === "month" ? billingMonths : period === "quarter" ? 4 : 1);

/** Estimated cost of one school year, from the school's own fee. */
export function yearlyEstimate(amount: number | null, period: FeePeriod, billingMonths: number): number | null {
  return amount == null ? null : Math.round(amount * periodsPerYear(period, billingMonths));
}

type Labels = { currency: string; perMonth: string; perQuarter: string; perYear: string; free: string; onRequest: string };

const periodLabel = (period: FeePeriod, l: Labels) => (period === "month" ? l.perMonth : period === "quarter" ? l.perQuarter : l.perYear);

function range(min: number | null, max: number | null, lang: Lang) {
  const low = min ?? max!;
  const high = max ?? min!;
  return low === high ? formatNumber(low, lang) : `${formatNumber(low, lang)} – ${formatNumber(high, lang)}`;
}

/** The fee as the school states it, e.g. "480 000 – 560 000 KGS / year". */
export function formatFee(fee: Pick<FeeData, "fee_min" | "fee_max" | "fee_period">, lang: Lang, l: Labels): string {
  if (fee.fee_min == null && fee.fee_max == null) return l.onRequest;
  if ((fee.fee_max ?? fee.fee_min) === 0) return l.free;
  return `${range(fee.fee_min, fee.fee_max, lang)} ${l.currency} ${periodLabel(fee.fee_period, l)}`;
}

/** Monthly equivalent, only when the school does not already bill monthly. */
export function formatMonthlyEquivalent(fee: FeeData, lang: Lang, l: Labels): string | null {
  if (fee.fee_period === "month" || (fee.tuition_min == null && fee.tuition_max == null) || (fee.tuition_max ?? fee.tuition_min) === 0) return null;
  return `≈ ${range(fee.tuition_min, fee.tuition_max, lang)} ${l.currency} ${l.perMonth}`;
}

export function formatYearlyEstimate(fee: FeeData, lang: Lang, l: Labels): string | null {
  const low = yearlyEstimate(fee.fee_min, fee.fee_period, fee.fee_billing_months);
  const high = yearlyEstimate(fee.fee_max, fee.fee_period, fee.fee_billing_months);
  if ((low == null && high == null) || (high ?? low) === 0) return null;
  return `≈ ${range(low, high, lang)} ${l.currency} ${l.perYear}`;
}

/** "15 000 KGS one-time" style label for a separately paid item. */
export function formatExtra(item: FeeItemRow, lang: Lang, l: Labels & { oneTime: string }): string | null {
  if (item.extra_amount == null || item.extra_period == null) return null;
  const when = item.extra_period === "one_time" ? l.oneTime : item.extra_period === "year" ? l.perYear : l.perMonth;
  return `${formatNumber(item.extra_amount, lang)} ${l.currency} ${when}`;
}

/** Pulls the labels the fee formatters need out of a dictionary. */
export function feeLabels(dict: { common: { currency: string; perMonth: string; perQuarter: string; perYear: string; free: string; onRequest: string; oneTime: string } }) {
  const { currency, perMonth, perQuarter, perYear, free, onRequest, oneTime } = dict.common;
  return { currency, perMonth, perQuarter, perYear, free, onRequest, oneTime };
}
