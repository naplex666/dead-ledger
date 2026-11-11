'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createEntry, computeTotals, computeDailyTotals, markSettled, filterEntries, isOverdue, formatRupiah, parseAmount, localToday } = require('../app.js');

test('createEntry accepts a valid income entry', () => {
  const e = createEntry({ type: 'income', description: 'Painting job', amount: 850000, date: '2026-11-08' });
  assert.equal(e.type, 'income');
  assert.equal(e.amount, 850000);
  assert.equal(e.settled, false);
});

test('createEntry rejects zero and negative amounts', () => {
  assert.throws(() => createEntry({ type: 'income', description: 'x', amount: 0 }), /positive/);
  assert.throws(() => createEntry({ type: 'expense', description: 'x', amount: -50 }), /positive/);
});

test('createEntry rejects a receivable without a person', () => {
  assert.throws(() => createEntry({ type: 'receivable', description: 'Kasbon', amount: 1000 }), /person/);
});

test('computeTotals separates in, out, balance and still-owed', () => {
  const entries = [
    createEntry({ type: 'income', description: 'Job', amount: 1000000 }),
    createEntry({ type: 'expense', description: 'Paint', amount: 250000 }),
    createEntry({ type: 'receivable', person: 'Bu Sari', description: 'Kasbon', amount: 300000 }),
    createEntry({ type: 'receivable', person: 'Pak Dedi', description: 'Kasbon', amount: 200000 }),
  ];
  const settled = markSettled(entries, entries[3].id);
  const t = computeTotals(settled);
  assert.equal(t.moneyIn, 1200000); // income + settled receivable
  assert.equal(t.moneyOut, 250000);
  assert.equal(t.balance, 950000);
  assert.equal(t.stillOwed, 300000); // only the unsettled one
});

test('markSettled does not mutate the original array', () => {
  const entries = [createEntry({ type: 'receivable', person: 'A', description: 'Kasbon', amount: 100 })];
  const out = markSettled(entries, entries[0].id);
  assert.equal(entries[0].settled, false);
  assert.equal(out[0].settled, true);
});

test('filterEntries owed shows only unsettled receivables', () => {
  const entries = [
    createEntry({ type: 'income', description: 'Job', amount: 10 }),
    createEntry({ type: 'receivable', person: 'A', description: 'K', amount: 20 }),
    createEntry({ type: 'receivable', person: 'B', description: 'K', amount: 30 }),
  ];
  const settled = markSettled(entries, entries[2].id);
  const owed = filterEntries(settled, 'owed');
  assert.equal(owed.length, 1);
  assert.equal(owed[0].person, 'A');
});

test('isOverdue only flags unsettled receivables past due date', () => {
  const e = createEntry({ type: 'receivable', person: 'A', description: 'K', amount: 10, dueDate: '2026-11-01' });
  assert.equal(isOverdue(e, '2026-11-10'), true);
  assert.equal(isOverdue(e, '2026-10-30'), false);
  const settled = { ...e, settled: true };
  assert.equal(isOverdue(settled, '2026-11-10'), false);
});

test('parseAmount accepts plain digits and Indonesian thousand groupings', () => {
  assert.equal(parseAmount('250000'), 250000);
  assert.equal(parseAmount('250.000'), 250000);
  assert.equal(parseAmount('1.250.000'), 1250000);
  assert.equal(parseAmount('250,000'), 250000);
  assert.equal(parseAmount('250.000,00'), 250000);
  assert.equal(parseAmount(300000), 300000);
  assert.ok(Number.isNaN(parseAmount('abc')));
  assert.ok(Number.isNaN(parseAmount('')));
  assert.ok(Number.isNaN(parseAmount('12.34'))); // not a valid grouping
});

test('createEntry accepts a grouped amount string from the form', () => {
  const e = createEntry({ type: 'expense', description: 'Paint', amount: '300.000' });
  assert.equal(e.amount, 300000);
});

test('localToday uses local calendar components, not UTC', () => {
  // 00:30 local on 1 Jan: in WIB the UTC date is still 31 Dec.
  const d = new Date(2026, 0, 1, 0, 30);
  assert.equal(localToday(d), '2026-01-01');
  const late = new Date(2026, 10, 5, 23, 59);
  assert.equal(localToday(late), '2026-11-05');
});

test('computeDailyTotals only counts entries on the given day', () => {
  const entries = [
    createEntry({ type: 'income', description: 'Job A', amount: 400000, date: '2026-11-10' }),
    createEntry({ type: 'expense', description: 'Paint', amount: 150000, date: '2026-11-10' }),
    createEntry({ type: 'income', description: 'Job B', amount: 900000, date: '2026-11-09' }),
    createEntry({ type: 'receivable', person: 'Bu Sari', description: 'Kasbon', amount: 200000, date: '2026-11-10' }),
  ];
  const settled = markSettled(entries, entries[3].id);
  const d = computeDailyTotals(settled, '2026-11-10');
  assert.equal(d.moneyIn, 600000); // job A + settled kasbon
  assert.equal(d.moneyOut, 150000);
  assert.equal(d.net, 450000);
  const empty = computeDailyTotals(settled, '2026-11-08');
  assert.deepEqual(empty, { moneyIn: 0, moneyOut: 0, net: 0 });
});

test('formatRupiah formats with Indonesian thousand separators', () => {
  assert.equal(formatRupiah(1250000), 'Rp1.250.000');
  assert.equal(formatRupiah(0), 'Rp0');
});
