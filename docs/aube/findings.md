# aube: works, and saves disk from the second project on

Findings from 23 Oct 2026.

- **Install:** 206 packages in 11.8 s. Nothing needed `approve-builds` (workerd and esbuild included).
- **Project stays small:** 348 K with dependencies installed, 92 K after `clean`. A `node_modules` entry is a symlink into a shared folder.
- **Where packages live:** content store `~/.local/share/aube/store/v1`, shared package folders (the "global virtual store") `~/.cache/aube/virtual-store/v1`. Run `aube doctor` to see all paths.
- **On macOS, files are APFS clones, not hardlinks.** So `du` counts them in full: after the first install it showed store 509 MB + cache 873 MB. Measure real cost with `df` (free space) before and after, not `du`.
- **The saving shows from the second project on.** Measured 23 Oct 2026 with `df` on the data volume:

| Install | Time | Real disk used | `node_modules` |
|---|---|---|---|
| npm 11.20, same `package.json`, scripts off | 8.8 s | 734 MB (incl. npm cache) | 527 MB of real files, in every project |
| aube, second project, same lockfile | 0.25 s | 0 MB | 252 K of symlinks |
| aube, third project, same deps + `wrangler` | 5.1 s | 213 MB | 296 K of symlinks |

  In the third install `du` grew by 436 MB (store 201 + shared folders 235), but free space dropped by only 213 MB, about the store's growth. So the clones in the shared folders cost almost nothing. Only packages not already in the store take real space. aube picked wrangler 4.151.3, not 4.152.0, because of the 24-hour release-age rule.
- **Real tooling works through the symlinks** (23 Oct 2026): wrangler 4.151.3 with workerd and esbuild, Vite 8 with rolldown, `@vitejs/plugin-react`, React 19, TypeScript 7 and tsx all run from aube's shared folders. No install scripts needed approval, and no tool needed config changes for symlinked `node_modules`. `vite build` takes 0.3 s and `tsc` 0.2 s.
- **Outside this repo, `aube` needs a version.** mise has no global aube, so the shim errors outside a project that pins one. Use `mise x aube@2.8.1 -- aube …` or set a global version.

Defaults to know:

- Versions published in the last 24 hours are not installed (`minimumReleaseAge=1440`).
- Dependency install scripts are blocked unless allowed (`aube ignored-builds`, `aube approve-builds`; approvals are committed as `allowBuilds`).
- Dependencies are isolated (pnpm-style): a package can only use what it declares.
- Existing lockfiles (npm, pnpm, yarn, bun) are kept in their format. New projects get `aube-lock.yaml`.
- aube hands Node installs to mise. Keep Node in mise; don't use `aube activate`.
- Shared folders are off in CI, so `node_modules` there holds real files and can be cached. GitHub Action: `jdx/aube-action@v1`.
- Pin aube exactly in `mise.toml` (here `aube = "2.8.1"`). `aube = "2"` picked an old installed 2.2.17 at first, and aube releases often.

Commands: `aube install`, `aubr <script>` (installs first if stale), `aube exec <bin>`, `aubx <pkg>` (one-off), `aube add [-D]`, `aube ci`, `aube clean`, `aube store status|path|prune --dry-run`, `aube doctor`.

## Upgrading packages, in this repo and the others (23 Oct 2026)

mise upgrades tools (`mise up --bump` rewrites the pins in `mise.toml`). aube does the same for JS packages, in any repo, whatever its lockfile:

- **See what's behind:** `aube outdated` (in `aube:status`). Read-only. Run on five other repos it worked with every lockfile type and changed no files: yarn (saasmail, 55 behind), pnpm (bye, 11), bun (remy-data, 9), npm (charter, 1), aube (htmx-demo, 11).
- **Upgrade:** `mise run app:setup --latest` runs `aube update --latest`, then the normal install. Here it raised `hono` and `miniflare` to their newest releases (`^4` became `^4.13.13` and `^4.20260730.0`) and held wrangler 4.152.0 back under the 24-hour rule. `3:test` passed after: 7/7 in Node, 7/7 in a temporary Worker.
- **It refuses suspicious releases.** In a copy of saasmail, aube stopped with `ERR_AUBE_TRUST_DOWNGRADE`: `@cloudflare/vitest-pool-workers@0.23.0` has no trusted-publisher proof, though 0.10.0 had one. npm and yarn would install it. Allow a known-good release explicitly (https://aube.sh/trust-policy-exceptions).
- **npm workspaces get a big lockfile diff.** In a full clone of charter (an npm workspace), `aube update --latest` kept `package-lock.json` (npm accepts it: `npm ci --dry-run`) and the same packages (262 against npm's 260, the difference being the upgraded `@types/node` and its `undici-types`), but listed them under each workspace instead of hoisting: 1,705 entries against 273. For an npm workspace, upgrade with npm or move the repo to aube; for pnpm, bun, yarn and aube repos, `aube update --latest` is enough.

## mise's npm tools broke when aube's cache moved (23 Oct 2026)

Three tools mise had installed in June through aube (`npm:pnpm` 10.15.0, `npm:turbo` 2.9.18, `npm:@google/clasp` 3.3.0) linked into `~/.cache/aube/virtual-store/`. aube now keeps that cache in `virtual-store/v1/`, so the links pointed at nothing, and `pnpm` failed in cf-connectrpc-middleware and google_maps. A global pnpm hid it. `mise install -f <tool>@<version>` fixed all three, and mise now installs npm tools inside its own install folder, so pruning aube's store or cache can't break them.
