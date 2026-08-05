#!/usr/bin/env bash
#
# Run the silent-renewal auth test in headless Chrome.
#
# It has to be a real browser: the whole point is platform behaviour no Node shim
# can model — iframe creation, postMessage origin checks, and above all whether
# anything opens a popup. See tools/screenshot.sh for why this chrome path is odd.
set -uo pipefail
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/snap/chromium/current/usr/lib/chromium-browser/chrome}"
[ -x "$CHROME" ] || { echo "No chrome at $CHROME — set CHROME=/path/to/chrome" >&2; exit 1; }

PORT="${PORT:-8231}"
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT

# Wait for the server rather than guessing at a sleep.
for _ in $(seq 1 40); do
  if python3 -c "import socket,sys; s=socket.socket(); s.settimeout(.2); sys.exit(0 if s.connect_ex(('127.0.0.1',$PORT))==0 else 1)"; then break; fi
  sleep 0.25
done

DOM=$(timeout 90 "$CHROME" --headless --disable-gpu --no-sandbox \
        --virtual-time-budget=15000 \
        --dump-dom "http://localhost:$PORT/tools/auth-flow-test.html" 2>/dev/null || true)

OUT=$(printf '%s' "$DOM" | python3 -c \
  "import sys,re,html; m=re.search(r'<pre id=\"out\">([\s\S]*?)</pre>', sys.stdin.read()); print(html.unescape(m.group(1)) if m else '')")

if [ -z "$OUT" ]; then
  echo "auth-test: the page produced no result block." >&2
  printf '%s\n' "$DOM" | head -40 >&2
  exit 1
fi

echo "$OUT"
printf '%s' "$OUT" | grep -q "ALL .* CHECKS PASSED"
