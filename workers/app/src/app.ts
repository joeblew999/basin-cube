// The cube API, shared by the Worker and check.ts: REST at /cubejs-api/v1, MCP at /mcp.
import { drizzle, type AnyD1Database } from 'drizzle-orm/d1'
import { createCubeApp } from 'drizzle-cube/adapters/hono'
import { schema } from './schema'
import { bookingsCube } from './cubes'

export const ORG_HEADER = 'x-organisation-id'
export const DEFAULT_ORG = 'remy'

export function createApp(d1: AnyD1Database) {
  return createCubeApp({
    cubes: [bookingsCube], drizzle: drizzle(d1, { schema }) as any, schema, engineType: 'sqlite',
    // Demo only: any caller can pick a tenant with this header. Not safe in public.
    extractSecurityContext: async (c) => ({ orgId: c.req.header(ORG_HEADER) ?? DEFAULT_ORG }),
  })
}
