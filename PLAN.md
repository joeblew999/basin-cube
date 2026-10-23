# Plan

Prove that cliftonc's code works for us, on our Cloudflare account: drizzle-cube for querying and its React components, and icelight for Basin. We change none of his code. Why his and not someone else's: [docs/icelight/findings.md](docs/icelight/findings.md).

## Proofs

| # | Proof | Status |
|---|---|---|
| 1 | drizzle-cube works on D1 | **Proved** 23 Oct 2026: 7/7 locally and at https://basin-cube.gedw99.workers.dev |
| 2 | icelight works unchanged on our account | **Proved** 23 Oct 2026: deployed from zero without prompts, 83,045 events through his cube API on Basin |
| 3 | Both together: one Worker and one UI query live data in D1 and history in Basin, through drizzle-cube | Next |

## 2. icelight works unchanged on our account

Using the existing clone `~/workspace/go/src/github.com/cliftonc/icelight` at commit 901cfdc, as he ships it (default project name `icelight`).

1. You: Workers Paid on the account, and an API token with Basin Catalog Edit, Basin SQL Read, Workers R2 Storage Edit and Workers Scripts Read.
2. Build his query UI (his launch doesn't), then run his `pnpm launch` in your terminal, since it prompts. Say yes to demo data.
3. Proved when an event sent to `icelight-event-ingest` is counted by `icelight-query-api` a couple of minutes later.

## 3. Both together

1. The UI, drizzle-cube's components, gets a live/history switch: live points at this Worker, history straight at `icelight-query-api` (its API allows any site by default). No Worker changes.
2. Locking history down (an `API_TOKEN` and a forwarding route in this Worker) comes after the proof.
3. Proved when https://basin-cube.gedw99.workers.dev answers live queries from D1 and history queries from Basin.

## Not in this proof

Integration with any of our apps, real sign-in, keeping tenants apart in history.
