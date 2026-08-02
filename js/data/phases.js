/**
 * Phase definitions and the daily block template for each.
 *
 * Every template totals exactly 240 minutes. The block SHAPE changes by phase —
 * that is the core insight this app encodes. P1 opens with a calculation drill;
 * P4 and P5 open with 45–60 minutes of General Awareness, because GA returns
 * 2.50 marks per minute in Mains against English's 1.14.
 */

export const START_DATE = '2026-08-03';
export const TOTAL_DAYS = 147;

export const KEY_DATES = [
  { id: 'application', label: 'Application deadline', date: '2026-08-21' },
  { id: 'syllabus',    label: 'Syllabus closes',      date: '2026-09-16' },
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
      { id: 'calc',  label: 'Calculation drill',      minutes: 20, subject: 'quant',
        note: 'Tables to 30 · squares to 40 · cubes to 20 · fraction↔% table' },
      { id: 'ga',    label: 'General Awareness',      minutes: 30, subject: 'ga',
        note: 'Current affairs + the day\'s banking module. Written notes.' },
      { id: 'reas',  label: 'Reasoning',              minutes: 60, subject: 'reasoning',
        note: 'Mastery Protocol: 15m concept → 20m untimed → 20m timed → 5m error log' },
      { id: 'quant', label: 'Quantitative',           minutes: 60, subject: 'quant',
        note: 'Mastery Protocol: 15m concept → 20m untimed → 20m timed → 5m error log' },
      { id: 'eng',   label: 'English',                minutes: 45, subject: 'english',
        note: 'Topic of the day + 1 Reading Comprehension, timed. RC is never skipped.' },
      { id: 'rev',   label: 'Revisit + error log',    minutes: 25, subject: null,
        note: 'Yesterday\'s topic — 10 questions. Then log today\'s mistakes.' }
    ]
  },
  {
    id: 'P2',
    name: 'Prelims Mock Mode',
    tagline: 'One full mock daily. No new topics — test what you have.',
    from: 46, to: 68,
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
    from: 69, to: 70,
    blocks: []
  },
  {
    id: 'P3',
    name: 'Mains Foundation',
    tagline: 'Mains-only topics at depth. Mains alone decides your rank.',
    from: 71, to: 98,
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
    from: 99, to: 126,
    blocks: [
      { id: 'ga',    label: 'General Awareness',      minutes: 45, subject: 'ga',
        note: 'Doubled. Highest marks per minute in the exam.' },
      { id: 'mock',  label: 'Mains mock / sectionals', minutes: 60, subject: null,
        note: 'Attempt GA first in every Mains mock — fastest 50 marks.' },
      { id: 'anal',  label: 'Analysis + weak areas',  minutes: 70, subject: null,
        note: 'Bucket every error. Fix only the largest bucket each week.' },
      { id: 'reas',  label: 'Reasoning — puzzles + logical', minutes: 45, subject: 'reasoning',
        note: 'Puzzles ~19Q, logical reasoning ~7.5Q, at 1.5 marks each.' },
      { id: 'quant', label: 'Quant — DI set',        minutes: 20, subject: 'quant',
        note: 'One DI set daily, minimum.' }
    ]
  },
  {
    id: 'P5',
    name: 'Mains Final',
    tagline: 'Daily mocks + three full GA revision passes. Taper at the end.',
    from: 127, to: 146,
    blocks: [
      { id: 'ga',    label: 'GA revision pass',       minutes: 60, subject: 'ga',
        note: 'Three complete passes over the six-month window before exam day.' },
      { id: 'mock',  label: 'Mains mock',             minutes: 60, subject: null,
        note: 'Same time of day as your exam slot.' },
      { id: 'anal',  label: 'Analysis',               minutes: 60, subject: null,
        note: 'Still the highest-value hour of your day.' },
      { id: 'errbk', label: 'Error notebook',         minutes: 30, subject: null,
        note: 'Full passes. This is your only revision material now.' },
      { id: 'weak',  label: 'Weak-area drilling',     minutes: 30, subject: null,
        note: 'Narrow and specific. No new topics.' }
    ]
  },
  {
    id: 'EXAM2',
    name: 'Mains',
    tagline: 'GA first — 50 marks in 20 minutes, pure recall.',
    from: 147, to: 147,
    blocks: []
  }
];

export const PHASE_BY_ID = Object.fromEntries(PHASES.map(p => [p.id, p]));

export function phaseForDay(day) {
  return PHASES.find(p => day >= p.from && day <= p.to) || PHASES[0];
}
