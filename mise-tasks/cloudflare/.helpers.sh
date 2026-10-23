# Shell helpers for the cloudflare tasks. Source with: . "$(dirname "$0")/.helpers.sh"

# wrangler's own login as JSON ({loggedIn, email, accounts}), or nothing. Uses the app's wrangler.
wrangler_whoami() { (cd "$APP_DIR" && env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_ACCOUNT_ID aube exec wrangler whoami --json 2>/dev/null) || true; }

# A secret from fnox (the keychain), or nothing if it isn't there. Never printed.
fnox_secret() { fnox get "$1" 2>/dev/null || true; }

# Cloudflare API call with a token: cf_api <token> <path>
cf_api() { curl -s -H "Authorization: Bearer $1" "https://api.cloudflare.com/client/v4$2"; }

# How to make the dev token, for status and setup.
dev_token_help() {
  cat <<HELP
  Create it at https://dash.cloudflare.com/profile/api-tokens
    Create Token -> Create Custom Token -> name it "dev"
    Permissions:       Account | Account API Tokens | Edit
                       Account | Billing | Read          (optional: lets cloudflare:status check the Workers Paid plan)
    Account Resources: Include | your account
    Create Token, copy it
HELP
}
