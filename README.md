# basin-cube

## Why this repo exists

All our projects will keep their analytics on **Cloudflare Basin** (Pipelines into Iceberg tables on R2, queried with Basin SQL). We don't want to write that ourselves. [cliftonc](https://github.com/cliftonc) has already built the pieces, MIT licensed:

- [drizzle-cube](https://github.com/cliftonc/drizzle-cube): a query layer (semantic layer) with an API, an MCP server and React components for charts and a query builder.
- [icelight](https://github.com/cliftonc/icelight): a complete Basin analytics setup. It takes events in, stores them in Basin, and queries them with drizzle-cube.

**This repo proves that his code works for us, unchanged, on our Cloudflare account:** drizzle-cube on our live data in D1, icelight on Basin, then both together. Why his code and not something else: [docs/icelight/findings.md](docs/icelight/findings.md).

## What you get

Everything here comes built into cliftonc's code; we don't rebuild any of it. The full list, and how each piece gets shown off, is in [PLAN.md](PLAN.md#what-it-gives-us).

- **Collect:** Segment/RudderStack-compatible event ingest, so existing analytics SDKs work unchanged. A drop-in for Google Analytics or Mixpanel, on our own account.
- **Store:** Iceberg tables on R2 through Basin: free ingest, cheap queries, an open format. Live data stays in D1.
- **Explore:** a point-and-click query builder with 26 chart types, funnel, flow and retention analysis, dashboards, and a Basin SQL editor.
- **Ask AI:** an MCP server built in, so Claude can answer questions about the data, including charts in the chat. Plus a Claude Code plugin and an AI notebook.
- **Build on it:** one semantic layer (measures, dimensions, joins) behind a Cube.js-compatible REST API.
- **Keep it safe:** each tenant only ever sees its own data, in the API, the UI and MCP.

## Where it stands

| | Proof | Status |
|---|---|---|
| 1 | drizzle-cube works on D1 | **Proved**: 7/7 checks locally and at https://basin-cube.gedw99.workers.dev |
| 2 | icelight works unchanged on our account | **Proved**: deployed from zero with no prompts; 83,045 events through his cube API on Basin |
| 3 | One Worker and UI query live data (D1) and history (Basin) together | Next |

What's next, and what's deliberately out of scope: [PLAN.md](PLAN.md).

## Get started

You need [mise](https://mise.jdx.dev). It installs every other tool this repo uses at pinned versions: Node, aube, fnox, jq, and pnpm for icelight. Nothing comes from your own machine's mise config: `mise run tools:test` proves it, and [CI](.github/workflows/test.yml) runs these steps and `3:test` on fresh Linux and macOS machines.

```sh
mise trust && mise install
```

Then one one-time step, the only manual part:

```sh
mise run cloudflare:setup
```

It logs wrangler in, stores your account ID in fnox (the macOS keychain), and asks you to paste a `dev` token. It shows you exactly how to create the token in the dashboard. You can check your setup any time with `mise run 5:status`. The Cloudflare account must be on **Workers Paid**, which Basin Pipelines need; the status check tells you if it isn't.

Everything else is mise, in numbered phases. `mise tasks` lists them in this order:

```sh
mise run 1:setup      # checks your credentials, then dependencies, local D1, icelight's clone, its token; ends with 5:status
mise run 2:build      # this repo's UI, icelight's packages and UI
mise run 3:test       # types, the 7 checks in Node, the 7 checks in a temporary Worker, docs, tools from mise.toml only
mise run 4:deploy     # this repo's Worker and D1 database, then icelight (Basin, both Workers, demo events)
mise run 5:status     # your credentials, every URL, and whether each Worker is up
mise run 6:teardown   # remove everything from Cloudflare
mise run 0:clean      # remove everything local
```

To start from zero, run `6:teardown` and `0:clean`, then `1:setup` through `5:status`.

## Day to day

```sh
mise run app:dev                 # this repo's Worker + UI on http://localhost:8787 (add --ui for Vite hot reload)
mise run app:query '{"measures":["Bookings.revenue"],"dimensions":["Bookings.coach"]}' --org org-a
mise run 5:status                # every URL and what's up
mise run aube:status             # includes which packages have newer releases
mise run app:setup --latest      # upgrade them (aube update --latest), then run 3:test
```

The UI is drizzle-cube's query builder. The buttons top right switch organisation (tenant): `remy` has 400 demo bookings, and `org-a` and `org-b` hold the rows the checks use.

## How it's organised

```
workers/
  app/        this repo's Worker (basin-cube): src/, ui/, migrations/, test/checks.ts, wrangler.jsonc
  icelight/   cliftonc's repo, cloned unchanged at a pinned commit (git-ignored)
mise-tasks/
  app/  icelight/  aube/  tools/    one file per task, named after the Worker or tool it works on
mise.toml     the rules every task follows, the settings, and the phases
fnox.toml     which keychain secrets tasks may load
docs/         per component: generated tasks.md, dated findings.md
```

The root only orchestrates. Each phase runs one verb (setup, build, test, deploy, status, clean or teardown) for each component: first `app`, then `icelight`. The rules for adding or changing a task are at the top of [mise.toml](mise.toml). Follow them so the structure stays this way. `mise tasks --hidden` lists every task, and `mise run --dry-run <task>` shows what one would do without running it. Every task, generated from the tasks themselves: [docs/tasks.md](docs/tasks.md) and `docs/<component>/tasks.md`.

## Good to know

- **Demo data only.** The organisation comes from an `x-organisation-id` header that anyone can set, so it isn't safe for real data.
- **Versions are pinned:** tools in `mise.toml`, JS packages in `workers/app/aube-lock.yaml`, icelight by `ICELIGHT_REF`.
- **Your own mise config doesn't count.** Every tool a task calls is pinned here, so the repo works the same on a fresh machine as on yours (rule 11 in [mise.toml](mise.toml)).
- **Secrets only come from fnox** (the macOS keychain), never from files in this repo.

## More

- [PLAN.md](PLAN.md): the proofs, what's next, what's out of scope
- [CLAUDE.md](CLAUDE.md): rules for Claude Code working in this repo
- [docs/](docs/README.md): one folder per component. Each has a generated `tasks.md` (every task, can't drift) and a dated, hand-written `findings.md`:
  - [docs/app/findings.md](docs/app/findings.md): drizzle-cube on D1, the 7 checks and what we learned
  - [docs/icelight/findings.md](docs/icelight/findings.md): how icelight works, why it and not the alternatives, Basin pricing
  - [docs/aube/findings.md](docs/aube/findings.md): aube measured against npm
  - [docs/tools/findings.md](docs/tools/findings.md): what a global mise config hid, here and across the other repos
