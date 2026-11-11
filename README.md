# 👻 Dead Ledger — The Paper Kas Book, Resurrected

**Kiroween 2026 · Category: Resurrection**

The *buku kas* — the handwritten cash-and-credit ledger book that Indonesian
warung owners and tradespeople used for generations — is dead. Its records
now scatter across chat threads and fading memory, and money quietly
disappears: a kasbon (tab) forgotten here, a materials cost untracked there.

**Dead Ledger brings the book back from the dead** as a private, offline-first
web app with a haunting interface:

- **Write in the book** — record money in, money out, and kasbon (who owes
  you, how much, and by when) in under 15 seconds. Amounts accept the way
  Indonesians actually write them: `250.000` means 250,000 rupiah.
- **See the whole picture** — totals for money in, money out, balance, and
  the amount still owed to you, always up to date — plus a **Today** strip
  (in / out / net) because the paper book was a daily ritual. "Today" is
  the local calendar date, never UTC.
- **Chase the ghosts** — unsettled debts glow candle-amber; overdue ones
  flare red; settled debts fade like ghosts laid to rest.
- **The book never dies again** — everything is stored locally in the
  browser. No account, no server, no signal required.

Built for the real audience its author knows: informal workers — painters,
tradespeople, micro-sellers — on low-end phones with unreliable connections.

## Run it

No build step, no dependencies. Either open `index.html` in a browser, or:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Run the tests (Node 18+):

```bash
node --test
```

## How Kiro was used

This project was built spec-first with **Kiro CLI** (see the `/.kiro`
directory at the repo root — it is part of the submission, not an accident):

- **Spec-driven development** — `.kiro/specs/dead-ledger/` holds
  `requirements.md` (EARS-style acceptance criteria), `design.md` (data
  model, pure-function core, storage contract), and `tasks.md` (the
  implementation checklist the build follows and ticks off).
- **Steering docs** — `.kiro/steering/product.md` keeps every suggestion
  aimed at a non-technical user on a cheap phone (the three questions the
  product must answer, Rupiah formatting, no-account rule);
  `tech.md` enforces zero dependencies, integer money math, and the
  test-before-done rule; `structure.md` keeps the file layout minimal.
- **Agent hooks** (v1 schema, `.kiro/hooks/`) — a `PostFileSave` hook runs
  `node --check` on every saved JS file; a `Stop` hook runs the full
  `node --test` suite whenever the agent finishes a turn; a spec-consistency
  hook asks the agent to verify requirements/design/tasks still agree after
  any spec edit.
- **MCP** — `.kiro/settings/mcp.json` wires the filesystem MCP server so
  Kiro can navigate and inspect the repo with approved read operations.
- **Property-based testing** — `tests/ledger.property.test.js` checks the
  spec's totals invariants (balance = in − out; still-owed = exactly the
  unsettled receivables; settling is monotone and idempotent; filters are
  consistent with totals; daily totals = totals restricted to that date;
  formatted amounts round-trip through the parser) over 300 seeded-random
  entry sets per property — 19 tests in total, all passing.
- **Custom agent** — `.kiro/agents/dead-ledger-dev.json` defines the
  project's working agent (spec-first prompt, steering files as standing
  resources); `kiro-cli agent list` picks it up as a workspace agent.
- **Steering, extended** — `testing.md` (fileMatch on `tests/**`) pins the
  test discipline, and a fourth hook validates any edited `.kiro/*.json`
  config as JSON on save.

Working this way — spec before code, steering as standing orders, hooks as
automatic discipline — meant the first working version already matched the
requirements document line by line, instead of drifting the way vibe-coded
prototypes usually do.

## Tech

Vanilla HTML/CSS/JS, `localStorage` persistence, zero dependencies.
Amounts are integer Indonesian Rupiah (`Rp1.250.000` formatting).

## License

MIT — see [LICENSE](LICENSE).
