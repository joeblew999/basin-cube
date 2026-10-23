# docs

Organised like `workers/` and `mise-tasks/`: one folder per component, with the same names.

- Every `tasks.md` is **generated** from the tasks themselves by `mise run docs:build`. Never edit one; `mise run docs:test` (part of `3:test`) fails if any is out of date. [tasks.md](tasks.md) covers the phases and the docs tasks.
- Every `findings.md` is **hand-written and dated**: what we measured or learned, never a description of the layout.

| Component | Tasks | Findings |
|---|---|---|
| `cloudflare`: each developer's own credentials | [cloudflare/tasks.md](cloudflare/tasks.md) | |
| `app`: this repo's Worker, drizzle-cube on D1 | [app/tasks.md](app/tasks.md) | [app/findings.md](app/findings.md) |
| `icelight`: cliftonc's Basin analytics, and its token | [icelight/tasks.md](icelight/tasks.md) | [icelight/findings.md](icelight/findings.md) |
| `aube`: the package manager | [aube/tasks.md](aube/tasks.md) | [aube/findings.md](aube/findings.md) |
| `tools`: proves this repo needs nothing from your machine | [tools/tasks.md](tools/tasks.md) | [tools/findings.md](tools/findings.md) |
