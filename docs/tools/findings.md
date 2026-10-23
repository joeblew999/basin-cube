# tools findings

## 2026-10-23: what a global mise config hid

**The problem.** The owner's global mise config (`~/.config/mise/config.toml`) pinned 15 tools: node, go, rust, bun, pnpm, gh, jq, yq and more. A repo could call any of them without pinning it and still work on that Mac, but not on anyone else's.

**basin-cube needs nothing from it.** With the global config renamed away, an empty environment and a PATH of only mise and the OS, `mise run 3:test` passed: 7/7 checks in Node, 7/7 in a temporary Worker, docs up to date. `tools:test` now repeats that check in every `3:test`, without touching the global config, and CI runs the README steps on fresh Linux and macOS machines.

**Across the owner's other repos.** The same bare check over the 98 git repos in `joeblew999/`: 45 had everything they need pinned, 12 need no tools, 39 were missing a runtime (node, go, cargo or pnpm), 2 only a small tool (gh). Some of the 39 are false alarms (tools pinned per task, configs in subfolders, a word in a comment) or tools pinned but not installed on that Mac; `tools:test` on one repo says which.

**Global Rust overrode the repos' own Rust pins.** mise sets `RUSTUP_TOOLCHAIN` to its Rust version, and that beats `rust-toolchain.toml`. So in every repo that didn't opt in, the global 1.99.1 won: jackdaw asks for nightly-2026-03-05, pgauthz for 1.93, ewe_platform for nightly, http-nu and xs for stable. The fix in a repo is one line, `[settings] idiomatic_version_file_enable_tools = ["rust"]`, which makes mise install what `rust-toolchain.toml` says. Without a global Rust pin, `cargo` on that Mac falls through mise's shim to rustup (`~/.cargo/bin`), which reads `rust-toolchain.toml` itself.

**Go reads go.mod.** With `idiomatic_version_file_enable_tools = ["go"]`, mise uses go.mod's `toolchain` line (morpheus-minimal: `toolchain go1.26.5` gave 1.26.5, no `.go-version` file).

**Node and Go have no fallback.** With no pin anywhere: `mise ERROR No version is set for shim: node`. Only Rust falls back (to rustup).

**A global setting is a hidden pin too.** `idiomatic_version_file_enable_tools = ["node", "pnpm"]` in the global config makes `.nvmrc` and package.json's `packageManager` count on that Mac only.

## 2026-10-23: what was changed, and what's left

**Global Rust removed.** `rust = "1.99.1"` is gone from `~/.config/mise/config.toml` (the file before is kept as `config.toml.before-2026-10-23`), and rustup's default is now 1.99.1, what repos without a Rust pin were getting anyway. Checked in a fresh shell: factory-gateway still gets 1.98.1 (its own pin); orangevault and basin-cube get 1.99.1 (rustup's default); http-nu gets its `rust-toolchain.toml` (stable) instead of 1.99.1; jackdaw and pgauthz now ask for their own toolchains (nightly-2026-03-05, 1.93), which rustup downloads on first build.

**Fixed and pushed:** cf-do-locator (pins node, which `npm:wrangler` and `npx` need) and auth-service (pins `usage` as a prebuilt binary instead of `cargo:usage-cli`, which needed Rust, and gh). Both now pass the bare check. Three broken npm tools were reinstalled locally (see [aube findings](../aube/findings.md)), which fixed pnpm in cf-connectrpc-middleware and google_maps.

**Fine as they are:** orangevault takes Rust from the system rustup by design (its `mise.toml` says so). workers-rs-util pins Node per task, speckle keeps its mise configs in subfolders, and google_maps' "go" was a word in a comment. graphite-ubuntu, ifc-ubuntu, ifclite-ubuntu and shadcn-templ-demo pin their tools but haven't installed them (`mise install`).

**Not touched, the owner's call:**

| Why | Repos | The fix |
|---|---|---|
| The repo's own rules | xs ("never commit unless asked"), kv-manager and d1-manager (moving off mise), remy-auth-app (Remy's own tooling) | xs: `idiomatic_version_file_enable_tools = ["rust"]`; kv/d1: `usage` instead of `cargo:usage-cli` |
| Changes go through pull requests | claude-rig | pin gh (only its release tasks call it) |
| Uncommitted work in the tree | irgo-windows-vm, vault, mon-house, mailflare-control, ifc-ubuntu, ifclite-ubuntu, shadcn-templ-demo | per repo |
| Forks on a feature branch, likely an upstream pull request | http-nu, jackdaw, native, irgo, morpheus, zanzojs, partykit, stacks.nu, catapulte, agentic-inbox, ewe_platform, ifc-lite | on their main branch, not the PR branch |
| Forks with no mise config | mailflare, pgauthz, shadcn-templ | add one, or leave them to upstream's setup |
| Someone else's repo | icelight-remy-sport (cliftonc), datapages (romshark) | none |
| Archived on GitHub | xplat, iam, utm-dev | none |

**What still needs the global config.** Removing these from the global config would break the repos above that need them and pin nothing: Node for about 15 of them, Go for native, irgo, morpheus, shadcn-templ and datapages, Bun for irgo and xplat, pnpm for icelight-remy-sport and morpheus. ifc-lite and zanzojs get pnpm only through the global `idiomatic_version_file_enable_tools = ["node", "pnpm"]`, so that setting stays until they set it themselves. `mise run tools:test <path>` checks any one repo.
