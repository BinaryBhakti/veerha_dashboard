#!/usr/bin/env bash
# =============================================================================
# VEERHA — deploy both projects, or verify what is live.
#
# WHY THIS EXISTS
#   Two Vercel projects are served from one source tree:
#
#     design-system/   -> veerha-design-system.vercel.app   (its own .vercel link)
#     screens/         -> veerha-screens.vercel.app         (bundles a COPY of
#                                                            design-system/, because
#                                                            screens link to it with
#                                                            ../design-system/…)
#
#   Those relative links are deliberate: both folders are handed to the client and
#   opened from disk, so remote URLs would blank the pages offline and break
#   cross-origin @font-face. The cost is that design-system/ has two live copies —
#   and on 22 Sep they silently diverged for several batches. The design-system
#   project was serving CSS with no chart primitives, no expanded-rail rules and a
#   stale .num comment, because batches that only touched screens/ only redeployed
#   screens.
#
#   The fix is not to unbundle. It is that NOBODY DEPLOYS ONE PROJECT BY HAND.
#   This script is the only way in: it gates on the checks, deploys both from one
#   staged copy, then proves what is live byte-for-byte against local.
#
# USAGE
#   ./deploy.sh            gate -> deploy both -> verify
#   ./deploy.sh --verify   verify only; no deploy. Exits non-zero on any drift.
#   ./deploy.sh --check    run the gate only.
# =============================================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS="$ROOT/tools"
STAGE="${TMPDIR:-/tmp}/veerha-deploy-screens"
DS_URL=https://veerha-design-system.vercel.app
SC_URL=https://veerha-screens.vercel.app

# Files that must be identical in local, the design-system project, and the copy
# the screens project bundles. This list is the contract.
SHARED=(system/tokens.css system/base.css system/components.css system/sheet.css system/fonts.css)
PAGES=(index foundations components patterns spec departures)

# Identifiers from the live-app crawl. If any reaches a deploy we have shipped real
# customer data. This has been caught twice; it stays a hard gate.
PII='gaurav|meera|anuj|rakesh|bharat|shalini|farah|poorav|ganga|amoha|gpurwar|desaiassociates|RNMDGS|98111|99870|90042|98204|88006|97401|98330|90045'

red(){ printf '\033[31m%s\033[0m\n' "$*"; }; grn(){ printf '\033[32m%s\033[0m\n' "$*"; }
fail(){ red "  FAIL — $*"; exit 1; }
hdr(){ printf '\n\033[1m%s\033[0m\n' "$*"; }

# ---------------------------------------------------------------- gate --------
gate() {
  local out rc

  # Each check runs ONCE and its output is captured, then inspected. Piping a
  # long-running node process into `grep -q` under `set -o pipefail` reports a
  # FALSE failure: grep exits on its first match, node takes SIGPIPE, and the
  # pipeline's status becomes node's. Capture first, match second.

  hdr "1 · render checks"
  out=$(node "$TOOLS/check.cjs" 2>&1)   || fail "screens render check did not run"
  echo "$out" | tail -3 | sed 's/^/  /'
  echo "$out" | grep -q 'PROBLEM' && fail "screens render check"

  out=$(node "$TOOLS/dscheck.cjs" 2>&1) || fail "design-system render check did not run"
  echo "$out" | tail -1 | sed 's/^/  /'
  echo "$out" | grep -q 'PROBLEM' && fail "design-system render check"

  hdr "2 · walkthrough"
  out=$(node "$TOOLS/wtdrive.cjs" 2>&1) || fail "walkthrough driver did not run"
  echo "$out" | tail -6 | sed 's/^/  /'
  echo "$out" | grep -q 'broken: none' || fail "walkthrough has broken links"
  echo "$out" | grep -q 'no JS errors' || fail "walkthrough threw a JS error"
  echo "$out" | grep -q 'PROBLEM'      && fail "$(echo "$out" | grep 'PROBLEM' | head -1)"

  hdr "3 · sidebar collapse"
  out=$(node "$TOOLS/rail.cjs" 2>&1)    || fail "rail test did not run"
  echo "$out" | tail -2 | sed 's/^/  /'
  echo "$out" | grep -q '\"railW\":240' || fail "rail does not expand"

  hdr "4 · no forked components"
  out=$(python3 "$TOOLS/forkcheck.py" 2>&1); rc=$?
  echo "  $out"
  [ $rc -ne 0 ] && fail "a screen uses a class the design system does not define"

  hdr "5 · token discipline"
  grep -qE '#[0-9A-Fa-f]{3,8}' "$ROOT"/screens/assets/*.css && fail "raw hex in screens css"
  grep -qE 'border-radius: *[0-9]+px' "$ROOT"/screens/assets/*.css && fail "bare px radius in screens css"
  echo "  no raw hex, no bare radius"
  # A misremembered token name is not hex and not a radius, so the two checks
  # above sail past it -- and var(--success-50) renders as nothing at all.
  out=$(python3 "$TOOLS/tokencheck.py") || { echo "$out"; fail "a var() points at a token that is not defined"; }
  echo "$out"

  hdr "6 · PII"
  if grep -rIniE "$PII" "$ROOT/screens" "$ROOT/design-system" >/dev/null 2>&1; then
    grep -rIniE "$PII" "$ROOT/screens" "$ROOT/design-system" | head | sed 's/^/  /'
    fail "live-app data found"
  fi
  out=$(grep -rIhoE '[a-z0-9._-]+@[a-z0-9.-]+' "$ROOT/screens" "$ROOT/design-system" 2>/dev/null \
        | grep -vE '@([a-z0-9-]+\.)*(example|invalid|test|localhost)(\.(com|net|org))?$|@company\.com$' | sort -u)
  [ -n "$out" ] && { echo "$out" | sed 's/^/  /'; fail "email on a domain that is not reserved"; }
  echo "  clean — no crawled identifiers, every domain reserved"
  grn "
GATE PASSED"
}

# --------------------------------------------------------------- stage --------
stage() {
  hdr "7 · staging"
  rm -rf "$STAGE/screens" "$STAGE/design-system"
  cp -R "$ROOT/screens"       "$STAGE/screens"
  cp -R "$ROOT/design-system" "$STAGE/design-system"
  # nested .vercel links would retarget the deploy; the staging root's own must live
  find "$STAGE/screens" "$STAGE/design-system" -name .vercel -type d -prune -exec rm -rf {} + 2>/dev/null
  rm -f "$STAGE/screens/_partials.html"        # authoring reference, never ships
  echo "  screens: $(ls "$STAGE/screens"/*.html | wc -l | tr -d ' ') pages · design-system: $(ls "$STAGE/design-system"/*.html | wc -l | tr -d ' ') pages"
  [ -f "$STAGE/.vercel/project.json" ] || fail "staging root lost its vercel link"
}

# -------------------------------------------------------------- deploy --------
# Vercel writes progress with ANSI colour and carriage returns, so an anchored
# grep silently matches nothing and a failed deploy looks identical to a quiet
# one. Strip the control bytes, then REQUIRE a production URL.
push() {
  local name=$1 dir=$2 log url
  log=$(cd "$dir" && vercel deploy --prod --yes 2>&1); rc=$?
  # No need to strip ANSI: the URL itself contains no control bytes, so an
  # UNANCHORED match finds it whatever colouring or carriage returns surround it.
  # (Anchoring on '^\s*Production' is what silently matched nothing before.)
  url=$(printf '%s' "$log" | tr '\r' '\n' | grep -oE 'https://[a-z0-9.-]+\.vercel\.app' | tail -1)
  [ $rc -ne 0 ] && { printf '%s\n' "$log" | tr '\r' '\n' | tail -15 | sed 's/^/  /'; fail "$name deploy exited $rc"; }
  [ -z "$url" ]  && { printf '%s\n' "$log" | tr '\r' '\n' | tail -15 | sed 's/^/  /'; fail "$name deploy returned no URL"; }
  echo "  $name -> $url"
}

deploy() {
  hdr "8 · deploying design-system"
  push design-system "$ROOT/design-system"
  hdr "9 · deploying screens (carrying a fresh copy of design-system)"
  push screens "$STAGE"
  echo "  waiting for propagation…"; sleep 15
}

# -------------------------------------------------------------- verify --------
verify() {
  hdr "10 · what is actually live"
  local drift=0 L D S
  printf '  %-26s %-8s %-12s %s\n' FILE LOCAL DS-PROJECT SCREENS-COPY
  for f in "${SHARED[@]}"; do
    L=$(md5 -q "$ROOT/design-system/$f")
    D=$(curl -sfL "$DS_URL/$f" | md5 -q)
    S=$(curl -sfL "$SC_URL/design-system/$f" | md5 -q)
    [ "$D" = "$L" ] && d=MATCH || { d=DRIFT; drift=1; }
    [ "$S" = "$L" ] && s=MATCH || { s=DRIFT; drift=1; }
    printf '  %-26s %-8s %-12s %s\n' "$f" "${L:0:6}" "$d" "$s"
  done
  echo
  for p in "${PAGES[@]}"; do
    L=$(md5 -q "$ROOT/design-system/$p.html"); D=$(curl -sfL "$DS_URL/$p" | md5 -q)
    [ "$D" = "$L" ] && d=MATCH || { d=DRIFT; drift=1; }
    printf '  %-26s %-8s %s\n' "$p.html" "${L:0:6}" "$d"
  done
  echo
  for m in "$ROOT"/screens/*.html; do
    b=$(basename "$m" .html); [ "$b" = _partials ] && continue
    L=$(md5 -q "$m"); S=$(curl -sfL "$SC_URL/screens/$b" | md5 -q)
    [ "$S" = "$L" ] || { printf '  %-26s %s\n' "screens/$b.html" DRIFT; drift=1; }
  done
  [ "$(curl -s -o /dev/null -w '%{http_code}' -L "$SC_URL/screens/_partials.html")" = 404 ] \
    || { red "  _partials.html is reachable and must not be"; drift=1; }

  if [ $drift -ne 0 ]; then red "
DRIFT — live does not match local. Run ./deploy.sh"; return 1; fi
  grn "
IN SYNC — every shared file identical in local, both projects, and the bundled copy"
}

case "${1:-}" in
  --verify) verify ;;
  --check)  gate ;;
  *)        gate && stage && deploy && verify ;;
esac
