# Plan

Prove that cliftonc's code works for us, on our Cloudflare account, and show off what it gives us: drizzle-cube for querying (API, MCP, React components) and icelight for Basin. We change none of his code. Why his and not someone else's: [docs/icelight/findings.md](docs/icelight/findings.md).

## What it gives us

From drizzle-cube's and icelight's own READMEs. Each feature gets shown off on demo data:

| Area | Feature | Shown off by |
|---|---|---|
| **Collect** | Event ingest compatible with Segment and RudderStack: existing analytics SDKs work unchanged (track, identify, page, batch). A drop-in for Google Analytics or Mixpanel, on our own account | proof 2; S6 |
| | Event Simulator: send test events from the browser | S4 (link to icelight's UI) |
| **Store** | Apache Iceberg tables on R2 via Basin: ingest is free, queries cost cents, and it's an open format any Iceberg tool can read | proof 2 |
| | Live data in D1 next to history in Basin | proof 3 |
| **Model** | Semantic layer: measures, dimensions, joins, hierarchies and calculated measures, defined once and used by the API, UI and AI alike | proofs 1 and 2 |
| | Works on D1 (SQLite), Basin (Postgres dialect), Postgres, MySQL, DuckDB, Snowflake and more; cubes can be generated from dbt | proofs 1 and 2 |
| **Explore** | Analysis Builder: point-and-click queries, 26 chart types (bar, line, pie, KPI, funnel, Sankey, sunburst, heatmap, retention, gauge, financial and more), tables | proof 1; S4 |
| | Funnel analysis (conversion and drop-off through steps), flow analysis (user journeys), retention (cohorts over time) | S6 |
| | Dashboards: grids of charts with filters and themes, saved in D1 | S3 |
| | Basin SQL editor for direct SQL, protected by icelight's SQL guard | S4 (link to icelight's UI) |
| **Ask AI** | MCP server at `/mcp`: Claude and other AI tools discover the data, validate queries and load answers through the same security as the API | S1 |
| | Charts in the chat: the MCP `chart` tool returns interactive charts | S2 |
| | Claude Code plugin (cliftonc/drizzle-cube-plugin): query in plain English from Claude Code | S7 |
| | AI notebook in the UI (optional, needs an Anthropic API key) | S5 |
| **Build on it** | Cube.js-compatible REST API (`load`, `meta`, `dry-run`), usable from any app or tool | proof 1 (`app:query`) |
| **Keep it safe** | Tenants kept apart through a security context in every query, in the API, UI and MCP; optional row-level security | S1 (same question, different tenants, different answers) |
| | Cost and abuse protection: per-IP rate limits and a KV query cache in front of Basin | proof 2 (we hit the cache: docs/icelight/findings.md) |

## Status

| # | | Status |
|---|---|---|
| 1 | drizzle-cube works on D1 | **Proved** 23 Oct 2026: 7/7 locally and at https://basin-cube.gedw99.workers.dev |
| 2 | icelight works unchanged on our account | **Proved** 23 Oct 2026: deployed from zero without prompts, 83,045 events through his cube API on Basin |
| 3 | Both together: one Worker and UI query live data in D1 and history in Basin | Next |
| S1 | MCP in Claude Code, per tenant | Next |
| S2 | Charts in the chat | After S1 |
| S3 | Dashboards | After 3 |
| S4 | One page that shows it all | After 3 and S3 |
| S5 | AI notebook | Optional, needs your OK for an Anthropic key |
| S6 | Funnel, flow and retention on Basin events, sent by a real SDK | After 3 |
| S7 | Claude Code plugin | After S1 |

## 3. Both together

1. The UI gets a live/history switch: live queries this Worker (D1), history queries `icelight-query-api` (Basin). Both are drizzle-cube, so the same components work.
2. Done when https://basin-cube.gedw99.workers.dev answers live queries from D1 and history queries from Basin.

## S1. MCP in Claude Code

1. Commit `.mcp.json` (Claude Code's project MCP config), so anyone who opens this repo in Claude Code gets the servers: `basin-cube` (live bookings), `basin-cube-org-a` (same server, `x-organisation-id: org-a`) and `icelight` (events).
2. An `mcp` component: `mcp:status` lists each server's tools; `mcp:test` asks each a known question through MCP (remy: 400 bookings, org-a: 4, org-b's row never shows).
3. Done when a fresh Claude Code session in this repo answers "bookings by coach" for remy and for org-a with different numbers.

## S2. Charts in the chat

1. Turn on drizzle-cube's `mcp: { app: true }` in this repo's Worker, as icelight does. That adds the `chart` tool.
2. Done when Claude draws a chart from live D1 data.

## S3. Dashboards

1. drizzle-cube's `AnalyticsDashboard` in the UI, with saved layouts in this Worker's D1 (icelight does the same with its dashboards database).
2. Done when a dashboard is saved, reloaded, and shows live data.

## S4. One page that shows it all

1. The UI's home page: live and history query builders, dashboards, and the MCP endpoints with the `claude mcp add` lines to copy.
2. Done when a newcomer can see every feature above from https://basin-cube.gedw99.workers.dev.

## S5. AI notebook (optional)

1. drizzle-cube's `agent` option and notebook component, with an Anthropic API key in fnox.
2. Done when a question typed in the UI comes back as a chart.

## S6. Funnels, flows and retention on real events

1. Send events with the RudderStack SDK (icelight's Event Simulator, or a few lines in our UI), so ingest is shown with a real SDK, not just curl.
2. Show a funnel (for example page view, then sign up, then purchase), a flow and a retention chart over icelight's events in Basin, in the Analysis Builder.
3. Done when all three render from Basin data.

## S7. Claude Code plugin

1. Install cliftonc/drizzle-cube-plugin in Claude Code and point it at both cube APIs.
2. Done when Claude Code answers a question about the bookings and one about the events through the plugin.

## Not in this proof

Integration with any of our apps, real sign-in, keeping tenants apart in history. Everything shown off runs on demo data.
