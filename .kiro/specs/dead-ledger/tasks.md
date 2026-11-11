# Dead Ledger — Tasks

- [x] 1. Scaffold the static app shell (index.html, styles.css) with the
      haunted-ledger design system
  - _Requirements: 5, Design: UX_
- [x] 2. Implement the ledger core in app.js (createEntry, computeTotals,
      markSettled, filterEntries, isOverdue, formatRupiah) with Node exports
  - _Requirements: 1, 2, 3_
- [x] 3. Wire persistence: localStorage save/load, corrupt-data fallback,
      first-run demo seeding + clear-demo action
  - _Requirements: 4, 5_
- [x] 4. Unit tests for the ledger core with node:test
  - _Requirements: 1, 2, 3_
- [x] 5. Entry form UX pass: inline validation messages, due-date field only
      for receivables, 15-second completion check on a phone viewport
  - _Requirements: 1, 7 — phone-viewport verification folds into task 8_
- [x] 6. Overdue visual flag + settled "ghost" styling polish
  - _Requirements: 3_
- [x] 7. Property-based tests: totals invariants (balance = in − out;
      stillOwed excludes settled) over randomized entry sets
  - _Requirements: 2 — tests/ledger.property.test.js, 300 sets per property_
- [x] 8. Deploy to GitHub Pages; verify the live URL on a phone viewport
  - _Done 11 Nov 2026: repo github.com/naplex666/dead-ledger (public),
    Pages live at naplex666.github.io/dead-ledger — verified in a real
    browser: totals In Rp850.000 / Out Rp275.000 / Balance Rp575.000 /
    Owed Rp800.000, Today strip, form date = local today, Pak Dedi
    kasbon flagged OVERDUE_
- [ ] 9. Submission pack: README Kiro write-up, Devpost description,
      demo video (< 3 min, YouTube public)
  - _Drafts done in SUBMISSION.md; video + form paste remain_
- [x] 10. Revision pass (11 Nov 2026): local-date correctness (localToday —
      code had drifted from steering's "local, never UTC" rule), amount
      parsing for Indonesian groupings (parseAmount, requirement 7), the
      daily picture (computeDailyTotals + Today strip, requirement 6),
      testing steering + JSON-validation hook + dead-ledger-dev custom
      agent. Verified: 19/19 tests (TZ=Asia/Jakarta), DOM contract check
      (every id app.js queries exists in index.html), single-file bundle
      byte-faithful to sources. Interactive browser E2E is deferred to
      task 8's live-URL phone check — every local headless browser in the
      build VM crashes on real page loads (documented in goal notes).
