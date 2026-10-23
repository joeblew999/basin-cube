# tools findings

## 2026-10-23: what a global mise config hid

**The problem.** The owner's global mise config (`~/.config/mise/config.toml`) pinned 15 tools: node, go, rust, bun, pnpm, gh, jq, yq and more. A repo could call any of them without pinning it and still work on that Mac, but not on anyone else's.

**basin-cube needs nothing from it.** With the global config renamed away, an empty environment and a PATH of only mise and the OS, `mise run 3:test` passed: 7/7 checks in Node, 7/7 in a temporary Worker, docs up to date. `tools:test` now repeats that check in every `3:test`, without touching the global config, and CI runs the README steps on fresh Linux and macOS machines.

**Across the owner's other repos.** The same bare check over the 98 git repos in `joeblew999/`: 45 had everything they need pinned, 12 need no tools, 39 were missing a runtime (node, go, cargo or pnpm), 2 only a small tool (gh). Some of the 39 are false alarms (tools pinned per task, configs in subfolders, a word in a comment) or tools pinned but not installed on that Mac; `tools:test` on one repo says which.

**Global Rust overrode the repos' own Rust pins.** mise sets `RUSTUP_TOOLCHAIN` to its Rust version, and that beats `rust-toolchain.toml`. So in every repo that didn't opt in, the global 1.99.1 won: jackdaw asks for nightly-2026-03-05, pgauthz for 1.93, ewe_platform for nightly, http-nu and xs for stable. The fix in a repo is one line, `[settings] idiomatic_version_file_enable_tools = ["rust"]`, which makes mise install what `rust-toolchain.toml` says. Without a global Rust pin, `cargo` on that Mac falls through mise's shim to rustup (`~/.cargo/bin`), which reads `rust-toolchain.toml` itself.

**Go reads go.mod.** With `idiomatic_version_file_enable_tools = ["go"]`, mise uses go.mod's `toolchain` line (morpheus-minimal: `toolchain go1.26.5` gave 1.26.5, no `.go-version` file).

**Node and Go have no fallback.** With no pin anywhere: `mise ERROR No version is set for shim: node`. Only Rust falls back (to rustup).

**A global setting is a hidden pin too.** `idiomatic_version_file_enable_tools = ["node", "pnpm"]` in the global config makes `.nvmrc` and package.json's `packageManager` count on that Mac only.
