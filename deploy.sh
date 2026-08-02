#!/usr/bin/env bash
#
# Deploy PrepTrack to GitHub Pages.
#
# Bumps the service-worker cache version, commits everything, and pushes.
# The cache bump is the whole point: without it the old service worker keeps
# serving stale files and your changes appear not to have deployed at all.
#
#   ./deploy.sh "what changed"

set -euo pipefail
cd "$(dirname "$0")"

MSG="${1:-Update PrepTrack}"

# ---------------------------------------------------------------- cache bump
CURRENT=$(grep -oP "const CACHE = 'preptrack-v\K[0-9]+" sw.js)
NEXT=$((CURRENT + 1))
sed -i "s/const CACHE = 'preptrack-v${CURRENT}'/const CACHE = 'preptrack-v${NEXT}'/" sw.js
echo "  service worker cache: v${CURRENT} → v${NEXT}"

# ---------------------------------------------------------------- sanity checks
if grep -rn "GOCSPX\|client_secret *[:=] *['\"]" --include='*.js' --include='*.json' . 2>/dev/null \
   | grep -v "never\|must never\|Ignore the client"; then
  echo "  ✗ ABORT: something that looks like a client secret is in the source." >&2
  exit 1
fi

for f in index.html sw.js manifest.webmanifest js/app.js js/config.js; do
  [ -f "$f" ] || { echo "  ✗ ABORT: missing $f" >&2; exit 1; }
done

if command -v node >/dev/null 2>&1; then
  while IFS= read -r f; do
    node --check "$f" >/dev/null 2>&1 || { echo "  ✗ ABORT: syntax error in $f" >&2; exit 1; }
  done < <(find js -name '*.js')
  echo "  syntax: all modules OK"
fi

# ---------------------------------------------------------------- ship
git add -A
if git diff --cached --quiet; then
  echo "  nothing to commit"
else
  git commit -q -m "$MSG"
  echo "  committed: $MSG"
fi

git push -u origin main
echo
echo "  Live shortly at: https://joyboy-3.github.io/ibps-preptrack/"
echo "  Pages usually takes 30-60s to rebuild."
