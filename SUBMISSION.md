# Dead Ledger — Devpost Submission Pack (DRAFT, do not submit yet)

## Project name
Dead Ledger — The Paper Kas Book, Resurrected

## Tagline (Elevator pitch)
The handwritten buku kas is dead — Dead Ledger is its ghost: a private,
offline ledger for money in, money out, and who still owes you.

## Category
Resurrection (bonus consideration: Best Demo — the before/after "paper book
vs. its ghost" story is inherently visual)

## Description (Devpost story)

### Inspiration
For generations, Indonesian warung owners and tradespeople kept a *buku kas* —
a handwritten ledger book recording every rupiah in, every rupiah out, and
every *kasbon* (a customer's tab). The book was the business's memory. It is
dead now: records scatter across chat threads, scraps of paper, and fading
memory, and money quietly disappears — a kasbon forgotten here, a materials
cost untracked there. The author is a house painter; the kasbon problem is
not a persona, it is Tuesday.

### What it does
Dead Ledger resurrects the book as a web app that answers three questions at
a glance: **who still owes me, how much came in and went out, and what is my
balance?**

- **Write in the book** — record money in, money out, or a kasbon (person,
  amount, due date) in seconds. Amounts accept the way Indonesians actually
  write them: `250.000` means 250,000 rupiah.
- **The daily picture** — a "Today" strip (in / out / net) next to the
  all-time totals, because the paper book was a daily ritual.
- **Chase the ghosts** — unsettled debts glow candle-amber, overdue ones
  flare red, settled ones fade like ghosts laid to rest; one tap marks a
  debt paid without erasing its history.
- **The book never dies again** — everything lives in the browser
  (localStorage). No account, no server, no signal needed; corrupt data
  falls back to an empty book instead of crashing.

### How we built it
Spec-first with Kiro CLI — see the write-up below. Zero dependencies:
vanilla HTML/CSS/JS, a pure-function ledger core (createEntry, parseAmount,
computeTotals, computeDailyTotals, markSettled, filterEntries, isOverdue),
unit + property-based tests with node:test, hosted as a static site.

### Challenges
- **Dates that lie:** an early draft used UTC dates, so a worker opening the
  book before 07:00 in Jakarta saw *yesterday*. The steering doc already
  said "local date, never UTC" — a spec-consistency pass caught the drift
  and every date now flows through one `localToday()` helper.
- **Amounts that lie:** `300.000` typed the Indonesian way parsed as 300
  rupiah. A dedicated `parseAmount` with grouping rules and tests fixed it.
- **Zero-budget realism:** the target phone is a low-end Android on 1 Mbps
  Wi-Fi. That constraint — not fashion — is why there is no framework, no
  build step, and no account system.

### Accomplishments
A complete, tested resurrection of a dead technology that its real audience
can use today, built end-to-end (spec → design → tasks → code → tests)
inside Kiro's workflow, with the entire `.kiro/` directory shipped in the
repo as the paper trail.

### What we learned
Spec-driven development feels slower for the first hour and faster for
every hour after: the requirements doc became the test plan, the steering
docs became standing orders the agent could not drift from, and the hooks
made "did you run the tests?" a question nobody had to ask.

### What's next
Installable PWA with an icon on the home screen; a "nag list" that formats
a polite WhatsApp reminder for an overdue kasbon; optional encrypted backup
export for people who change phones.

## Built with
HTML · CSS · JavaScript (vanilla, zero dependencies) · localStorage ·
Kiro CLI · node:test

## Try it out
- Live app: <GitHub Pages URL — after task 8>
- Repo: <GitHub URL — after repo creation>

---

## How Kiro was used (write-up for the submission form)

Dead Ledger was built **spec-driven with Kiro CLI** from the first commit,
and the `/.kiro` directory is committed at the repo root as evidence — it
is not scaffolding we added for the submission; it is how the project was
actually run.

**Specs (`.kiro/specs/dead-ledger/`)** — `requirements.md` states eight
user stories with EARS acceptance criteria (record an entry, the whole
picture, chase what is owed, privacy/offline, the daily picture, amount
entry the way people write it, housekeeping). `design.md` fixes the data
model, the pure-function core, and the storage contract. `tasks.md` is the
checklist the build followed; every finished task is ticked in the same
change that finished it (a structure-steering rule), including the
revision-pass tasks added when audits found spec-vs-code drift.

**Steering (`.kiro/steering/`)** — `product.md` keeps every decision aimed
at a non-technical user on a cheap phone (three questions, Rupiah
formatting, no accounts, theme must serve function). `tech.md` enforces
zero dependencies, integer money math, local-date correctness, and
test-before-done. `structure.md` keeps the layout minimal and forbids
gitignoring `.kiro/`. `testing.md` (fileMatch on `tests/**`) pins the
testing discipline: node:test only, seeded PRNG for property tests, a task
is not done while any test fails.

**Hooks (`.kiro/hooks/`, v1 schema)** — a `PostFileSave` hook syntax-checks
every saved JS file (`node --check`); a `Stop` hook runs the full
`node --test` suite whenever the agent finishes a turn, so a red suite can
never be the final state; a `PostFileSave` agent hook re-checks
requirements/design/tasks consistency after any spec edit — this hook's
rule is what caught the UTC-date drift described in Challenges; a fourth
hook validates any edited `.kiro/*.json` config as JSON.

**MCP (`.kiro/settings/mcp.json`)** — the filesystem MCP server is wired
with read-only auto-approved operations so the agent can navigate and
inspect the repo safely.

**Property-based testing** — the spec called for totals invariants over
randomized entry sets (task 7). The implementation uses a seeded PRNG
(no new dependencies) and checks: balance = in − out; still-owed equals
the sum of unsettled receivables; settling is monotone and idempotent;
filters are consistent with totals; daily totals equal totals restricted
to that date.

**Custom agent** — `.kiro/agents/dead-ledger-dev.json` defines the
project's working agent profile (ledger-core prompt, the repo's tool set,
the spec and steering files as standing resources).

The net effect: requirements became tests, steering became standing
orders, hooks became automatic discipline — and the first working version
already matched the requirements document line by line, instead of
drifting the way vibe-coded prototypes usually do.

---

## Submission checklist status (verified 11 Nov 2026)
- [x] New project, built during the Submission Period
- [x] `.kiro/` at repo root, complete and NOT gitignored
- [x] Open-source license in repo (MIT)
- [x] Core flows verified: 19/19 unit+property tests on the exact browser
      code, DOM contract check (every element app.js queries exists),
      single-file bundle byte-faithful to sources. Interactive browser
      E2E folds into the task-8 live-URL phone check (local headless
      browsers in the build VM crash on real page loads)
- [ ] Public GitHub repo (Hasan to create; then push + enable Pages)
- [ ] Live app URL (GitHub Pages, after repo)
- [ ] Demo video < 3 min, YouTube public (Hasan records ±1–3 Dec)
- [ ] Paste description + Kiro write-up into Devpost form (drafts above)
