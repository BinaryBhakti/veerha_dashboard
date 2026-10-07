#!/bin/bash
# Reliable PII gate. Inline compound greps kept misreporting (an -rIlnE with a
# redirect returned "clean" while a direct grep on the same files found hits),
# so this is one script with one code path, used everywhere.
#
# Tokens are identifiers from the crawled live app plus names that appeared in
# the contaminated pitch prototype. A blocked token must not appear at all --
# an invented "Meera Sundaram" is indistinguishable from the real record to the
# gate and to a reviewer.
# Two generations of identifiers:
#  (1) from the contaminated pitch prototype (the original list), and
#  (2) from the 26 Sep crawl, which surfaced customer records the first
#      list never knew about. A builder agent used "Meera Iyer" verbatim
#      in a client-facing screen despite being told to invent everything,
#      so the gate has to know every real name, not a subset.
PII='gaurav|meera|anuj|rakesh|bharat|shalini|farah|poorav|ganga|amoha|gpurwar|desaiassociates|RNMDGS'
PII="$PII|chanpreet|shrutika|lawand|hemant|shubhankar|mukherjee|sahurishi|neetu|catpl|purwar"
PII="$PII|98111|99870|90042|98204|88006|97401|98330|90045|98819|99998|70802|82998"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# (3) names from the 7 Oct re-crawl. They live in a git-ignored file rather than
#     here, because this repository is public and a list of real customers'
#     names would itself be the leak. Present on any machine that holds audit/.
LOCAL="$ROOT/audit/oct/blocklist.txt"
[ -s "$LOCAL" ] && PII="$PII|$(grep -v '^$' "$LOCAL" | paste -sd'|' -)"
targets=("${@:-$ROOT/screens $ROOT/design-system}")
fail=0
for dir in $targets; do
  while IFS= read -r f; do
    hits=$(grep -ioE "$PII" "$f" 2>/dev/null | sort -u | tr '\n' ' ')
    if [ -n "$hits" ]; then
      printf '  BLOCKED  %-34s %s\n' "${f#$ROOT/}" "$hits"
      fail=1
    fi
  done < <(find "$dir" -name '*.html' -o -name '*.js' -o -name '*.css' 2>/dev/null)
done
[ $fail -eq 0 ] && echo "  PII gate: clean"
exit $fail
