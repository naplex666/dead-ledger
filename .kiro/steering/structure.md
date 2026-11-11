---
inclusion: always
---

# Structure steering — Dead Ledger

```
index.html            — the app (single page)
styles.css            — haunted-ledger design system
app.js                — ledger core + DOM wiring
tests/ledger.test.js           — unit tests for the core (node:test)
tests/ledger.property.test.js  — property-based tests (seeded PRNG)
SUBMISSION.md         — Devpost description + Kiro write-up drafts
.kiro/specs/dead-ledger/  — requirements.md, design.md, tasks.md
.kiro/steering/           — product.md, tech.md, structure.md, testing.md
.kiro/hooks/              — v1-schema hook files
.kiro/agents/             — custom agent profiles for this project
.kiro/settings/mcp.json   — MCP servers available to Kiro in this repo
```

- Keep the file count minimal; a new file needs a reason recorded in
  `design.md`.
- When a spec task is finished, tick it in `tasks.md` in the same change.
- The `.kiro/` directory is part of the submission. Never add it to
  `.gitignore`.
