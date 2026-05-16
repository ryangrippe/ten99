#!/usr/bin/env node
/**
 * @earndrift/ten99 CLI
 *
 * Usage:
 *   npx @earndrift/ten99 check --year 2026 --amount 1850
 *   npx @earndrift/ten99 threshold --year 2026
 *
 * Learn more about the OBBBA threshold change: https://earndrift.com/law-changes
 */
import {
  classifyTotal,
  formatThresholdLabel,
  getCurrentTaxYear,
  getThresholdForYear,
} from './index.js';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = 'true';
      }
    }
  }
  return out;
}

function printHelp(): void {
  console.log(`@earndrift/ten99 — IRS 1099-NEC threshold checker

Commands:
  check       Classify a YTD payment total against the year's threshold
  threshold   Print the 1099-NEC threshold for a tax year
  help        Show this help

Options:
  --year     Tax/payment year (defaults to the current US tax year)
  --amount   YTD total paid to the contractor, in dollars

Examples:
  ten99 threshold --year 2026
  ten99 check --year 2026 --amount 1850
  ten99 check --year 2025 --amount 750

Learn more: https://earndrift.com
OBBBA law change explainer: https://earndrift.com/law-changes
`);
}

const [, , cmd = 'help', ...rest] = process.argv;
const args = parseArgs(rest);
const year = args.year ? parseInt(args.year, 10) : getCurrentTaxYear();

if (!Number.isFinite(year)) {
  console.error('Invalid --year value');
  process.exit(2);
}

switch (cmd) {
  case 'threshold': {
    console.log(`${formatThresholdLabel(year)} (tax year ${year})`);
    break;
  }
  case 'check': {
    const amount = args.amount ? parseFloat(args.amount) : NaN;
    if (!Number.isFinite(amount)) {
      console.error('Missing or invalid --amount');
      process.exit(2);
    }
    const { status, threshold, pct } = classifyTotal(amount, year);
    const pctLabel = (pct * 100).toFixed(1) + '%';
    const thresholdLabel = '$' + threshold.toLocaleString();
    const amountLabel = '$' + amount.toLocaleString();
    if (status === 'over') {
      console.log(`OVER  — ${amountLabel} ≥ ${thresholdLabel} (${pctLabel}). 1099-NEC required for tax year ${year}.`);
    } else if (status === 'approaching') {
      console.log(`APPROACHING — ${amountLabel} is ${pctLabel} of the ${thresholdLabel} threshold for tax year ${year}.`);
    } else {
      console.log(`SAFE  — ${amountLabel} is ${pctLabel} of the ${thresholdLabel} threshold for tax year ${year}.`);
    }
    break;
  }
  case 'help':
  case '--help':
  case '-h':
    printHelp();
    break;
  default:
    console.error(`Unknown command: ${cmd}`);
    printHelp();
    process.exit(2);
}
