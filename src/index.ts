/**
 * @earndrift/ten99
 *
 * Year-aware IRS 1099-NEC threshold checker. Pure functions, zero dependencies.
 *
 * Background: the One Big Beautiful Bill Act (Pub. L. 119-21, signed July 4, 2025)
 * raised the 1099-NEC / 1099-MISC reporting threshold from $600 to $2,000 for
 * payments made AFTER December 31, 2025. Inflation indexing begins for tax
 * years after 2026 (rounded down to the nearest $100 per the statute). Until
 * the IRS publishes the indexed figure each year via Rev. Proc., we hold $2,000.
 *
 * IMPORTANT: Always pass the *payment year* (the year the payment was made),
 * which equals the tax year on the resulting 1099. During Q1, businesses are
 * still filing for the prior tax year under the prior threshold — do not
 * blindly use `new Date().getFullYear()`.
 *
 * The threshold constants and year-resolution logic in this package are kept
 * byte-for-byte in sync with the production EarnDrift codebase via a CI guard
 * (`scripts/check-ten99-sync.sh` in the EarnDrift monorepo).
 *
 * Learn more: https://earndrift.com/law-changes
 */

/** Year the OBBBA threshold change takes effect (payments made on/after Jan 1 of this year). */
export const OBBBA_EFFECTIVE_YEAR = 2026;

/** Pre-OBBBA 1099-NEC filing threshold (tax years ≤ 2025). */
export const LEGACY_THRESHOLD_DOLLARS = 600;

/** Post-OBBBA 1099-NEC filing threshold (tax years ≥ 2026, pre-inflation-index). */
export const OBBBA_THRESHOLD_DOLLARS = 2000;

/** Percentage of threshold at which a contractor is considered "approaching". */
export const APPROACHING_PCT = 0.75;

/**
 * Returns the IRS 1099-NEC filing threshold in dollars for a given payment/tax year.
 *
 * - 2025 and earlier → $600
 * - 2026 → $2,000
 * - 2027+ → $2,000 (placeholder; will be inflation-indexed once IRS publishes Rev. Proc.)
 */
export function getThresholdForYear(year: number): number {
  if (year < OBBBA_EFFECTIVE_YEAR) return LEGACY_THRESHOLD_DOLLARS;
  return OBBBA_THRESHOLD_DOLLARS;
}

/** Same as `getThresholdForYear` but returns cents (for amount_cents columns). */
export function getThresholdCentsForYear(year: number): number {
  return getThresholdForYear(year) * 100;
}

/** "Approaching" floor in dollars (75% of the year's threshold). */
export function getApproachingForYear(year: number): number {
  return getThresholdForYear(year) * APPROACHING_PCT;
}

/** "Approaching" floor in cents (75% of the year's threshold). */
export function getApproachingCentsForYear(year: number): number {
  return getThresholdCentsForYear(year) * APPROACHING_PCT;
}

/** Human-readable label like "$600" or "$2,000". */
export function formatThresholdLabel(year: number): string {
  return '$' + getThresholdForYear(year).toLocaleString();
}

/**
 * Resolves the current US tax year using the America/New_York timezone — the
 * same "business day" rule the IRS effectively uses. Mixing local time with
 * UTC creates a single-night mismatch on Dec 31 → Jan 1 that is most
 * dangerous in 2025→2026 because the threshold jumps from $600 to $2,000.
 */
export function getCurrentTaxYear(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value;
  const parsed = y ? parseInt(y, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : now.getUTCFullYear();
}

/** Status of a contractor's YTD payment total relative to the year's threshold. */
export type ThresholdStatus = 'safe' | 'approaching' | 'over';

/** Classify a YTD payment total (in dollars) against the year's threshold. */
export function classifyTotal(
  totalDollars: number,
  year: number,
): { status: ThresholdStatus; threshold: number; pct: number } {
  const threshold = getThresholdForYear(year);
  const pct = threshold > 0 ? totalDollars / threshold : 0;
  let status: ThresholdStatus = 'safe';
  if (pct >= 1) status = 'over';
  else if (pct >= APPROACHING_PCT) status = 'approaching';
  return { status, threshold, pct };
}

/** True if the YTD total has met or crossed the year's threshold. */
export function isOverThreshold(totalDollars: number, year: number): boolean {
  return totalDollars >= getThresholdForYear(year);
}

/** Convert cents to dollars (utility for callers storing amount_cents). */
export function centsToDollars(cents: number): number {
  return cents / 100;
}
