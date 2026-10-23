# Cloudflare, properly

Plan, 2026-10-23. This is research and planning only. No Cloudflare token, setting or resource was created, changed or deleted. The plan gets proved in basin-cube first, then rolls out to every repo under joeblew999/.

## Decision

**People log in. Machines get tokens. The repo says which.**

1. **Developers hold no Cloudflare tokens.** Everyone, you included, uses Cloudflare's own browser logins:
   - `wrangler login` to develop and deploy;
   - `cf auth login` (Cloudflare's new CLI), only when a repo needs a token made.

   Nobody creates, pastes, stores, shares or rotates anything. This works on macOS, Linux and Windows, with or without fnox. Working on our account means being a member of it, with a role. Working on your own account means logging in to that one instead.
2. **Only machines get tokens.** Two kinds of machine need one:
   - CI that deploys;
   - a deployed Worker that calls the Cloudflare API itself, such as icelight's query Worker calling Basin SQL.

   Each token is account-owned, as narrow as possible, named after its repo and made from a small file in that repo. Bindings (D1, KV, R2, Pipelines streams) need no token at all.
3. **One shared, versioned mise task makes those tokens**, using the person's own `cf` login. Since 1 Oct 2026, a `cf` login may create account tokens, limited to what that person may do. So no token anywhere needs the power to make other tokens.
4. **The global `dev` token is retired.** It is the rot: a personal token used as a machine credential, carrying every repo's permissions. It has been copied into the keychain, into plaintext `.env` files and into six GitHub repos.

So **no, not every repo needs to make its own token.** Most need none. A repo that does needs one tokens file per token, a few lines of JSON, and no script.

## Why this is Cloudflare's way

| What Cloudflare says | Source |
|---|---|
| A user token acts as a person, which suits one-off scripting. An account token is a "service principal" for CI/CD and integrations that must keep working after the person who set them up has left. New account tokens start with `cfat_`, so leak scanners spot them. | [Account API tokens](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/), updated 28 Sep 2026 |
| Members with the API Token Provisioning role can create account tokens. "OAuth clients that request the `account_api_tokens:create` scope, starting with Cloudflare CLI, can create Account API tokens." A new token gets at most its creator's permissions, and the creator is recorded. | [Changelog, 1 Oct 2026](https://developers.cloudflare.com/changelog/post/2026-10-01-account-api-token-provisioning/) |
| `cf` 1.0.0-beta.20 (npm, 20 Oct 2026) asks for the `account_api_tokens:create` scope when you log in (read from its package). It has `cf accounts tokens create`, with `--policies`, `--expires-on` and `--condition-request-ip-in`. `wrangler login` (4.151.3) has no such scope. | `cf --help` and `wrangler login --scopes-list`, both run on 23 Oct 2026 |
| People get roles, as members or User Groups. API tokens are for "CI/CD pipelines, agents, scripts". Both can be limited to a single Worker. `wrangler login` "does not currently support granular authorization"; for that, use an account token. | [Workers authorization](https://developers.cloudflare.com/workers/authorization/), updated 15 Sep 2026 |
| On your machine, use `wrangler login`. Its login refreshes itself, and since 3 Jun 2026 `--use-keyring` keeps it in the OS keychain. In CI, set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. A token in the environment overrides every login. | [GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), 18 Oct 2026; [keyring](https://developers.cloudflare.com/changelog/post/2026-06-03-wrangler-keyring-credential-storage/); [profiles](https://developers.cloudflare.com/workers/wrangler/profiles/), 12 Aug 2026 |
| Profiles (beta) are named logins bound to a folder, used to keep accounts apart. They are "a local-machine convenience. They do not apply in CI". `cf` has the same profiles. | the profiles page above; [cf get started](https://developers.cloudflare.com/cf/get-started/), 29 Sep 2026 |
| There is no OIDC: Cloudflare doesn't accept GitHub's OIDC tokens. The wrangler-action request was turned into a discussion on 18 May 2026 and nothing shipped. The workers-sdk discussion is still open. | [wrangler-action#402](https://github.com/cloudflare/wrangler-action/issues/402), [workers-sdk discussion 11434](https://github.com/cloudflare/workers-sdk/discussions/11434) |
| Workers Builds deploys from Git with a token that Cloudflare keeps. "Only user tokens are supported, with account-owned token support coming soon." Its default token has no D1 permission. | [Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) |
| If bindings have no IDs, deploy creates the resources (KV, R2, D1, Queues and others). The repo then holds no IDs tied to one account. | [Automatic provisioning](https://developers.cloudflare.com/workers/wrangler/configuration/#automatic-provisioning) |
| `secrets.required` in the wrangler config makes deploy fail if a named secret is missing. Worker secrets and Secrets Store hold values a Worker uses while it runs; they aren't developer credentials. | [Changelog, 24 Mar 2026](https://developers.cloudflare.com/changelog/post/2026-03-24-secrets-config-property/); [Secrets Store](https://developers.cloudflare.com/secrets-store/) |
| Basin SQL needs a real API token; no binding can query it. So Basin requires icelight's token; it isn't cliftonc's choice. | [Basin SQL authentication](https://developers.cloudflare.com/basin-sql/query-data/) |

**Prior art.** Searched on GitHub with `gh search repos` and `gh search code` on 23 Oct 2026:

- [allthingsweb-dev/allthingsweb](https://github.com/allthingsweb-dev/allthingsweb) already does point 3.
  - Its `infra/ci-token.json` lists permission names.
  - Its `infra/scripts/ci-token.sh` creates the account token with the maintainer's `cf` login and pipes it straight into `gh secret set`, "so no Global API Key or token-minting token exists anywhere".
- Keyless CI exists only through community brokers, and each needs a token-minting token kept in the broker:
  - [cf-contrib/cloudflare-sts](https://github.com/cf-contrib/cloudflare-sts): pre-1.0, 1 star.
  - [waigel/cf-oidc-proxy](https://github.com/waigel/cf-oidc-proxy).
- fnox's own Cloudflare lease also needs a parent token with API Tokens Edit ([fnox docs](https://fnox.jdx.dev/leases/cloudflare.html)).

## Today's rot

What we found across the 103 checkouts under joeblew999/. The survey was read-only on 23 Oct 2026, and recorded names only, never values.

- **One token, many jobs.**
  - 23 of the 24 `fnox.toml` files that name `CLOUDFLARE_API_TOKEN` point at the same keychain entry.
  - Each repo describes that token differently:
    - "cf:audit only" (remy-sport);
    - "D1:Edit" (shadcn-places);
    - "AI Gateway Edit" (remy-auth);
    - "add Email Sending and Turnstile" (auth-service);
    - "can create account tokens" (basin-cube).
  - remy-sport's `scripts/lib/moq-permission.ts` even edits token permissions in place, with a second token that can manage tokens.
- **Copied into CI.** The token is a GitHub secret in auth-service, plat-trunk, irgo, charter, fleet-api and ubuntu-website. Those secrets were set between Dec 2025 and Oct 2026. ifc-lite's deploy workflow runs on every push, but the repo has no secrets.
- **Plaintext copies.** These files are gitignored, but plaintext:
  - ubuntu-website `.env` and xplat `.env`, which are identical;
  - plat-trunk `.env.local`, which holds a different token;
  - irgo-windows-vm `.env.r2`.

  `~/.config/fnox/config.toml` holds five values with no provider, so they are stored in the clear, and the file is mode 644.
- **Mac-only.**
  - 33 fnox files read only the macOS keychain.
  - 21 repos use fnox without a `fnox.toml`, so they depend on the global fnox config. That is the credential version of the global mise config in [tools findings](tools/findings.md).
- **Values tied to one account, inside the repos.**
  - remy-sport's `wrangler.toml` and ubuntu-website both hold our account ID.
  - basin-cube's own [mise.toml](../mise.toml) bakes in our account ID (`CF_DASH_URL`) and our `gedw99.workers.dev` subdomain.
  - basin-cube's `workers/app/wrangler.jsonc` holds a `database_id`, which `app:deploy` rewrites with `sed`.
- **Different names for the same thing.**
  - Repos use `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_TOKEN`, and `PROD_`/`NONPROD_` prefixes.
  - mon-house says wrangler reads `CF_API_TOKEN`. It reads `CLOUDFLARE_API_TOKEN`.
- **Seven token checkers, six tools that push secrets, none shared.**
  - Checkers include `.github`'s `cf:token-check`, `charter token`, auth-service's `cf:token:*`, basin-cube's `cloudflare:status` and Miniflare's `env:status`.
  - Push tools include `dev secrets`, `irgo secrets push` and charter's `cloudflare:secrets`.
- **The in-house attempts.** None of them solves this, and none needs to be kept for it:
  - **vault and orangevault:** a self-hosted Bitwarden. It stores secrets, but doesn't make or scope Cloudflare tokens.
  - **iam:** deprecated; it handled end users signing in.
  - **auth-service:** single sign-on for end users, plus a checklist for making tokens by hand.
  - **claude-rig's `docs/concepts/secrets.md`:** a good written policy, but Mac-only, and only two repos follow it.
  - **Miniflare-app-budget:** the furthest along. A parent token makes child tokens that last 4 hours. Its own test found that a child isn't limited to its parent's permissions. Making tokens with `cf` replaces this.
  - **cf-cli-test:** evidence of how `cf` logins behave, not a tool.

## Who needs what

| Who or where | Credential | Where it comes from | Where it's kept |
|---|---|---|---|
| Any developer: local dev and tests | none | `wrangler dev` runs locally | nowhere |
| A developer deploying, to their own account or ours | their own login | `wrangler login`, once | wrangler's config folder (add `--use-keyring` to keep it in the OS keychain) |
| A maintainer making a token | their own login | `cf auth login`, once | cf's config folder |
| CI running tests | none | nowhere | nowhere |
| CI deploying | one account token per repo (`cfat_…`) | made from the repo's `cloudflare/tokens/ci.json` | GitHub secret `CLOUDFLARE_API_TOKEN` plus variable `CLOUDFLARE_ACCOUNT_ID`; or Workers Builds, with nothing in GitHub |
| A Worker that calls the Cloudflare API (icelight) | one account token per use | made from `cloudflare/tokens/<name>.json` | the Worker's secret, plus the deployer's store if the value must survive (see below) |
| Access to our account | membership and a role | an invite in the dashboard | Cloudflare |

**Their own account or ours.**
- **Their own account:** a developer logs in and deploys. Nothing in the repo names an account. If they have several accounts, they set `CLOUDFLARE_ACCOUNT_ID` in their own gitignored `mise.local.toml`.
- **Our account:**
  - You invite them into a "developers" User Group, with Developer Platform roles. Cloudflare's roles are Metadata Read-Only, Content Read-Only, Editor and Admin, each given for the whole platform, one product or one Worker.
  - Only maintainers also get API Token Provisioning.
  - When someone leaves, you remove them, and there is nothing to rotate.

**With or without fnox.** fnox becomes optional. Tasks read plain environment variables.
- **What needs storing:** only a value that must survive between deploys. Today the only one is icelight's token: its pipeline sink and query Worker both keep it, so it can't be replaced on every deploy.
- **With fnox:** keep it in fnox, in whichever provider you like. fnox's docs (v1.42.0) list the OS keychain on macOS, Windows and Linux, 1Password, Bitwarden, age-encrypted files, KeePass, pass and gopass, HashiCorp Vault, Doppler, Infisical, AWS, GCP and Azure secret managers, and more. A personal choice goes in a gitignored `fnox.local.toml`.
- **Without fnox:** keep it in a gitignored `mise.local.toml` with mode 600. That's the same protection wrangler gives its own login file by default.
- **In CI:** pass it as a secret.

**A guard against stray tokens.** A `CLOUDFLARE_API_TOKEN` left in the shell or in a `.env` silently beats every login. Outside CI, the tasks refuse to run while one is set.

## Each repo's footprint

A repo declares a few lines and copies no scripts:

```toml
# mise.toml
[tools]
"npm:cf" = "1.0.0-beta.20"   # only in repos that make tokens

[task_config]
includes = ["git::https://github.com/joeblew999/.github.git//tasks/cloudflare?ref=<tag>", "mise-tasks"]
```

Then one tokens file for each token the repo needs. For example, `cloudflare/tokens/icelight.json`:

```json
{
  "$comment": "icelight's query Worker reads Basin with this, and his sink writes with it",
  "name": "basin-cube icelight",
  "permissionGroups": ["Workers R2 Data Catalog Write", "Workers R2 SQL Read", "Workers R2 Storage Write", "Workers Scripts Read"],
  "expiresDays": 365,
  "deliver": "store:ICELIGHT_API_TOKEN"
}
```

The rest is what wrangler already supports: bindings without IDs, `secrets.required`, and `.dev.vars.example`. The repo holds no account ID, no resource ID, no token value, and no fnox entry for Cloudflare.

The shared tasks belong to a `cloudflare` component and use only the fixed verbs:

| Task | What it does |
|---|---|
| `cloudflare:setup` | Logs in if needed: `wrangler login`, plus `cf auth login` when the repo has tokens files. Refuses a stray token. Ends with status |
| `cloudflare:status` | Shows who is logged in, to which account, and the Workers Paid plan if the repo needs it. For each tokens file: whether the token exists in Cloudflare, when it expires, and whether its value is available here |
| `cloudflare:token:setup <name>` | Creates the account token from its file, or fixes its permissions in place. Delivers the value to the file's target (a store, a Worker secret or a GitHub secret) and never prints it |
| `cloudflare:token:teardown <name>` | Deletes the token in Cloudflare and the stored value here |
| `cloudflare:token:test` | Runs teardown, status, setup, status: what `icelight:token:test` does today |
| `cloudflare:test` | The rules check. Fails if a tracked file holds an account ID, a resource ID or a token; if `.env` or `.dev.vars` isn't ignored; if a task reads the keychain directly; or if a stray token is set |

**Without `cf`:** setup prints the dashboard link with the same permissions already filled in ([token template URLs](https://developers.cloudflare.com/fundamentals/api/how-to/account-owned-token-template/)). The person creates the token there and pastes it once.

## The proof in basin-cube

What changes in basin-cube:

| Today | Becomes |
|---|---|
| `cloudflare:setup`: `wrangler login`, our account ID into fnox, then you paste a `dev` token ([setup](../mise-tasks/cloudflare/setup)) | `wrangler login` plus `cf auth login`. No account ID stored, no token |
| `cloudflare:status`: checks the dev token | Checks both logins, the account, the plan and the tokens files. Refuses a stray token |
| `icelight:token:*`: the dev token makes the `icelight` token and puts it in the keychain | `cloudflare:token:*` with `cloudflare/tokens/icelight.json`, made with your `cf` login |
| `icelight:deploy` and `icelight:teardown`: `load_secrets` runs `fnox exec` against the keychain ([helpers](../mise-tasks/icelight/.helpers.sh)) | They read `ICELIGHT_API_TOKEN` from the environment, and use fnox only if you do. `as_wrangler_login` stays: it's the stray-token guard. In CI it keeps the token instead |
| `app:deploy`: creates D1, then writes its ID into `wrangler.jsonc` with `sed` | The binding has no ID, wrangler creates the database, and migrations run after |
| `mise.toml` `[env]`: our account ID and `gedw99.workers.dev` | Worked out from whoever is logged in |
| [fnox.toml](../fnox.toml): the dev token, account ID and icelight token, under the same keys remy-auth uses | Only the icelight token, under a basin-cube key, with `if_missing = "warn"` |
| Rule 7 in [mise.toml](../mise.toml), README "Get started" and CLAUDE.md | They say: log in; tasks read environment variables; fnox is optional |
| New: `cloudflare:test`, run in `3:test` | The rules check and the stray-token guard |
| New: a `deploy.yml` workflow that you start by hand | Clone to deploy on a fresh runner, with only CI secrets, using throwaway names |

The steps run one at a time. I show the real output after each, and stop at any failure without working around it.

1. **Check the two things nobody has run yet.**
   1. `cf auth login`, then make one throwaway account token that expires after 1 hour, verify it, and delete it.
   2. Find out whether a `cf` login can also list and delete account tokens. The changelog only promises create. If it can't, teardown uses the dashboard link instead.

   Needs your OK, because it creates a token.
2. **Rules check, read-only.** `cloudflare:test` fails on today's repo. It lists `CF_DASH_URL`, the `database_id`, the dev token in fnox, and the tasks that read only the keychain.
3. **icelight's token from its file.**
   1. Run `cloudflare:token:test`: teardown, status, setup, status.
   2. Then `icelight:deploy` and `icelight:test`, which counts events through his cube API, the real path.
4. **app without IDs.** Run `app:deploy` and `app:test --prod`, then check that `git status` shows nothing.
5. **A fresh developer, with no account.** In a temporary clone, with an empty home folder (no keychain, no fnox, no wrangler or cf login):
   1. `mise install`, then `3:test`, which passes.
   2. `4:deploy`, which stops at once with "log in: mise run cloudflare:setup".
6. **A fresh developer deploys.** In the same clone:
   1. `cloudflare:setup`: you click Allow twice.
   2. `4:deploy`, `5:status` and `6:teardown`.

   Nothing is read from your Mac's keychain.
7. **CI deploys.**
   1. Make the `ci` and `ci-icelight` tokens straight into GitHub secrets. With no `wrangler login` in CI, his code runs on the `ci` token. His docs say that token then needs Basin Pipelines Edit, plus Workers, KV and D1 edit, so its file lists those.
   2. Run `deploy.yml` once, using `-ci` names: `1:setup`, `4:deploy`, `app:test --prod`, `icelight:test`, `6:teardown`.

   Needs your OK, because GitHub secrets are outward-facing.
8. **Another account.** Someone repeats steps 5 and 6 on their own account, or on a second account of yours.
9. **Retire the dev token in basin-cube.** Remove it from the tasks, `fnox.toml` and README. Write dated findings in `docs/cloudflare/findings.md`.

It's done when:
- a fresh clone deploys with two logins and nothing else;
- CI deploys with only its own tokens;
- nothing in the repo mentions a `dev` token.

## Rollout to the other repos

1. **Move the shared tasks.** Once proven, the `cloudflare` tasks move into joeblew999/.github, the repos' shared task library. It is pinned by tag and tested on three operating systems. basin-cube then includes them from there.
2. **Find what each repo must change.** Run `cloudflare:test` read-only over every repo. The result is one table listing each repo's changes.
3. **Change each repo.** The changes are mechanical:
   - add the include;
   - drop `CLOUDFLARE_*` from `fnox.toml`;
   - delete the copied token scripts;
   - remove IDs from bindings;
   - add tokens files only where CI deploys or a Worker calls the API.
4. **Fix CI.**
   - The six repos holding the copied token each get their own `ci` token in that secret. Simple ones can move to Workers Builds instead.
   - Fix or delete ifc-lite's workflow, which has no secrets, and authz-core's, which has its token line commented out.
5. **Delete what's left.** Each item needs your OK, once nothing uses it:

| What | Where |
|---|---|
| The `dev` user token, and the keychain entries `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard; macOS keychain, service `fnox` |
| The copied GitHub secrets | auth-service, plat-trunk, irgo, charter, fleet-api, ubuntu-website |
| Plaintext tokens (roll them first) | ubuntu-website `.env`, xplat `.env`, plat-trunk `.env.local`, irgo-windows-vm `.env.r2`; the five plain values in `~/.config/fnox/config.toml` (and set that file to mode 600) |
| The second token that edits tokens, and its script | remy-sport `scripts/lib/moq-permission.ts`, `CLOUDFLARE_TOKEN_ADMIN_TOKEN` |
| Copied token tooling | auth-service `cf:token:*`; charter `cloudflare:secrets`; `.github` `cf:token-check`; basin-cube `icelight:token:*`; Miniflare-app-budget's parent-token flow |
| Stale includes and lists | `FNOX_SYNC_KEYS` in 8 repos; ifc-lite's include of `?ref=v0.20.0`; remy-video and remy-auth-app-layout including remy-auth tasks that no longer exist; remy-sport-preview's include by absolute path |
| Our account ID, hard-coded | remy-sport and remy-sport-authz-fix `wrangler.toml`; ubuntu-website `Taskfile.yml` and `internal/cfanalytics/cloudflare.go` |
| Old names | `CF_API_TOKEN`, `CF_ACCOUNT_ID` and `CF_TOKEN` in our own code. Forks such as icelight and mailflare keep theirs |

## Open decisions

| # | Decision | Recommendation |
|---|---|---|
| 1 | Where the shared tasks live. Note: on 2026-09-30, 15 repos stopped including joeblew999/.github's tasks, its Cloudflare provisioning among them (each has a `MISE-RETIREMENT.md`). Sharing tasks from there again reverses that | joeblew999/.github, after the proof in basin-cube; or, if the retirement stands, one versioned tool the repos pin in `[tools]` instead of an include |
| 2 | One login per account, or one per repo. The same-day draft `PLAN-CF.md` (not committed) proposes a wrangler profile per repo | One per account: the default login, or one profile bound to the folder holding all the repos. One per repo means about 90 browser logins for each developer. Cloudflare's examples use profiles to keep accounts apart, not repos |
| 3 | Depend on `cf` while it's in beta | Yes, but only to make tokens, pinned to an exact version. The fallback is the dashboard template link. wrangler stays for building and deploying |
| 4 | Deploys from CI | Only basin-cube's proof job for now. After that, per repo: Workers Builds where the deploy is a plain `wrangler deploy`, and GitHub Actions with the repo's own `ci` token otherwise |
| 5 | Where a token that must survive is kept | In fnox for developers who use it, with any provider. Otherwise a gitignored `mise.local.toml` (mode 600). fnox isn't required |
| 6 | Token expiry | CI tokens after 90 days, runtime tokens after 365. Status warns 30 days ahead, and renewing is one task |
| 7 | Team access to our account | Members in a "developers" User Group with Developer Platform roles. API Token Provisioning for maintainers only |
| 8 | CI without stored tokens, through a community OIDC broker | Not now. Wait for Cloudflare to offer it |
| 9 | The plaintext token copies | Roll them now, before the rollout, because they work today |
