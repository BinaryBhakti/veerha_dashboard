#!/bin/bash
# Build the client-facing deploy folder for the Veerha prototype.
#
# Ships: the hub (as index.html), the dashboard, all 52 screens, the design
# system and the before/after gallery with both sets of screenshots.
# Excludes: notes and internal docs (HANDOFF.md, MANIFEST.md, ADD-ONS.md — that
# last one is a pricing document), the tooling, the WhatsApp reference image,
# the byte-identical "copy" of the dashboard, the unused mobile captures, and
# the internal audit index that gallery.html replaces.
set -e
cd "$(dirname "$0")/.."

# The Vercel project link must survive a rebuild, or the next deploy creates a
# second project.
[ -d dist/.vercel ] && mv dist/.vercel /tmp/veerha-vercel-link
rm -rf dist
mkdir -p dist/audit
[ -d /tmp/veerha-vercel-link ] && mv /tmp/veerha-vercel-link dist/.vercel

printf '.env*\n.vercel\n.auth.json\n' > dist/.vercelignore

# --- pages -----------------------------------------------------------------
cp hub.html                dist/index.html
cp veerha-dashboard.html   dist/
cp -R screens              dist/screens
cp -R design-system        dist/design-system
cp audit/gallery.html      dist/audit/gallery.html
cp -R audit/after          dist/audit/after
cp -R audit/screens        dist/audit/screens      # the "before" captures

# The hub is hub.html in the source tree and index.html in the deploy, so every
# back-link is written to hub.html and rewritten here. That way both the source
# tree and dist pass a link check -- neither has a link pointing at a file that
# only exists in the other.
find dist -name '*.html' -print0 | xargs -0 sed -i '' \
  -e 's#href="\.\./hub\.html"#href="../index.html"#g' \
  -e 's#href="hub\.html"#href="index.html"#g'

# --- secret-bearing captures must not ship ---------------------------------
# The live app renders a webhook endpoint with a 32-hex token as if it were a
# customer memory, so the screenshot of that page carries a working credential.
# Any capture whose text dump contains a token-shaped string is dropped from the
# bundle along with its mobile and interaction-state variants. This is a scan,
# not a hand-maintained list, so a new leak is caught on the next build.
# A bare 32-hex run is the workspace key this product puts in URL query
# parameters (?key=...). The first version of this scan only looked for
# prefixed tokens and missed it on two further screens, so match the raw
# shape too. UUIDs contain dashes and do not match.
SECRET_RX='hooks/[0-9a-f]{24,}|[?&][A-Za-z_]+=[0-9a-f]{32}|\b[0-9a-f]{32}\b|sk_[a-zA-Z0-9]{16,}|Bearer [A-Za-z0-9._-]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}'
dropped=0
for t in audit/text/*.txt; do
  [ -e "$t" ] || continue
  if grep -qE "$SECRET_RX" "$t" 2>/dev/null; then
    n=$(basename "$t" .txt)
    rm -f "dist/audit/screens/$n.png" "dist/audit/screens-mobile/$n.png" "dist/audit/after/$n"*.png
    rm -f dist/audit/states/"$n"--*.png 2>/dev/null
    echo "  withheld (token in page): $n"
    dropped=$((dropped+1))
  fi
done
echo "  secret scan: $dropped capture(s) withheld"

# --- strip what must not ship ----------------------------------------------
rm -f  dist/screens/_partials.html
find dist \( -name '*.md' -o -name '*.cjs' -o -name '*.py' -o -name '.DS_Store' \
          -o -name '* copy.html' -o -name '.env*' -o -name '.auth.json' -o -name '*.tmp.*' \) \
     -not -path 'dist/.vercelignore' -delete 2>/dev/null || true
rm -rf dist/tools dist/.vercel/cache
# design-system/ and screens/ are their own Vercel projects; their .vercel links
# and vercel.json must not travel into this bundle. A nested .vercel has already
# caused a deploy to retarget the wrong project once.
find dist -mindepth 2 -name '.vercel' -type d -prune -exec rm -rf {} + 2>/dev/null || true
find dist -mindepth 2 \( -name 'vercel.json' -o -name '.gitignore' -o -name '.vercelignore' \) -delete 2>/dev/null || true

cat > dist/vercel.json <<'JSON'
{
  "cleanUrls": false,
  "trailingSlash": false,
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "X-Robots-Tag", "value": "noindex, nofollow, noarchive" }
    ]}
  ]
}
JSON

html=$(find dist -name '*.html' | wc -l | tr -d ' ')
png=$(find dist -name '*.png'  | wc -l | tr -d ' ')
echo "dist: ${html} html · ${png} png · $(du -sh dist | cut -f1)"

# these must never appear in a client-facing bundle
for bad in HANDOFF.md MANIFEST.md ADD-ONS.md 'veerha-dashboard copy.html' .auth.json AUDIT.md \
           FEATURES.md features.html interactions.json .inter-done.json .inter-done.hollow.json \
           guest-links.json; do
  found=$(find dist -name "$bad" | head -1)
  [ -n "$found" ] && { echo "REFUSING: $bad leaked into dist"; exit 1; }
done
[ -d dist/tools ] && { echo "REFUSING: tools/ leaked into dist"; exit 1; }
[ -d dist/audit/states ] && { echo "REFUSING: audit/states (live-account interaction shots) leaked into dist"; exit 1; }
[ -d dist/audit/text ]   && { echo "REFUSING: audit/text (live-account page dumps) leaked into dist"; exit 1; }
find dist -name 'guest-*' | grep -q . && { echo "REFUSING: a guest capture leaked into dist"; exit 1; }
find dist -name '*.jpeg' -o -name '*.jpg' | grep -qi whatsapp && { echo "REFUSING: WhatsApp image leaked"; exit 1; }
echo "exclusions verified"
