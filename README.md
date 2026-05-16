# @earndrift/ten99

> Year-aware IRS **1099-NEC threshold checker** for JavaScript & TypeScript. Handles the **OBBBA** ([Pub. L. 119-21](https://www.congress.gov/bill/119th-congress/house-bill/1)) jump from **$600 → $2,000** for tax year 2026 and later. Zero dependencies.

[![npm version](https://img.shields.io/npm/v/@earndrift/ten99.svg)](https://www.npmjs.com/package/@earndrift/ten99)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Brought to you by **[EarnDrift — 1099 payroll for businesses](https://earndrift.com)**.

---

## Why this exists

For 70 years the IRS 1099-NEC reporting threshold was **$600**. The One Big Beautiful Bill Act ([signed July 4, 2025](https://earndrift.com/law-changes)) raised it to **$2,000** for payments made on or after **January 1, 2026**, with inflation indexing starting in 2027.

That sounds simple, but in practice you can't just hardcode `2000`. During Q1 of any year, businesses are still filing for the **prior** tax year under the **prior** threshold. A payment dated Dec 31 2025 still gets a 1099 at $600; the same payment dated Jan 1 2026 doesn't until it hits $2,000. Get it wrong and you either over-file (annoying) or under-file (penalties).

This package gives you a single function: **pass the payment year, get the right threshold.**

## Install

```bash
npm install @earndrift/ten99
# or
pnpm add @earndrift/ten99
# or
yarn add @earndrift/ten99
```

## Usage

```ts
import {
  getThresholdForYear,
  getThresholdCentsForYear,
  getApproachingForYear,
  classifyTotal,
  isOverThreshold,
} from '@earndrift/ten99';

getThresholdForYear(2025);          // 600
getThresholdForYear(2026);          // 2000
getThresholdCentsForYear(2026);     // 200000  (for amount_cents columns)
getApproachingForYear(2026);        // 1500    (75% of threshold)

isOverThreshold(1999, 2026);        // false
isOverThreshold(2000, 2026);        // true

classifyTotal(1850, 2026);
// {
//   status: 'approaching',   // 'safe' | 'approaching' | 'over'
//   threshold: 2000,
//   pct: 0.925,
// }
```

### CLI

```bash
npx @earndrift/ten99 threshold --year 2026
# → $2,000 (tax year 2026)

npx @earndrift/ten99 check --year 2026 --amount 1850
# → APPROACHING — $1,850 is 92.5% of the $2,000 threshold for tax year 2026.

npx @earndrift/ten99 check --year 2025 --amount 750
# → OVER — $750 ≥ $600 (125.0%). 1099-NEC required for tax year 2025.
```

## API

| Function | Returns | Notes |
| --- | --- | --- |
| `getThresholdForYear(year)` | `number` (dollars) | `$600` for ≤ 2025, `$2,000` for ≥ 2026 |
| `getThresholdCentsForYear(year)` | `number` (cents) | For columns stored as `amount_cents` |
| `getApproachingForYear(year)` | `number` (dollars) | 75% of the year's threshold |
| `getApproachingCentsForYear(year)` | `number` (cents) | 75% of the year's threshold, in cents |
| `formatThresholdLabel(year)` | `string` | `"$600"` or `"$2,000"` for UI copy |
| `getCurrentTaxYear(now?)` | `number` | Resolved in `America/New_York` to avoid Dec 31 / Jan 1 drift |
| `classifyTotal(dollars, year)` | `{ status, threshold, pct }` | `status`: `'safe' \| 'approaching' \| 'over'` |
| `isOverThreshold(dollars, year)` | `boolean` | `true` once `dollars ≥ threshold` |
| `centsToDollars(cents)` | `number` | Trivial helper |

### Constants

- `OBBBA_EFFECTIVE_YEAR` — `2026`
- `LEGACY_THRESHOLD_DOLLARS` — `600`
- `OBBBA_THRESHOLD_DOLLARS` — `2000`
- `APPROACHING_PCT` — `0.75`

## A few things to know

- **Pass the *payment year*, not `new Date().getFullYear()`.** A payment made Dec 28 2025 is a tax year 2025 payment ($600 threshold) even if you're calculating it in February 2026.
- **2027+ holds at $2,000** until the IRS publishes the indexed figure each year via Rev. Proc. We'll bump this package when the official numbers land.
- **No network calls, no telemetry, no auth.** Pure local math.

## About EarnDrift

This package was extracted from the production codebase of **[EarnDrift](https://earndrift.com)** — payroll-style payments and automated 1099 filing for businesses that pay contractors. EarnDrift handles the whole thing end to end: ACH payments, W-9 collection, year-round threshold tracking, and 1099-NEC filing.

If you're a business with contractors, the [**1099 threshold checker for 2026**](https://earndrift.com/seo/what-is-the-1099-threshold-for-2026) and the [**state-by-state 1099 rules**](https://earndrift.com/state-1099-checker) on earndrift.com are the fastest way to see whether you need to file. The full app handles it for you automatically.

For the legislative context behind the $600 → $2,000 jump, see our [**OBBBA law-changes tracker**](https://earndrift.com/law-changes).

## License

[MIT](./LICENSE) © EarnDrift
