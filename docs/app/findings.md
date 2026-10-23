# drizzle-cube on D1: works

Findings from 23 Oct 2026.

drizzle-cube 0.12.2, Drizzle's D1 driver, Hono adapter with `engineType: 'sqlite'`. All 7 pass both in Node against Miniflare's D1 and inside a Worker under `wrangler dev` (workerd, local D1).

| # | Check | Result |
|---|---|---|
| 1 | Totals with tenant filter | PASS: count 4, revenue 1800, org-b excluded |
| 2 | Group by coach | PASS: Nok 600, Remy 1200 |
| 3 | Filter coach = Nok | PASS: 2 |
| 4 | Time dimension by week | PASS: 3 (week of 29 Sep), 1 (week of 6 Oct) |
| 5 | Date range 1–5 Oct | PASS: 3 |
| 6 | `/cubejs-api/v1/meta` | PASS |
| 7 | MCP `tools/list` | PASS: `discover`, `validate`, `load` |

Notes:

- drizzle-cube returns rows at `results[0].data`, not `data`. The first run reported 5 failures because the check script (now `test/checks.ts`) read the wrong field; that is fixed.
- D1 isn't mentioned anywhere in drizzle-cube. Its SQLite executor is written for better-sqlite3, which is synchronous. Normal queries work anyway, and numbers come back as numbers.
- **EXPLAIN is broken on D1, quietly.** `POST /cubejs-api/v1/explain` answers 200 with the right SQL but an empty plan (`operations: []`, no indexes). D1 itself reports `SEARCH bookings USING INDEX bookings_org_booked_at` for the same query. The SQLite executor calls `db.all()` as if it were synchronous, as better-sqlite3 is, so on D1 it reads no rows. It's a diagnostic, not used by normal queries. `/dry-run` works.
- **Deployed:** all 7 pass on Cloudflare at https://d1-cube-check.gedw99.workers.dev . Demo data only, because the tenant header isn't auth.
- drizzle-cube's React client imports two optional peers at module level, so a Vite build fails until you install them: `@nivo/heatmap` and `react-grid-layout`. icelight's UI installs them for the same reason. npm doesn't install optional peers either, so this isn't caused by aube.
- The UI's AnalysisBuilder works in the browser: queries, chart and table, and switching organisation changes the numbers (org-a: Nok 600, Remy 1200).
