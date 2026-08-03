/**
 * The 147-day curriculum, generated from compact per-phase tables.
 *
 * Day 1 = Mon 3 Aug 2026. Day 147 = Sun 27 Dec 2026 (Mains).
 * Every day resolves to: date, phase, week, type, topic assignments and blocks.
 */

import { START_DATE, TOTAL_DAYS, PHASES, phaseForDay } from './phases.js';
import { addDays, iso, formatShort, weekdayShort } from '../utils/dates.js';

// ------------------------------------------------------------------ P1 · days 1–45
// [reasoning, quant, english, ga] — null marks a review day
const P1 = [
  ['r-linear-single', 'q-calc',           'e-tenses',         'ga-rbi'],
  ['r-linear-double', 'q-simpl-2',        'e-sva',            'ga-rates'],
  ['r-circular',      'q-numsys',         'e-articles',       'ga-banktypes'],
  ['r-polygon',       'q-percentage',     'e-noun',           'ga-regulators'],
  ['r-inequality',    'q-ratio',          'e-adjective',      'ga-devbanks'],
  ['r-syllogism',     'q-average',        'e-rc-technique',   'ga-payments'],
  null,
  ['r-box',           'q-ages',           'e-cloze',          'ga-accounts'],
  ['r-floor',         'q-pld-1',          'e-error-1',        'ga-negotiable'],
  ['r-floor-flat',    'q-pld-2',          'e-error-2',        'ga-npa'],
  ['r-dmy',           'q-si',             'e-improvement',    'ga-moneymarket'],
  ['r-category',      'q-ci',             'e-phrase',         'ga-capitalmarket'],
  ['r-uncertain',     'q-timework',       'e-fillers',        'ga-inclusion'],
  null,
  ['r-series-alpha',  'q-pipes',          'e-parajumble',     'ga-mudra'],
  ['r-series-num',    'q-tsd',            'e-sent-rearr',     'ga-insurance'],
  ['r-coding',        'q-boats',          'e-wordswap',       'ga-budget'],
  ['r-coding-chinese','q-trains',         'e-wordrearr',      'ga-survey'],
  ['r-blood',         'q-di-table',       'e-wordusage',      'ga-intl-org'],
  ['r-direction',     'q-di-bar',         'e-oddone',         'ga-static-hq'],
  null,
  ['r-order',         'q-di-line',        'e-idioms',         'ga-static-cap'],
  ['r-wordpair',      'q-di-pie',         'e-matchcol',       'ga-days'],
  ['r-coded-ineq',    'q-di-caselet',     'e-connectors',     'ga-awards'],
  ['r-syllogism-rev', 'q-di-missing',     'e-cloze-replace',  'ga-appointments'],
  ['r-coded-blood',   'q-mixture',        'e-error-double',   'ga-summits'],
  ['r-coded-dir',     'q-partnership',    'e-paracompletion', 'ga-sports'],
  null,
  ['r-io-1',          'q-series-missing', 'e-coherent',       'ga-defence'],
  ['r-io-2',          'q-series-wrong',   'e-inference',      'ga-scitech'],
  ['r-ds-2',          'q-quadratic',      'e-phrase-swap',    'ga-books'],
  ['r-ds-3',          'q-quantity',       'e-rc-multi',       'ga-schemes-rev'],
  ['r-assumption',    'q-di-arith',       'e-rc-econ',        'ga-ranks'],
  ['r-inference',     'q-di-new',         'e-rc-social',      'ga-agreements'],
  null,
  ['r-coa',           'q-ds',             'e-cloze-mains',    'ga-state'],
  ['r-triple-row',    'q-mensuration-2d', 'e-error-mains',    'ga-committees'],
  ['r-inscribed',     'q-mensuration-3d', 'e-rc-long',        'ga-circulars'],
  ['r-blood-seating', 'q-permutation',    'e-vocab',          'ga-national-rev'],
  ['r-puzzle-marathon','q-probability',   'e-mixed',          'ga-intl-rev'],
  ['r-sectional',     'q-sectional',      'e-sectional',      'ga-banking-rev'],
  null,
  ['AUDIT',           null,               null,               'ga-audit'],
  ['MOCK6',           null,               null,               'ga-errorbook'],
  ['WEAK',            null,               null,               'ga-6week-rev']
];

const P1_REVIEW = {
  7:  'Review day — 3 sectionals, week consolidation',
  14: 'Review + FULL MOCK #1',
  21: 'Review + FULL MOCK #2',
  28: 'Review + FULL MOCK #3',
  35: 'Review + FULL MOCK #4',
  42: 'Review + FULL MOCK #5'
};

const P1_SPECIAL = {
  43: { type: 'audit', headline: 'Syllabus audit',
        detail: 'Tick every topic against the master list. Anything under 70% accuracy gets drilled today.' },
  44: { type: 'mock',  headline: 'FULL MOCK #6 + 90-minute deep analysis',
        detail: 'Complete error-notebook pass afterwards.' },
  45: { type: 'study', headline: 'Weak-topic drilling + 6-week GA revision',
        detail: 'Syllabus officially closed at the end of today.' }
};

const P1_WEEK_THEME = ['Foundations', 'Puzzles + Arithmetic Core', 'Speed Topics + DI Opens',
                       'DI Depth + Prelims Closeout', 'Mains-Specific Block',
                       'Hard Depth + Leftovers', 'Close It Out'];

// ------------------------------------------------------------------ P2 · days 46–68
// Prelims mock mode. Weak-area focus rotates; GA continues daily.
const P2_FOCUS = [
  'Reasoning — puzzles & seating',   'Quant — DI sets',            'English — RC + cloze',
  'Reasoning — series & coding',     'Quant — arithmetic word problems', 'English — error detection',
  'Reasoning — inequality & syllogism', 'Quant — simplification speed', 'English — parajumbles + fillers'
];
const P2_GA = [
  'ga-national-rev', 'ga-banking-rev', 'ga-intl-rev', 'ga-schemes-rev',
  'ga-awards', 'ga-appointments', 'ga-sports', 'ga-ranks', 'ga-circulars'
];

// ------------------------------------------------------------------ P3 · days 71–98
// Mains foundation, 28 days. [reasoning, quant, english, ga]
const P3 = [
  ['r-assumption',    'q-di-caselet',  'e-connectors',      'ga-rbi'],
  ['r-inference',     'q-di-arith',    'e-connectors',      'ga-rates'],
  ['r-coa',           'q-di-missing',  'e-coherent',        'ga-npa'],
  ['r-ds-2',          'q-di-new',      'e-paracompletion',  'ga-moneymarket'],
  ['r-ds-3',          'q-quantity',    'e-inference',       'ga-capitalmarket'],
  ['r-io-1',          'q-ds',          'e-phrase-swap',     'ga-payments'],
  ['r-io-2',          'q-di-table',    'e-rc-multi',        'ga-regulators'],
  ['r-triple-row',    'q-di-bar',      'e-rc-long',         'ga-devbanks'],
  ['r-inscribed',     'q-di-line',     'e-cloze-mains',     'ga-negotiable'],
  ['r-blood-seating', 'q-di-pie',      'e-error-mains',     'ga-accounts'],
  ['r-coded-blood',   'q-quadratic',   'e-error-double',    'ga-insurance'],
  ['r-coded-ineq',    'q-series-wrong','e-matchcol',        'ga-inclusion'],
  ['r-coded-dir',     'q-percentage',  'e-sent-rearr',      'ga-mudra'],
  ['r-coding-chinese','q-ratio',       'e-cloze-replace',   'ga-budget'],
  ['r-syllogism-rev', 'q-pld-2',       'e-vocab',           'ga-survey'],
  ['r-puzzle-marathon','q-timework',   'e-rc-econ',         'ga-intl-org'],
  ['r-assumption',    'q-tsd',         'e-rc-social',       'ga-committees'],
  ['r-inference',     'q-mixture',     'e-rc-long',         'ga-circulars'],
  ['r-io-1',          'q-di-caselet',  'e-rc-technique',    'ga-schemes-rev'],
  ['r-ds-3',          'q-di-arith',    'e-inference',       'ga-static-hq'],
  ['r-triple-row',    'q-di-new',      'e-cloze',           'ga-static-cap'],
  ['r-inscribed',     'q-quantity',    'e-rc-multi',        'ga-days'],
  ['r-blood-seating', 'q-ds',          'e-error-mains',     'ga-awards'],
  ['r-coa',           'q-di-missing',  'e-cloze-mains',     'ga-appointments'],
  ['r-puzzle-marathon','q-si',         'e-phrase',          'ga-summits'],
  ['r-sectional',     'q-sectional',   'e-sectional',       'ga-defence'],
  ['r-io-2',          'q-di-table',    'e-rc-long',         'ga-scitech'],
  ['r-assumption',    'q-di-bar',      'e-rc-econ',         'ga-banking-rev']
];

// ------------------------------------------------------------------ P4 · days 99–126
const P4_FOCUS = [
  'Mains mock — full length',        'Sectional: Reasoning + GA',
  'Mains mock — full length',        'Sectional: Quant DI + English',
  'Mains mock — full length',        'Analysis + weak-area deep dive',
  'Review — week consolidation'
];
const P4_GA = [
  'ga-awards', 'ga-appointments', 'ga-summits', 'ga-sports', 'ga-defence', 'ga-scitech',
  'ga-books', 'ga-ranks', 'ga-agreements', 'ga-state', 'ga-committees', 'ga-circulars',
  'ga-schemes-rev', 'ga-banking-rev', 'ga-banktypes'
];

/**
 * P4 revisit rotation.
 *
 * The mock engine is not only mocks. Mains re-tests the Prelims fundamentals at
 * higher difficulty — puzzles are 19 of 40 Reasoning questions and arithmetic is
 * 11 of 40 Quant questions — so each mock day also drills one heavy Reasoning and
 * one heavy Quant topic. Ordered by Mains weight, heaviest first, and long enough
 * to cycle roughly twice across the 28 days.
 */
const P4_REASONING = [
  // heaviest first, then one full pass over every Mains-weighted reasoning topic
  'r-triple-row', 'r-inscribed', 'r-linear-double', 'r-circular', 'r-box', 'r-floor',
  'r-category', 'r-uncertain', 'r-blood-seating', 'r-linear-single', 'r-polygon',
  'r-floor-flat', 'r-dmy', 'r-assumption', 'r-inference', 'r-coa', 'r-io-1', 'r-io-2',
  'r-ds-2', 'r-ds-3', 'r-coded-blood', 'r-coded-ineq', 'r-coded-dir', 'r-coding-chinese',
  'r-syllogism-rev', 'r-series-alpha', 'r-blood', 'r-direction'
];
const P4_QUANT = [
  'q-di-caselet', 'q-di-arith', 'q-di-missing', 'q-di-new', 'q-di-table', 'q-di-bar',
  'q-di-line', 'q-di-pie', 'q-quantity', 'q-ds', 'q-pld-1', 'q-pld-2', 'q-si', 'q-ci',
  'q-timework', 'q-pipes', 'q-tsd', 'q-boats', 'q-trains', 'q-mixture', 'q-partnership',
  'q-percentage', 'q-ratio', 'q-average', 'q-ages', 'q-numsys', 'q-quadratic', 'q-series-wrong'
];

// ------------------------------------------------------------------ P5 · days 127–146
const P4_ENGLISH = [
  'e-rc-long', 'e-rc-multi', 'e-cloze-mains', 'e-error-mains', 'e-sent-rearr',
  'e-connectors', 'e-rc-econ', 'e-paracompletion', 'e-rc-social', 'e-inference',
  'e-cloze-replace', 'e-matchcol', 'e-coherent', 'e-phrase'
];
const P5_REASONING = [
  'r-triple-row', 'r-inscribed', 'r-assumption', 'r-io-1', 'r-blood-seating',
  'r-inference', 'r-ds-3', 'r-coa', 'r-circular', 'r-box'
];
// P4 has 16 build days, so only its first 16 entries ever render. These are the
// arithmetic topics that fall past that line — they belong here, not in P4's tail.
const P5_QUANT = [
  'q-numsys', 'q-average', 'q-ages', 'q-boats', 'q-trains', 'q-partnership',
  'q-di-caselet', 'q-di-arith', 'q-di-new', 'q-quantity'
];
const P5_ENGLISH = [
  'e-rc-long', 'e-rc-multi', 'e-error-mains', 'e-cloze-mains', 'e-sent-rearr',
  'e-rc-econ', 'e-connectors', 'e-rc-social', 'e-inference', 'e-phrase'
];

const P5_PASS = [
  'GA revision pass 1 — July to September',
  'GA revision pass 1 — October to December',
  'GA revision pass 2 — full six months',
  'GA revision pass 3 — full six months, rapid'
];

// ------------------------------------------------------------------ builder

/**
 * Map a day's [reasoning, quant, english, ga] assignment onto the phase's block
 * template. Only the main subject block of each kind receives a topic — the
 * calculation drill is a quant block but carries no topic, so it is matched by id.
 */
const BLOCK_TOPIC_SLOT = { reas: 0, quant: 1, eng: 2, ga: 3 };

function blocksFor(day, phase, assign, extras = {}, useMockTemplate = false) {
  const template = (useMockTemplate && phase.blocksMock) ? phase.blocksMock : phase.blocks;
  return template.map(b => {
    const slot = BLOCK_TOPIC_SLOT[b.id];
    return {
      ...b,
      key: `${day}:${b.id}`,
      topicId: slot === undefined ? null : (assign?.[slot] ?? null),
      focus: extras[b.id] ?? null
    };
  });
}

function buildDay(day) {
  const phase = phaseForDay(day);
  const date = addDays(START_DATE, day - 1);
  const base = {
    day,
    date: iso(date),
    dateLabel: formatShort(date),
    weekday: weekdayShort(date),
    phaseId: phase.id,
    phaseName: phase.name,
    week: Math.ceil(day / 7),
    type: 'study',
    headline: null,
    detail: null,
    milestone: null,
    blocks: []
  };

  // ---------------------------------------------------------------- P1
  if (phase.id === 'P1') {
    const idx = day - 1;
    const assign = P1[idx];
    base.weekTheme = P1_WEEK_THEME[Math.min(Math.floor(idx / 7), 6)];

    if (assign === null) {
      base.type = 'review';
      base.headline = P1_REVIEW[day];
      base.detail = 'Consolidation day — not a rest day. Mock, analysis, 20 mixed questions per topic, ' +
                    'GA week revision, backlog clearing, then write the ONE change for next week.';
      base.blocks = [
        { id: 'mock',  label: day === 7 ? '3 sectional tests' : 'Full mock', minutes: 60, subject: null,
          note: 'Exam conditions, 9:00 AM start.', key: `${day}:mock`, topicId: null },
        { id: 'anal',  label: 'Mock analysis', minutes: 75, subject: null,
          note: 'Every question into one of the four buckets.', key: `${day}:anal`, topicId: null },
        { id: 'mixed', label: '20 mixed questions per topic', minutes: 45, subject: null,
          note: "This week's six topics, revisited together.", key: `${day}:mixed`, topicId: null },
        { id: 'ga',    label: 'GA — week revision', minutes: 30, subject: 'ga',
          note: "This week's six modules, revised together.", key: `${day}:ga`, topicId: null },
        { id: 'backlog', label: 'Backlog clearing', minutes: 15, subject: null,
          note: 'Anything that slipped during the week.', key: `${day}:backlog`, topicId: null },
        { id: 'decide', label: 'Weekly decision', minutes: 15, subject: null,
          note: 'Write down the ONE thing you change next week. One, not five.', key: `${day}:decide`, topicId: null }
      ];
    } else if (P1_SPECIAL[day]) {
      const sp = P1_SPECIAL[day];
      base.type = sp.type;
      base.headline = sp.headline;
      base.detail = sp.detail;
      base.blocks = blocksFor(day, phase, [null, null, null, assign[3]]);
    } else {
      base.blocks = blocksFor(day, phase, assign);
    }
  }

  // ---------------------------------------------------------------- P2
  else if (phase.id === 'P2') {
    const i = day - 46;
    base.weekTheme = day >= 66 ? 'Taper' : 'Prelims Mock Mode';
    base.type = day >= 66 ? 'taper' : 'mock';
    base.headline = day >= 66
      ? 'Taper — mocks + error notebook only. No new material.'
      : `Mock day ${i + 1} of 23`;
    base.detail = day >= 66
      ? 'Sleep eight hours. Match your real shift time. Cut to two hours in the last three days.'
      : 'One full mock, analysed harder than it was taken. No new topics from here.';
    base.blocks = blocksFor(day, phase, [null, null, null, P2_GA[i % P2_GA.length]], {
      weak: P2_FOCUS[i % P2_FOCUS.length]
    });
  }

  // ---------------------------------------------------------------- exams
  else if (phase.id === 'EXAM1') {
    base.type = 'exam';
    base.headline = day === 69 ? 'PRELIMS — Day 1' : 'PRELIMS — Day 2';
    base.detail = 'Two rounds per section · 45-second rule · never guess blindly (0.25 negative) · ' +
                  'English 22–26 · Numerical 26–30 · Reasoning 28–32, all at 90%+ accuracy.';
  }
  else if (phase.id === 'EXAM2') {
    base.type = 'exam';
    base.headline = 'MAINS';
    base.detail = 'Attempt General Awareness FIRST — 50 marks in 20 minutes, pure recall, no thinking cost. ' +
                  'Then Reasoning (1.50 marks/question), then Quant, then English.';
  }

  // ---------------------------------------------------------------- P3
  else if (phase.id === 'P3') {
    const i = day - 71;
    base.weekTheme = 'Mains Foundation';
    base.blocks = blocksFor(day, phase, P3[i]);
    if ((i + 1) % 7 === 0) {
      base.type = 'review';
      base.headline = 'Mains review — 2 sectionals + full GA week revision';
    }
  }

  // ---------------------------------------------------------------- P4
  else if (phase.id === 'P4') {
    const i = day - 99;
    // Mon/Wed/Sat are full-length mock days; the rest are build days. Three real
    // 125-minute mocks a week trains the stamina the paper actually demands.
    const isMockDay = [0, 2, 5].includes(i % 7);
    // Advance the topic rotations on BUILD days only. Indexing by raw day number
    // would silently drop 3 of every 7 entries, because mock days use a template
    // with no reasoning/quant/english slots to put them in.
    let bi = 0;
    for (let k = 0; k < i; k++) if (![0, 2, 5].includes(k % 7)) bi++;
    base.weekTheme = 'Mains Mock Engine';
    base.type = isMockDay ? 'mock' : 'study';
    base.headline = isMockDay
      ? 'FULL-LENGTH Mains mock — 125 minutes, sectionally timed'
      : 'Build day — Reasoning, Quant, English, GA';
    base.blocks = blocksFor(day, phase, [
      P4_REASONING[bi % P4_REASONING.length],
      P4_QUANT[bi % P4_QUANT.length],
      P4_ENGLISH[bi % P4_ENGLISH.length],
      P4_GA[i % P4_GA.length]
    ], {}, isMockDay);
  }

  // ---------------------------------------------------------------- P5
  else if (phase.id === 'P5') {
    const i = day - 127;
    const taper = day >= 144;
    const isMockDay = !taper && [0, 2, 4, 6].includes(i % 7);
    let bi = 0;
    for (let k = 0; k < i; k++) if (![0, 2, 4, 6].includes(k % 7)) bi++;
    base.weekTheme = taper ? 'Taper' : 'Mains Final';
    base.type = taper ? 'taper' : (isMockDay ? 'mock' : 'study');
    base.headline = taper
      ? 'Taper — light revision, error notebook, sleep'
      : isMockDay
        ? 'FULL-LENGTH Mains mock — 125 minutes'
        : P5_PASS[Math.floor(i / 5) % P5_PASS.length];
    base.detail = taper
      ? 'Cut to two hours. Your brain needs to be fresh on 27 December, not full.'
      : 'Four full-length mocks a week, plus three complete GA revision passes before exam day.';
    base.blocks = blocksFor(day, phase, [
      P5_REASONING[bi % P5_REASONING.length],
      P5_QUANT[bi % P5_QUANT.length],
      P5_ENGLISH[bi % P5_ENGLISH.length],
      null
    ], {}, isMockDay);
  }

  return base;
}

export const CURRICULUM = Array.from({ length: TOTAL_DAYS }, (_, i) => buildDay(i + 1));
export const DAY_BY_NUMBER = Object.fromEntries(CURRICULUM.map(d => [d.day, d]));
export const DAY_BY_DATE = Object.fromEntries(CURRICULUM.map(d => [d.date, d]));

// milestones attached after generation so dates stay the single source of truth
const MILESTONES = {
  '2026-08-21': 'IBPS application deadline — submit today if you have not',
  '2026-09-16': 'Syllabus closed. Mock mode begins tomorrow.',
  '2026-10-09': 'Last day before Prelims. Sleep early.',
  '2026-12-26': 'Last day before Mains. Light revision only.'
};
for (const d of CURRICULUM) {
  if (MILESTONES[d.date]) d.milestone = MILESTONES[d.date];
}
CURRICULUM[27].milestone = 'Prelims syllabus 100% complete';

export { PHASES };
