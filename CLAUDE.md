# CLAUDE.md

Rules for Claude working in this repo. They come from mistakes already made here; don't repeat them.

## Start here

1. Read [README.md](README.md) (why the repo exists, what you get), [PLAN.md](PLAN.md) (status, next steps) and the rules at the top of [mise.toml](mise.toml).
2. The goal is to prove that cliftonc's drizzle-cube and icelight work for us, unchanged, and to show off what they give us. Nothing else unless asked: no integration with other apps, no sign-in work.

## Everything lives in the repo

- Plans, findings, feature lists and decisions go in README.md, PLAN.md or docs/. Never keep project content only in Claude's memory notes. Those may only point at files in the repo.
- Commit and push what you change; the repo is public at https://github.com/joeblew999/basin-cube.

## Reuse cliftonc's code, never rebuild it

- drizzle-cube and icelight come with the features we want built in (README "What you get", PLAN "What it gives us"). Start from those lists and from his own READMEs, not from memory, before planning or building anything.
- His code stays unchanged. If his tool only offers prompts, call his own functions (see mise-tasks/icelight/.deploy.mts).
- Before calling anything "the only" or "the best", search GitHub with the `gh` CLI (`gh search repos`, `gh search code`) under every name the product has had (Basin was R2 SQL, R2 Data Catalog, Pipelines).

## Prove it, don't cheat

- A test must go through the real path (for icelight: his cube API, not raw SQL around it). If his code doesn't work, say so plainly with the output. Never route around a failure to get a passing number.
- Verify before you report: run the task (`mise run 3:test`, `mise run --dry-run <phase>`, the real task). Say what you ran and what it showed.

## mise for everything

- Every operation is a mise task, never loose shell. Follow the rules at the top of mise.toml exactly: numbered phases that only orchestrate, component tasks as files in mise-tasks/<component>/<verb>, one fixed verb set, a description and full URLs in every task, a timeout, a teardown or clean for everything created, a test or status that proves it.
- Change README.md and regenerate docs (`mise run docs:build`) in the same change; `mise run docs:test` must pass.
- "Mars" or "mice" in the user's messages means mise (speech-to-text).

## Never leave things running

- Nothing interactive, nothing fed keystrokes, nothing long-running in the background. Run in the foreground with a timeout.
- If something must run in the background, keep it short. To stop it, kill the whole process tree and confirm with `ps`.

## Secrets and outward actions

- Secrets only come from fnox (the macOS keychain). Never print them or write them into tracked files. Scan staged changes before pushing; this repo is public.
- Deleting Cloudflare resources, posting on GitHub (issues, PRs, comments) or anything else outward-facing needs the user's go-ahead, unless they asked for it in this conversation.

## How to talk to the user

- Fast and short: answer directly, run tools only when the answer depends on it, batch tool calls, no recaps.
- Don't ask what you can decide sensibly yourself; do ask before anything destructive or public.
- Be straight: say what you got wrong, fix it, move on.
