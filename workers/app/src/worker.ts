// Cloudflare Worker: the cube API on the DB binding. Static files in ui/dist are served by
// Workers Assets before this runs (see wrangler.jsonc).
import type { AnyD1Database } from 'drizzle-orm/d1'
import { createApp } from './app'

type Env = { DB: AnyD1Database }

export default {
  // Built per request from the binding, like icelight's query-api Worker.
  fetch: (req: Request, env: Env, ctx: unknown) => createApp(env.DB).fetch(req, env, ctx as any),
}
