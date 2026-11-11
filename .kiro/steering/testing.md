---
inclusion: fileMatch
fileMatchPattern: "tests/**"
---

# Testing steering — Dead Ledger

- Tests use `node:test` + `node:assert/strict` only. Zero new dependencies —
  property-based tests use a small seeded PRNG written in the test file
  itself (mulberry32), so failures are reproducible from the seed.
- Unit tests live in `tests/ledger.test.js`; property-based tests in
  `tests/ledger.property.test.js`. Both exercise the exact `app.js` the
  browser runs, via its `module.exports` guard.
- Every property states an invariant from the spec (requirements.md), not
  an implementation detail: totals identities, settle monotonicity and
  idempotence, filter consistency, daily totals = totals restricted to
  that date.
- Run the full suite with `node --test` (auto-discovery). Never
  `node --test tests/` — it fails on Node 24.
- A task is not done while any test fails; the Stop hook runs the suite
  automatically, so leave the tree green.
