# icelight and Basin

icelight is cliftonc's Cloudflare-native analytics: Analytics.js-compatible ingest Worker → Basin Pipelines → Iceberg tables on R2 (Basin Catalog) → Basin SQL → drizzle-cube → React UI and MCP. Basin is Cloudflare's 2026 name for Pipelines + R2 Data Catalog + R2 SQL.

So in the end his analytics data lives in Basin, and D1 only stores saved dashboards. drizzle-cube reaches Basin SQL through his own Drizzle driver (`workers/query-api/src/query/basin-drizzle.ts`, MIT). It sends Postgres-dialect SQL over HTTP, puts parameters inline because Basin SQL has no bound parameters, and rewrites `OFFSET`, which Basin SQL lacks. drizzle-cube runs it with `engineType: 'postgres'`.

What that means for us: one `createCubeApp` takes one database and one engine. Live data in D1 and history in Basin would be two cube apps, which can share a Worker and the same style of cube definitions. One query can't join across them.

## Other Basin projects on GitHub (searched 23 Oct 2026)

Searched with `gh` under Basin's older names too (R2 SQL, R2 Data Catalog, Pipelines):

| Project | What it is | Why not instead of icelight |
|---|---|---|
| [sidequery/hogflare](https://github.com/sidequery/hogflare) (32★, Rust) | PostHog-compatible: PostHog SDKs, persons, feature flags, error tracking, session replay, its own semantic models and dashboard over R2 SQL / DuckDB | **No license**, so its code can't be reused. Not drizzle-cube, so it doesn't share a query layer with our D1 data. The one to watch if PostHog compatibility ever matters |
| [joelhooks/alchemy-analytics](https://github.com/joelhooks/alchemy-analytics) (0★, created this week) | Event capture plus Basin infrastructure declared with Alchemy, for Effect apps | Ingest only, no querying; no license; needs Effect |
| [cloudflare/pipelines-starter](https://github.com/cloudflare/pipelines-starter) | Cloudflare's official Pipelines template | Ingest only |
| [Marcinthecloud/cloudflare-data-platform-skill](https://github.com/Marcinthecloud/cloudflare-data-platform-skill) | AI agent skill: Pipelines, R2 Data Catalog and R2 SQL, with the full SQL reference and gotchas | A reference for agents, not code to run; no license |
| riordan/dagflare, smithclay/otlp2pipeline, shart-cloud/picket | A design proposal, OpenTelemetry ingest (deprecated), a security log tool | Different jobs |

icelight stays the pick: the only one that is MIT licensed, covers ingest *and* query, and queries Basin with drizzle-cube, the same layer we use on D1.

## One deployment can't keep projects apart

Read from icelight at `901cfdc` (4 Oct 2026, same as upstream):

- One ingest key (`AUTH_TOKEN`) for every sender. The key isn't stored with the event.
- One table, `analytics.events`, with no project column.
- The query side runs drizzle-cube with an empty security context: anyone with query access sees everything.
- Without changing his code you can only **label**: each app tags its events (e.g. an `app` field) and `cube-config.ts` exposes it as a dimension. Web page events already carry the page URL. Labels don't stop one app writing as another, or a viewer seeing every app.
- Real isolation needs per-project keys plus a security context (a code change), or one deployment per project.

## Basin pricing

From Cloudflare's pricing pages (updated 1 Oct 2026; billing live since 3 Aug 2026). Pipelines need Workers Paid.

| Part | Free each month | After that |
|---|---|---|
| Ingest into a pipeline | unlimited | free |
| Pipeline SQL transform | 50 GB | $0.04/GB |
| Writing to Iceberg | 50 GB | $0.06/GB |
| Catalog operations | 1 million | $9 per million |
| Basin SQL scans | 10 GB | $2.50/TB, **minimum 10 MB per query** |
| R2 storage | 10 GB | $0.015/GB per month |

What that means: an uncached icelight dashboard load is about 25 queries, so about 250 MB scanned. That is about 40 free loads a month, then roughly $0.0006 per load. Cost only matters under abuse: icelight's README says Basin has no spending caps or budget alerts, so it puts per-IP rate limits and a KV query cache in front.

## Running it unchanged: what we hit (23 Oct 2026)

- His launch builds neither his two packages (`@icelight/core`, `@icelight/sql-guard`, which ship as `dist/`) nor his query UI. Without both, the Worker builds fail with "Could not resolve @icelight/core".
- The API token needs Basin Catalog Edit, Basin SQL Read, Workers R2 Storage Edit and Workers Scripts Read. Without Basin Catalog Edit, launch stops at "Failed to create sink … token is not authorized [code: 1012]".
- A user token with Account API Tokens Write can create a narrow account token with exactly those four permissions, so nobody needs to make one by hand in the dashboard.
- His launch prompts interactively and takes no flags, but it's only a UI over his step functions. `createInfrastructure`, `setupEventIngest` and `setupQueryApi` (the latter two with `skipPrompts`) run the same flow without prompts. His teardown takes `--confirm`.
- His code expects wrangler's own login. With `CLOUDFLARE_API_TOKEN` set to a token without Basin Catalog permission, enabling the catalog fails.
- His cube API caches answers for anonymous callers in KV for an hour and ignores `X-Cache-Control` unless the deployment sets `API_TOKEN`. A query made before the first sink roll (about 2 minutes after events arrive) answers 0 and stays 0 for the hour, although Basin holds the data. A query that hasn't been asked before (for example a date range ending now) answers correctly: 83,045 events on 23 Oct 2026, the same as a raw `SELECT COUNT(*)`.
