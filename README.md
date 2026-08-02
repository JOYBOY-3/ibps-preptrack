# PrepTrack — IBPS Clerk 2026

A browser-based study companion for IBPS Clerk 2026. It tells you what to study for
the next four hours, tracks whether you did it, and shows what is slipping.

**147 days · 3 Aug 2026 → 27 Dec 2026 · 4 hours a day.**

- **Prelims** — 10 & 11 October 2026
- **Mains** — 27 December 2026

Zero dependencies. No build step. No server. Everything is stored in your browser.

---

## Run it

Service workers and ES modules need `http://`, not `file://`:

```bash
cd ibps-preptrack
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

**On your phone** (same Wi-Fi): find your computer's IP with `hostname -I`, then visit
`http://<that-ip>:8080` and use *Add to Home Screen*. It installs as a real app and
works completely offline after the first load.

---

## What ships in M1

| Area | Status |
|---|---|
| Curriculum — all 147 days, 5 phases | ✅ |
| 147 topics with tier + 5-year weightage | ✅ |
| 29 resources — books, channels, test series, current affairs | ✅ |
| **Today** view — 6 blocks, resources, complete toggles | ✅ |
| **Plan** view — every day grouped by phase | ✅ |
| **Progress** view — stats, streak, countdowns, phase bars | ✅ |
| **Settings** — theme, export, import, reset | ✅ |
| localStorage persistence + JSON backup | ✅ |
| Spaced revision scheduling (N+1 / N+7 / N+21) | ✅ |
| Responsive — phone, tablet, desktop | ✅ |
| Dark + light themes with manual override | ✅ |
| PWA — installable, offline | ✅ |
| **Week** table view | M2 |
| Mock log + score charts | M3–M4 |
| Error bucket tracker + mock gating | M4 |

---

## The four rules the app enforces

The plan already exists on paper. An app is only worth building if it enforces
behaviour paper cannot.

1. **No partial credit.** A day completes only when *all* blocks are done. Five of six
   reads as incomplete — that kills the "I studied a bit today" self-deception.
2. **Analysis is not optional.** (M4) A mock cannot be saved until at least one error
   is logged with a bucket tag.
3. **Revision surfaces itself.** Completing a topic schedules revisits at N+1, N+7 and
   N+21. The due queue sits at the top of Today.
4. **The streak is honest.** Consecutive complete days only. It breaks. That's the point.

---

## Architecture

Three strictly separated layers. Data never touches the DOM; views never touch storage.

```
DATA (static, 147 days)  →  STATE (progress, persisted)  →  VIEWS (pure render)
                                    ↑                              │
                                    └────────── actions ───────────┘
```

```
index.html              app shell only
manifest.webmanifest    PWA metadata
sw.js                   cache-first service worker
css/
  tokens.css            every colour, type and spacing decision
  base.css              reset + typography
  layout.css            app shell, nav, breakpoints
  components.css        cards, chips, buttons, banners
js/
  app.js                bootstrap + hash router
  data/                 phases · curriculum · topics · resources
  state/                store · actions · selectors · persist
  views/                today · plan · progress · settings
  components/           blockCard · icons
  utils/                dom · dates · ui
```

Routing is hash-based (`#/today`, `#/today/12`, `#/plan`) so it works from any static
host and any sub-path with no server configuration.

---

## Backup — read this

Everything lives in `localStorage` in **one browser on one device**. That is what makes
the app work offline with no account. It also means:

> Clearing browsing data deletes all your progress.

**Export a backup weekly.** Settings → Export downloads a JSON file with every day,
topic, mock and error. The app nags you if it has been more than seven days.

---

## Data provenance

Exam dates, pattern and vacancy figures come from IBPS Clerk 2026 (CRP CSA-XVI)
notification coverage as of 2 August 2026.

Topic weightages are 5-year averages (2021–2025) aggregated from **memory-based shift
analyses** — IBPS does not release official papers. Individual numbers carry roughly
±2 questions of noise; the *ranking* has been stable for eight years and is what the
tier system relies on.

**Two things to verify against the official notification PDF at [ibps.in](https://www.ibps.in/):**

1. Mains total duration — sources disagree between 120 and 125 minutes
2. Whether Computer Aptitude is still part of the Reasoning section

Both affect the P3–P5 curriculum. They are data-only edits in `js/data/`.

---

## Development

```bash
node --check js/app.js          # syntax
node --check js/data/curriculum.js
```

The curriculum is generated, not hand-written: `js/data/curriculum.js` builds all 147
days from compact per-phase tables. Every study day's blocks total exactly 240 minutes —
if you edit a phase template in `js/data/phases.js`, keep that invariant.
