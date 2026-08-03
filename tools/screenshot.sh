#!/usr/bin/env bash
#
# Visual QA — render the app headlessly and write PNGs to tools/shots/.
#
# WHY THE ODD CHROME PATH: the snap wrapper (/snap/bin/chromium) exits silently
# with no output under automation. The real binary inside the snap works fine.
# If you have a non-snap Chrome, set CHROME=/path/to/chrome instead.
#
#   ./tools/screenshot.sh              all screens, both themes
#   ./tools/screenshot.sh today dark   one screen

set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/snap/chromium/current/usr/lib/chromium-browser/chrome}"
[ -x "$CHROME" ] || { echo "No chrome at $CHROME — set CHROME=/path/to/chrome" >&2; exit 1; }

PORT=8199
OUT=tools/shots
mkdir -p "$OUT"

# A seed page: signs in, plants realistic progress, then hands off to the app.
# Generated per-run and removed afterwards so fake data never lands in the repo.
SEED=_seed.$$.html
cat > "$SEED" <<'HTML'
<!doctype html><meta charset=utf-8><title>seed</title><script>
const p = new URLSearchParams(location.search);
localStorage.setItem('preptrack.identity', JSON.stringify({
  email:'you@example.com', name:'Aspirant', signedInAt:new Date().toISOString()}));
localStorage.setItem('preptrack.ibps2026', JSON.stringify({
  version:2, createdAt:'2026-08-03T04:00:00Z', lastBackupAt:null,
  settings:{theme:p.get('t')||'dark', updatedAt:'2026-08-03T04:00:00Z'},
  days:{'1':{blocks:{},questionsSolved:62,notes:'',completedAt:null}},
  topics:{'r-linear-single':{untimed:20,timed:18,correct:33,firstStudied:'2026-08-03',
            revisions:[{due:'2026-08-03',offset:1,done:false}]},
          'q-calc':{untimed:30,timed:25,correct:44,firstStudied:'2026-08-03',
            revisions:[{due:'2026-08-03',offset:1,done:false}]}},
  mocks:[{id:'m1',date:'2026-08-16',stage:'prelims',total:52.5,attempted:74,correct:63,accuracy:0.851,largestBucket:'Selection',errorsLogged:4},
         {id:'m2',date:'2026-08-23',stage:'prelims',total:58.25,attempted:78,correct:66,accuracy:0.846,largestBucket:'Slow',errorsLogged:5},
         {id:'m3',date:'2026-08-30',stage:'prelims',total:64,attempted:80,correct:70,accuracy:0.875,largestBucket:'Selection',errorsLogged:3}],
  errors:[{id:'e1',date:'2026-08-16',bucket:'Selection',whatWentWrong:'chased a floor puzzle for 4 minutes'},
          {id:'e2',date:'2026-08-16',bucket:'Selection',whatWentWrong:'attempted a caselet DI'},
          {id:'e3',date:'2026-08-23',bucket:'Slow',whatWentWrong:'re-counted seats instead of using arithmetic'},
          {id:'e4',date:'2026-08-23',bucket:'Silly',whatWentWrong:'misread 3rd-to-left as 3rd-from-end'},
          {id:'e5',date:'2026-08-30',bucket:'Concept',whatWentWrong:'successive discount formula'}],
  deletedIds:[], syncMeta:{provider:null,fileId:null,lastSyncedAt:null,lastRemoteModifiedTime:null}}));
location.replace('./#/' + (p.get('v')||'today'));
</script>
HTML

python3 -m http.server $PORT >/dev/null 2>&1 &
SERVER=$!
cleanup() { kill $SERVER 2>/dev/null || true; rm -f "$SEED"; }
trap cleanup EXIT
sleep 1.5

shoot() { # view theme WxH name
  # A FRESH profile every shot. Reusing one leaves a registered service worker
  # behind, which then serves the previous build's cached bundle and you spend an
  # hour debugging a change that actually shipped fine.
  local PROFILE
  PROFILE="$(mktemp -d)"
  timeout 60 "$CHROME" --headless --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --user-data-dir="$PROFILE" --window-size="$3" \
    --virtual-time-budget=9000 --hide-scrollbars \
    --screenshot="$OUT/$4.png" \
    "http://localhost:$PORT/$SEED?v=$1&t=$2" 2>/dev/null || true
  rm -rf "$PROFILE"
  printf "  %-18s %8s bytes\n" "$4.png" "$(stat -c%s "$OUT/$4.png" 2>/dev/null || echo 0)"
}

if [ $# -ge 1 ]; then
  shoot "$1" "${2:-dark}" "${3:-430,1500}" "$1-${2:-dark}"
else
  shoot today    dark  430,1600  today-dark
  shoot today    light 430,1600  today-light
  shoot week     dark  1280,1000 week-desktop
  shoot week     dark  430,1400  week-mobile
  shoot plan     dark  430,1200  plan-dark
  shoot mocks    dark  430,1600  mocks-dark
  shoot progress dark  430,1700  progress-dark
  shoot settings light 430,1400  settings-light
fi
echo "  → $OUT/"
