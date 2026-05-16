// Minimal smoke tests — run with `node --test`.
// These import from the built ./dist output, so run `npm run build` first
// (the `prepublishOnly` script handles that automatically before publish).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getThresholdForYear,
  getThresholdCentsForYear,
  getApproachingForYear,
  getApproachingCentsForYear,
  classifyTotal,
  isOverThreshold,
  OBBBA_EFFECTIVE_YEAR,
} from '../dist/index.js';

test('legacy threshold for 2025 and earlier', () => {
  assert.equal(getThresholdForYear(2025), 600);
  assert.equal(getThresholdForYear(2020), 600);
  assert.equal(getThresholdCentsForYear(2025), 60000);
});

test('OBBBA threshold for 2026+', () => {
  assert.equal(getThresholdForYear(2026), 2000);
  assert.equal(getThresholdForYear(2030), 2000);
  assert.equal(getThresholdCentsForYear(2026), 200000);
});

test('approaching floor is 75% of threshold', () => {
  assert.equal(getApproachingForYear(2025), 450);
  assert.equal(getApproachingForYear(2026), 1500);
  assert.equal(getApproachingCentsForYear(2026), 150000);
});

test('classifyTotal returns correct status', () => {
  assert.equal(classifyTotal(100, 2026).status, 'safe');
  assert.equal(classifyTotal(1500, 2026).status, 'approaching');
  assert.equal(classifyTotal(2000, 2026).status, 'over');
  assert.equal(classifyTotal(500, 2025).status, 'over');
});

test('isOverThreshold', () => {
  assert.equal(isOverThreshold(599, 2025), false);
  assert.equal(isOverThreshold(600, 2025), true);
  assert.equal(isOverThreshold(1999, 2026), false);
  assert.equal(isOverThreshold(2000, 2026), true);
});

test('OBBBA effective year constant', () => {
  assert.equal(OBBBA_EFFECTIVE_YEAR, 2026);
});
