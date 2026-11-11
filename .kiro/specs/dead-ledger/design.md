# Dead Ledger — Design

## Architecture

A zero-dependency static web app: `index.html` + `styles.css` + `app.js`.
No build step, no framework, no backend. It can be hosted on any static host
(GitHub Pages) and works offline after first load.

```
index.html   — semantic layout: header, summary cards, entry form, filters, ledger list
styles.css   — "haunted ledger" design system (dark parchment, ghost-green ink)
app.js       — ledger core (pure functions) + DOM wiring + localStorage persistence
tests/       — node:test suites for the ledger core
```

## Data model

Entry:
```js
{
  id: string,            // crypto.randomUUID() or timestamp-based fallback
  type: 'income' | 'expense' | 'receivable',
  person: string,        // required for receivable, optional otherwise
  description: string,
  amount: number,        // positive integer, Indonesian Rupiah
  date: 'YYYY-MM-DD',
  dueDate: 'YYYY-MM-DD' | null,   // receivable only
  settled: boolean,      // receivable only; settled counts as income
  createdAt: number
}
```

Storage: `localStorage["dead-ledger-entries-v1"]` (JSON array).
First-run seeding is guarded by `localStorage["dead-ledger-seeded-v1"]`.

## Core functions (pure, unit-tested)

- `createEntry(input)` — validates and normalizes form input into an Entry;
  throws on non-positive amount or missing description.
- `parseAmount(raw)` — integer Rupiah from plain digits or Indonesian
  thousand groupings (`250.000`, `1.250.000`, optional `,00` tail); NaN for
  anything else.
- `localToday(now?)` — the local calendar date as `YYYY-MM-DD`. All "today"
  logic (default entry date, overdue checks, daily totals, seed dates) goes
  through this helper; `toISOString()` (UTC) is never used for dates.
- `computeTotals(entries)` — returns `{ moneyIn, moneyOut, balance, stillOwed }`.
  Settled receivables count into `moneyIn`; unsettled ones into `stillOwed`.
- `computeDailyTotals(entries, dateStr)` — `{ moneyIn, moneyOut, net }` for
  one calendar day, reusing `computeTotals` on the day's entries.
- `markSettled(entries, id)` — returns a new array with the receivable settled.
- `filterEntries(entries, filter)` — `all | income | expense | owed`.
- `isOverdue(entry, today)` — receivable, unsettled, dueDate < today.
- `formatRupiah(n)` — `Rp1.250.000` via `Intl.NumberFormat('id-ID')`.

`app.js` exports these via `module.exports` when loaded under Node so the
same file the browser runs is the file the tests exercise.

## UX / visual design

- Dark "ledger of the dead" theme: near-black violet background, parchment
  cards, ghost-green and candle-amber accents, serif display type.
- The spooky theme is functional, not decoration: high contrast for outdoor
  glare, overdue debts glow red like a warning spirit, settled debts fade
  like ghosts laid to rest.
- Mobile-first: the primary device is a low-end Android phone. Big tap
  targets, one-column layout, form completable in under 15 seconds.

## Error handling

- Invalid form input → inline message, nothing is saved.
- Corrupt localStorage JSON → fall back to an empty ledger instead of
  crashing (the book must never "die" again).
