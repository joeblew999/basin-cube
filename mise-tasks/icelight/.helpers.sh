# Shell helpers for the icelight tasks (this folder and token/). Source with: . "$(dirname "$0")/.helpers.sh"
# (from token/: . "$(dirname "$0")/../.helpers.sh"). Kept inside the folder so icelight's tasks depend on nothing outside it.

# Re-runs the calling task under fnox, so it gets the Cloudflare credentials from the keychain (see fnox.toml).
load_secrets() { [ -n "${FNOX_LOADED:-}" ] || FNOX_LOADED=1 exec fnox exec -- "$0" "$@"; }

# Prints up / unreachable / not serving for a URL.
url_state() {
  case $(curl -s -o /dev/null -m 5 -w '%{http_code}' "$1") in
    2??|3??) echo "up" ;;
    000) echo "unreachable" ;;
    *) echo "not serving" ;;
  esac
}

# Writes $ICELIGHT_DIR/.env for his launch and teardown: the project name and our current icelight token (needs load_secrets).
# Keeps what his launch adds itself, such as the ingest key.
write_icelight_env() {
  local env="$ICELIGHT_DIR/.env"
  touch "$env"
  { echo "ICELIGHT_PROJECT_NAME=icelight"; echo "ICELIGHT_API_TOKEN=$ICELIGHT_API_TOKEN"; grep -vE '^ICELIGHT_(API_TOKEN|PROJECT_NAME)=' "$env" || true; } > "$env.new"
  mv "$env.new" "$env"
}

# Runs a command of his with wrangler's own login, as his launch and teardown expect. load_secrets exports our dev token as
# CLOUDFLARE_API_TOKEN, which wrangler would use instead, and the dev token can't enable a Basin Catalog.
as_wrangler_login() { env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_ACCOUNT_ID "$@"; }
