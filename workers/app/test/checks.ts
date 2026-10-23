// d1-cube-check: does drizzle-cube run on Cloudflare D1 (via drizzle-orm/d1)?
// By default the cube app runs in Node against Miniflare's D1, seeded from migrations/.
// With TEST_URL set (e.g. http://localhost:8787) the same checks go to a running Worker.
import { readFileSync } from 'node:fs'
import { Miniflare } from 'miniflare'
import { createApp, ORG_HEADER } from '../src/app'

const TEST_URL = process.env.TEST_URL
const ORG = 'org-a'

// Every request asks as org-a; check 1 confirms org-b's row stays out.
const asOrg = (init: RequestInit = {}): RequestInit => ({ ...init, headers: { ...init.headers, [ORG_HEADER]: ORG } })

let request: (path: string, init?: RequestInit) => Promise<Response>
let mf: Miniflare | undefined
if (TEST_URL) {
  console.log(`Worker at ${TEST_URL}\n`)
  request = (path, init) => fetch(new URL(path, TEST_URL), asOrg(init))
} else {
  mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("ok") } }', d1Databases: ['DB'] })
  const d1 = await mf.getD1Database('DB')
  // One statement per `;` at a line end, comment lines dropped.
  const sql = readFileSync('migrations/0001_bookings.sql', 'utf8').split('\n').filter((l) => !l.startsWith('--')).join('\n')
  for (const stmt of sql.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)) await d1.prepare(stmt).run()
  const app = createApp(d1)
  console.log('In Node against Miniflare D1\n')
  request = async (path, init) => app.request(path, asOrg(init))
}

let pass = 0, fail = 0
async function q(label: string, query: unknown, check: (data: any[]) => boolean) {
  const res = await request('/cubejs-api/v1/load', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query }) })
  const body: any = await res.json().catch(() => ({}))
  // drizzle-cube answers in the multi-result shape: { queryType, results: [{ data }] }
  const rows = body.data ?? body.results?.[0]?.data
  const ok = res.status === 200 && Array.isArray(rows) && check(rows)
  ok ? pass++ : fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  [HTTP ${res.status}]`)
  console.log('      ', JSON.stringify(rows ?? body).slice(0, 300))
}

await q('1 totals (tenant filter keeps org-b out)', { measures: ['Bookings.count', 'Bookings.revenue'] },
  (d) => d.length === 1 && Number(d[0]['Bookings.count']) === 4 && Number(d[0]['Bookings.revenue']) === 1800)
await q('2 group by coach', { measures: ['Bookings.revenue'], dimensions: ['Bookings.coach'], order: { 'Bookings.coach': 'asc' } },
  (d) => d.length === 2 && Number(d.find((r) => r['Bookings.coach'] === 'Remy')?.['Bookings.revenue']) === 1200)
await q('3 filter coach = Nok', { measures: ['Bookings.count'], filters: [{ member: 'Bookings.coach', operator: 'equals', values: ['Nok'] }] },
  (d) => Number(d[0]?.['Bookings.count']) === 2)
await q('4 time dimension by week', { measures: ['Bookings.count'], timeDimensions: [{ dimension: 'Bookings.bookedAt', granularity: 'week' }] },
  (d) => d.length === 2 && d.reduce((s, r) => s + Number(r['Bookings.count']), 0) === 4)
await q('5 time dimension with date range', { measures: ['Bookings.count'], timeDimensions: [{ dimension: 'Bookings.bookedAt', dateRange: ['2026-10-01', '2026-10-05'] }] },
  (d) => Number(d[0]?.['Bookings.count']) === 3)

const meta = await request('/cubejs-api/v1/meta')
console.log(`${meta.status === 200 ? 'PASS' : 'FAIL'}  6 meta endpoint [HTTP ${meta.status}]`); meta.status === 200 ? pass++ : fail++

const mcp = await request('/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }) })
const mcpText = await mcp.text()
const mcpOk = mcp.status === 200 && mcpText.includes('discover') && mcpText.includes('load')
console.log(`${mcpOk ? 'PASS' : 'FAIL'}  7 MCP tools/list [HTTP ${mcp.status}]`); console.log('      ', mcpText.slice(0, 200)); mcpOk ? pass++ : fail++

console.log(`\nRESULT: ${pass} passed, ${fail} failed`)
await mf?.dispose()
process.exit(fail ? 1 : 0)
