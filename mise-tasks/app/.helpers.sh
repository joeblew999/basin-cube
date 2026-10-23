# Shell helpers for the app tasks in this folder. Source with: . "$(dirname "$0")/.helpers.sh"

# Prints up / unreachable / not serving for a URL.
url_state() {
  case $(curl -s -o /dev/null -m 5 -w '%{http_code}' "$1") in
    2??|3??) echo "up" ;;
    000) echo "unreachable" ;;
    *) echo "not serving" ;;
  esac
}

# Exits with a hint unless a cube Worker answers at the given URL.
require_worker() {
  curl -sf -o /dev/null "$1/cubejs-api/v1/meta" || { echo "No Worker at $1. Start it with: mise run app:dev" >&2; exit 1; }
}
