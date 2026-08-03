/**
 * Phase definitions and the daily block template for each.
 *
 * Every template totals exactly 240 minutes. The block SHAPE changes by phase —
 * that is the core insight this app encodes. P1 opens with a calculation drill;
 * P4 and P5 open with 45–60 minutes of General Awareness, because GA returns
 * 2.50 marks per minute in Mains against English's 1.14.
 */

export const START_DATE = '2026-08-05';   // Wednesday
export const TOTAL_DAYS = 145;            // 5 Aug -> 27 Dec inclusive

/**
 * Review days fall on SUNDAYS inside the 45-day syllabus phase.
 *
 * Anchoring to the weekend rather than to "every 7th day" matters: a review day
 * is heavier than a study day, and asking someone to do it on a random Tuesday
 * is how it gets skipped.
 */
export const P1_REVIEW_DAYS = [5, 12, 19, 26, 33, 40];

export const KEY_DATES = [
  { id: 'application', label: 'Application deadline', date: '2026-08-21' },
  { id: 'syllabus',    label: 'Syllabus closes',      date: '2026-09-18' },
  { id: 'prelims',     label: 'PRELIMS',              date: '2026-10-10' },
  { id: 'mains',       label: 'MAINS',                date: '2026-12-27' }
];

export const PHASES = [
  {
    id: 'P1',
    name: 'Syllabus Build',
    tagline: 'Cover the syllabus deeply. ~70% Prelims, ~30% Mains.',
    from: 1, to: 45,
    blocks: [
      { id: 'calc',  label: 'Calculation drill',      minutes: 15, subject: 'quant',
        note: 'Tables to 30 · squares to 40 · cubes to 20 · fraction↔% table' },
      { id: 'ga',    label: 'General Awareness',      minutes: 30, subject: 'ga',
        note: 'Current affairs + the day\'s banking module. Written notes.' },
      { id: 'reas',  label: 'Reasoning',              minutes: 60, subject: 'reasoning',
        note: 'Mastery Protocol: 15m concept → 20m untimed → 20m timed → 5m error log' },
      { id: 'quant', label: 'Quantitative',           minutes: 60, subject: 'quant',
        note: 'Mastery Protocol: 15m concept → 20m untimed → 20m timed → 5m error log' },
      { id: 'eng',   label: 'English',                minutes: 45, subject: 'english',
        note: 'Topic of the day + 1 Reading Comprehension, timed. RC is never skipped.' },
      // Puzzles are 17 of 35 Prelims Reasoning questions and decay fastest, so they
      // get a daily touch rather than only appearing on their own teaching days.
      { id: 'rev',   label: '2 puzzle sets + revisit + error log', minutes: 30, subject: 'reasoning',
        note: 'Two puzzle sets, timed · yesterday\'s topic — 10 questions · then log today\'s mistakes.' }
    ]
  },
  {
    id: 'P2',
    name: 'Prelims Mock Mode',
    tagline: 'One full mock daily. No new topics — test what you have.',
    from: 46, to: 66,
    blocks: [
      { id: 'mock',  label: 'Full mock',              minutes: 60, subject: null,
        note: 'Exam conditions. Same time every day. No pausing, no phone.' },
      { id: 'anal',  label: 'Mock analysis',          minutes: 75, subject: null,
        note: 'Every question into one bucket: Concept / Slow / Silly / Selection.' },
      { id: 'ga',    label: 'General Awareness',      minutes: 30, subject: 'ga',
        note: 'Continues untouched. It cannot be crammed later.' },
      { id: 'weak',  label: 'Weak-area drilling',     minutes: 45, subject: null,
        note: 'Whatever the analysis exposed today. Changes daily.' },
      { id: 'puzz',  label: 'Puzzles — 2 sets',       minutes: 20, subject: 'reasoning',
        note: 'Maintenance. Puzzles decay fastest — never skip this.' },
      { id: 'errbk', label: 'Error notebook',         minutes: 10, subject: null,
        note: 'Revise it. Don\'t just add to it.' }
    ]
  },
  {
    id: 'EXAM1',
    name: 'Prelims',
    tagline: 'Two rounds per section · 45-second rule · never guess blindly.',
    from: 67, to: 68,
    blocks: []
  },
  {
    id: 'P3',
    name: 'Mains Foundation',
    tagline: 'Mains-only topics at depth. Mains alone decides your rank.',
    from: 69, to: 96,
    blocks: [
      { id: 'calc',  label: 'Calculation drill',      minutes: 15, subject: 'quant',
        note: 'Maintenance only. Keep the speed you built.' },
      { id: 'ga',    label: 'General Awareness',      minutes: 40, subject: 'ga',
        note: 'Stepped up. 50 marks in 20 minutes — the best rate in the exam.' },
      { id: 'reas',  label: 'Reasoning',              minutes: 65, subject: 'reasoning',
        note: '1.50 marks per question in Mains — the highest of any section.' },
      { id: 'quant', label: 'Quantitative',           minutes: 60, subject: 'quant',
        note: 'DI is ~45% of Mains Quant. Weight your practice accordingly.' },
      { id: 'eng',   label: 'English',                minutes: 40, subject: 'english',
        note: 'Lowest marks per question — deliberately the smallest block.' },
      { id: 'rev',   label: 'Revisit + error log',    minutes: 20, subject: null,
        note: 'Spaced revision queue + today\'s errors.' }
    ]
  },
  {
    id: 'P4',
    name: 'Mains Mock Engine',
    tagline: 'Mains mocks 4–5× a week. GA consolidation begins.',
    from: 97, to: 124,
    // Four build days and three mock days a week. A single fixed template cannot
    // hold both: a real Mains paper is 120-125 minutes, so a 60-minute "full
    // length mock" block was a lie that would leave you never having sat the
    // actual paper length before 27 December.
    blocks: [
      { id: 'ga',    label: 'General Awareness',      minutes: 30, subject: 'ga',
        note: '50 marks in 20 minutes — the best rate in the exam, and pure recall.' },
      { id: 'reas',  label: 'Reasoning — puzzles + logical', minutes: 55, subject: 'reasoning',
        note: '1.50 marks per question, the highest of any section.' },
      { id: 'quant', label: 'Quantitative — DI led',  minutes: 55, subject: 'quant',
        note: 'DI is ~21 of 40 Mains Quant questions.' },
      { id: 'eng',   label: 'English',                minutes: 45, subject: 'english',
        note: 'Long RC and rearrangement. 40 marks is still 40 marks.' },
      { id: 'errbk', label: 'Error notebook + weak areas', minutes: 55, subject: null,
        note: 'Drill exactly what your last mock exposed. Nothing else.' }
    ],
    blocksMock: [
      { id: 'mock',  label: 'FULL Mains mock — 125 min', minutes: 125, subject: null,
        note: 'The real paper length, sectionally timed. Attempt GA first.' },
      { id: 'anal',  label: 'Deep analysis',          minutes: 90, subject: null,
        note: 'Longer than the mock deserves to feel. Bucket every single error.' },
      { id: 'ga',    label: 'General Awareness',      minutes: 25, subject: 'ga',
        note: 'Never skipped, even on mock days.' }
    ]
  },
  {
    id: 'P5',
    name: 'Mains Final',
    tagline: 'Daily mocks + three full GA revision passes. Taper at the end.',
    from: 125, to: 144,
    blocks: [
      { id: 'ga',    label: 'GA revision pass',       minutes: 60, subject: 'ga',
        note: 'Three complete passes over the six-month window before exam day.' },
      { id: 'eng',   label: 'English — RC + formats', minutes: 40, subject: 'english',
        note: 'RC decays fast. 49 days without it before a 40-mark section is not a plan.' },
      { id: 'reas',  label: 'Reasoning',              minutes: 45, subject: 'reasoning',
        note: 'Puzzles and logical reasoning at 1.50 marks each.' },
      { id: 'quant', label: 'Quantitative',           minutes: 40, subject: 'quant',
        note: 'DI sets, timed.' },
      { id: 'weak',  label: 'Error notebook + weak areas', minutes: 55, subject: null,
        note: 'Your error notebook is the only revision material that matters now.' }
    ],
    blocksMock: [
      { id: 'mock',  label: 'FULL Mains mock — 125 min', minutes: 125, subject: null,
        note: 'Same time of day as your real slot. GA first.' },
      { id: 'anal',  label: 'Deep analysis',          minutes: 90, subject: null,
        note: 'Still the highest-value 90 minutes of your day.' },
      { id: 'ga',    label: 'GA revision',            minutes: 25, subject: 'ga',
        note: 'Never skipped.' }
    ]
  },
  {
    id: 'EXAM2',
    name: 'Mains',
    tagline: 'GA first — 50 marks in 20 minutes, pure recall.',
    from: 145, to: 145,
    blocks: []
  }
];

export const PHASE_BY_ID = Object.fromEntries(PHASES.map(p => [p.id, p]));

export function phaseForDay(day) {
  return PHASES.find(p => day >= p.from && day <= p.to) || PHASES[0];
}
