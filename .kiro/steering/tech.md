---
inclusion: always
---

# Tech steering — Dead Ledger

- Zero dependencies. Vanilla HTML/CSS/JS only; no framework, no bundler,
  no build step. The app must run by opening `index.html` or via any static
  file server.
- `app.js` keeps the ledger core as pure functions, exported with a
  `module.exports` guard so `node --test` exercises the exact code the
  browser runs. DOM wiring must stay behind a `typeof document` guard.
- Persistence is `localStorage` under versioned keys
  (`dead-ledger-entries-v1`). Never change the shape of a stored entry
  without a migration note in the spec design doc.
- All money math is integer Rupiah. Never use floats for amounts.
- Dates are `YYYY-MM-DD` strings; overdue checks compare against the local
  date, not UTC.
- Every core function gets a unit test. Run `node --test` (auto-discovers
  `tests/*.test.js`) before declaring any task done. Note: passing the
  directory (`node --test tests/`) fails on Node 24 — don't use it.
- Accessibility/contrast: body text must stay readable in bright light;
  minimum tap target 44px.
