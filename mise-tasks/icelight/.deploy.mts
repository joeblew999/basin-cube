// icelight's own launch, without its interactive screens. It calls his step functions in the order his launch runs them
// (scripts/setup/App.tsx: auth, config, infrastructure, Workers, demo events), using the skipPrompts flag his
// setupEventIngest and setupQueryApi already have. His code is unchanged; this only calls it.
// Run by mise-tasks/icelight/deploy from inside the icelight clone, so his wrangler is on PATH.
import { join } from 'node:path'

const step = (file: string) => import(join(process.cwd(), 'scripts', file))
const { checkWranglerAuth } = await step('setup/steps/auth.ts')
const { deriveConfig } = await step('setup/steps/config.ts')
const { checkExistingResources, getResourcesNeeded, getCatalogInfo } = await step('setup/steps/resources.ts')
const { createInfrastructure } = await step('setup/steps/infrastructure.ts')
const { setupEventIngest } = await step('setup/steps/event-ingest.ts')
const { setupQueryApi } = await step('setup/steps/query-api.ts')
const { fetchSubdomainFromApi } = await step('setup/core/wrangler.ts')
const { seedEvents } = await step('shared/seed-events.ts')

function fail(message: string): never {
  console.error(`icelight deploy failed: ${message}`)
  process.exit(1)
}

const projectName = process.env.ICELIGHT_PROJECT_NAME || 'icelight'
const apiToken = process.env.ICELIGHT_API_TOKEN || fail('ICELIGHT_API_TOKEN is not set (mise run icelight:token:setup)')
const seed = process.env.ICELIGHT_SEED !== 'false'

console.log('== auth')
const auth = await checkWranglerAuth()
if (!auth.authenticated || !auth.accountId) fail('wrangler is not logged in (aube exec wrangler login)')
console.log(`   ${auth.email ?? 'logged in'}, account ${auth.accountId}`)
const subdomain = (await fetchSubdomainFromApi(auth.accountId, apiToken)) ?? undefined

console.log(`== infrastructure for project "${projectName}"`)
const config = deriveConfig(projectName)
await createInfrastructure(config, await checkExistingResources(config), apiToken,
  (resource: string, ok: boolean) => console.log(`   ${ok ? 'created' : 'FAILED to create'} ${resource}`))
// Re-read, as his launch does, to get the IDs of what exists now.
const resources = await checkExistingResources(config)
const missing = Object.entries(getResourcesNeeded(resources))
  .filter(([name, needed]) => name.startsWith('needs') && needed)
  .map(([name]) => name.slice('needs'.length))
if (missing.length) fail(`still missing after creating: ${missing.join(', ')}`)
const catalog = (await getCatalogInfo(config.bucketName)) ?? fail(`no Basin Catalog on bucket ${config.bucketName}`)
console.log(`   all present; warehouse ${catalog.warehouseName}`)

const urls: Record<string, string> = {}
console.log('== event ingest Worker')
const ingest = await setupEventIngest(projectName, resources.stream.id, urls, true, subdomain)
if (!ingest.success) fail('the event ingest Worker did not deploy')
console.log(`   ${ingest.url}`)

console.log('== query API Worker')
const query = await setupQueryApi(projectName, catalog.warehouseName, {
  kvCacheId: resources.kvCache.id,
  kvCachePreviewId: resources.kvCache.previewId,
  d1DatabaseId: resources.d1Database.id,
  d1DatabaseName: config.d1DatabaseName,
}, config.d1DatabaseName, auth.accountId, apiToken, urls, true, subdomain)
if (!query.success) fail('the query API Worker did not deploy')
console.log(`   ${query.url}`)

if (seed && ingest.url) {
  console.log('== demo events: 30 days')
  const result = await seedEvents({ ingestApiUrl: ingest.url, days: 30 })
  console.log(`   sent ${result.sent} events, ${result.errors} failed batches; they show up after the next sink roll (about 2 minutes)`)
}
