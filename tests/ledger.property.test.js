'use strict';

/* Property-based tests for the Dead Ledger core (spec task 7).
   Zero dependencies: a seeded PRNG (mulberry32) makes every failure
   reproducible from its seed. The property set was drafted in a Kiro CLI
   session against .kiro/specs/dead-ledger (requirements 2, 3, 6, 7) and
   is verified here with node:test. */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createEntry, computeTotals, computeDailyTotals, markSettled,
  filterEntries, formatRupiah, parseAmount,
} = require('../app.js');

function makePrng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DATES = ['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12'];
const PEOPLE = ['Bu Sari', 'Pak Dedi', 'Bu Rina', 'Mas Joko', ''];
const TYPES = ['income', 'expense', 'receivable'];

function pick(rand, arr) { return arr[Math.floor(rand() * arr.length)]; }
function randAmount(rand) { return (1 + Math.floor(rand() * 10000)) * 500; }

function makeEntries(rand) {
  const n = Math.floor(rand() * 13); // 0..12 entries
  const out = [];
  for (let i = 0; i < n; i++) {
    const type = pick(rand, TYPES);
    out.push(createEntry({
      type,
      person: type === 'receivable' ? pick(rand, PEOPLE.slice(0, 4)) : pick(rand, PEOPLE),
      description: 'entry-' + i,
      amount: randAmount(rand),
      date: pick(rand, DATES),
      dueDate: type === 'receivable' && rand() < 0.7 ? pick(rand, DATES) : undefined,
    }));
  }
  return out;
}

function randomlySettle(rand, entries) {
  let out = entries;
  for (const e of entries) {
    if (e.type === 'receivable' && rand() < 0.4) out = markSettled(out, e.id);
  }
  return out;
}

test('property: balance always equals moneyIn - moneyOut (300 sets)', () => {
  const rand = makePrng(0x1a2b3c4d);
  for (let i = 0; i < 300; i++) {
    const entries = randomlySettle(rand, makeEntries(rand));
    const t = computeTotals(entries);
    assert.equal(t.balance, t.moneyIn - t.moneyOut, `Iter ${i}`);
  }
});

test('property: stillOwed is exactly the unsettled receivables (300 sets)', () => {
  const rand = makePrng(0x2b3c4d5e);
  for (let i = 0; i < 300; i++) {
    const entries = randomlySettle(rand, makeEntries(rand));
    const t = computeTotals(entries);
    const owed = entries.filter((e) => e.type === 'receivable' && !e.settled)
      .reduce((s, e) => s + e.amount, 0);
    const settledSum = entries.filter((e) => e.type === 'receivable' && e.settled)
      .reduce((s, e) => s + e.amount, 0);
    const incomeSum = entries.filter((e) => e.type === 'income')
      .reduce((s, e) => s + e.amount, 0);
    assert.equal(t.stillOwed, owed, `Iter ${i}: stillOwed`);
    assert.equal(t.moneyIn, incomeSum + settledSum, `Iter ${i}: moneyIn`);
  }
});

test('property: settling never increases stillOwed, never decreases moneyIn (300 sets)', () => {
  const rand = makePrng(0x3c4d5e6f);
  for (let i = 0; i < 300; i++) {
    const entries = randomlySettle(rand, makeEntries(rand));
    const before = computeTotals(entries);
    const target = entries.find((e) => e.type === 'receivable' && !e.settled);
    if (!target) continue;
    const after = computeTotals(markSettled(entries, target.id));
    assert.ok(after.stillOwed <= before.stillOwed, `Iter ${i}: stillOwed grew`);
    assert.ok(after.moneyIn >= before.moneyIn, `Iter ${i}: moneyIn shrank`);
    assert.equal(before.stillOwed - after.stillOwed, target.amount, `Iter ${i}: owed delta`);
    assert.equal(after.moneyIn - before.moneyIn, target.amount, `Iter ${i}: in delta`);
  }
});

test('property: settling twice is idempotent (300 sets)', () => {
  const rand = makePrng(0x4d5e6f70);
  for (let i = 0; i < 300; i++) {
    const entries = makeEntries(rand);
    const target = entries.find((e) => e.type === 'receivable');
    if (!target) continue;
    const once = markSettled(entries, target.id);
    const twice = markSettled(once, target.id);
    assert.deepEqual(computeTotals(twice), computeTotals(once), `Iter ${i}`);
  }
});

test('property: filters are consistent with totals (300 sets)', () => {
  const rand = makePrng(0x5e6f7081);
  const sum = (arr) => arr.reduce((s, e) => s + e.amount, 0);
  for (let i = 0; i < 300; i++) {
    const entries = randomlySettle(rand, makeEntries(rand));
    const t = computeTotals(entries);
    assert.equal(sum(filterEntries(entries, 'income')), t.moneyIn, `Iter ${i}: income filter`);
    assert.equal(sum(filterEntries(entries, 'expense')), t.moneyOut, `Iter ${i}: expense filter`);
    assert.equal(sum(filterEntries(entries, 'owed')), t.stillOwed, `Iter ${i}: owed filter`);
    assert.equal(filterEntries(entries, 'all').length, entries.length, `Iter ${i}: all filter`);
  }
});

test('property: computeDailyTotals matches computeTotals restricted to date (300 sets)', () => {
  const rand = makePrng(0xabcd9876);
  for (let i = 0; i < 300; i++) {
    const entries = randomlySettle(rand, makeEntries(rand));
    const dateStr = pick(rand, DATES);
    const daily = computeDailyTotals(entries, dateStr);
    const restricted = computeTotals(entries.filter((e) => e.date === dateStr));
    assert.equal(daily.moneyIn, restricted.moneyIn, `Iter ${i} [${dateStr}]: moneyIn`);
    assert.equal(daily.moneyOut, restricted.moneyOut, `Iter ${i} [${dateStr}]: moneyOut`);
    assert.equal(daily.net, restricted.moneyIn - restricted.moneyOut, `Iter ${i} [${dateStr}]: net`);
  }
});

test('property: formatRupiah output round-trips through parseAmount (300 amounts)', () => {
  const rand = makePrng(0x5a5a5a5a);
  for (let i = 0; i < 300; i++) {
    const n = randAmount(rand);
    const formatted = formatRupiah(n);
    const parsed = parseAmount(formatted.slice(2)); // strip "Rp" prefix
    assert.equal(parsed, n, `Iter ${i}: formatRupiah(${n}) -> "${formatted}" -> ${parsed}`);
  }
});
