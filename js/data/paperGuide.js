/**
 * How to attack each paper section.
 *
 * Seven guides — three Prelims sections, four Mains. Deliberately NOT a repeat of
 * the exam structure: questions, marks and minutes all live in official.js, which
 * is quoted from the notification. Duplicating them here would create a second
 * copy to drift, which is exactly how "147 days" survived two builds.
 *
 * What each guide holds is the part the notification cannot tell you: what the
 * section actually rewards, the order to work through it, and the one mistake
 * that costs most people the most marks in it.
 */

export const GUIDES = {
  /* ------------------------------------------------------------ PRELIMS */

  'prelims-eng': {
    paper: 'prelims', section: 'eng',
    whatItTests:
      'Reading speed and grammar reflex, under the tightest time pressure in the paper. ' +
      'Nothing here is difficult in isolation — the volume against the clock is what makes it hard.',
    howToAttack: [
      'Two rounds. Round one takes only what you can answer without thinking: fillers, spotting an obvious error, easy vocabulary.',
      'Round two returns for cloze, then Reading Comprehension last.',
      'RC is deliberately last. It is 8–10 marks sitting in one block, and if you open with it you can spend twelve minutes and answer nine questions while twenty easier ones go untouched.',
      'Read the questions before the passage. You are hunting for specific answers, not reading for pleasure.'
    ],
    attemptTarget: { min: 22, max: 26 },
    accuracyTarget: '90%+',
    theOneTrap:
      'Treating the section as one long read. English rewards a fast first pass more than any other ' +
      'section, because so many of its questions are answerable in eight seconds or not at all.',
    timeStrategy:
      'Roughly 13 minutes for round one, 7 for round two. If you are still on round one at 15 minutes, ' +
      'stop and go to RC anyway — an unopened RC is a guaranteed zero.'
  },

  'prelims-num': {
    paper: 'prelims', section: 'num',
    whatItTests:
      'Arithmetic speed. Almost every mark in this section is available to someone with fast, ' +
      'accurate mental calculation — which is why 10 minutes a day of drill outperforms any amount ' +
      'of theory.',
    howToAttack: [
      'Simplification and approximation first. These are the cheapest marks in the whole paper.',
      'Then series, if it appears — it has been collapsing but still shows up.',
      'Then arithmetic word problems.',
      'Data Interpretation last. It is the most time-expensive block and it has doubled since 2021, so it deserves real practice — but not your first ten minutes.'
    ],
    attemptTarget: { min: 26, max: 30 },
    accuracyTarget: '92%+',
    theOneTrap:
      'Starting with DI because it looks like "real" maths. A caselet can eat six minutes and return ' +
      'four marks while fifteen simplification questions sit unanswered.',
    timeStrategy:
      'Target: simplification block done in 5 minutes, arithmetic in 8, DI in the remaining 7. ' +
      'If a single question passes 45 seconds without a visible path, leave it.'
  },

  'prelims-reas': {
    paper: 'prelims', section: 'reas',
    whatItTests:
      'Whether you can build a correct arrangement quickly, and — more importantly — whether you can ' +
      'tell which puzzle is solvable before you commit to it. Half this section is puzzles.',
    howToAttack: [
      'Scan the whole section first, 45 seconds. Mark every puzzle set as easy, medium or leave.',
      'Take the quick topics first: inequality, syllogism, series, blood relation, direction. These are 12–15 marks in about 7 minutes.',
      'Then the puzzle set you marked easiest.',
      'Then the next. Never open a "leave" puzzle — you marked it for a reason.'
    ],
    attemptTarget: { min: 28, max: 32 },
    accuracyTarget: '92%+',
    theOneTrap:
      'Committing to a floor puzzle because you have already spent two minutes on it. That is the ' +
      'sunk cost fallacy in a room with a timer. A half-built arrangement is worth zero, and the ' +
      'two minutes are gone either way — the only question is whether you spend two more.',
    timeStrategy:
      'Quick topics by minute 7. Two puzzle sets by minute 17. Whatever is left is a bonus, not a plan.'
  },

  /* -------------------------------------------------------------- MAINS */

  'mains-ga': {
    paper: 'mains', section: 'ga',
    whatItTests:
      'Six months of recall, and nothing else. There is no reasoning in this section — you either ' +
      'know it or you do not, which is why it cannot be crammed and why it starts on day one.',
    howToAttack: [
      'Attempt this section FIRST, whatever order the paper offers. It carries the highest marks-per-minute in the paper and costs no thinking energy.',
      'Answer straight down. If you do not know it in three seconds, skip and move — a GA question you have to think about is one you do not know.',
      'One pass only. Returning to a recall question almost never changes the answer.',
      'Leave what you genuinely do not know. At 0.25 negative, blind guessing here is worth exactly zero.'
    ],
    attemptTarget: { min: 30, max: 36 },
    accuracyTarget: '85%+',
    theOneTrap:
      'Starting GA in November. It is the highest marks-per-minute section in the exam and the only ' +
      'one that accrues rather than being learned — six months of daily reading cannot be replaced ' +
      'by six weeks of panic.',
    timeStrategy:
      'Under half a minute a question on paper — but in practice you will answer most in 8 ' +
      'seconds and leave the rest. Finishing early here is normal and correct.'
  },

  'mains-eng': {
    paper: 'mains', section: 'eng',
    whatItTests:
      'Comprehension at length, plus grammar formats that do not appear in Prelims at all — ' +
      'connectors, coherent paragraph, phrase swapping, inference.',
    howToAttack: [
      'Non-RC questions first. Error detection, cloze, fillers, connectors — these are fast and self-contained.',
      'Then RC, which is a third of the section and where the marks actually are.',
      'For each passage: read the questions, then skim for the answers. Do not read a Mains passage end to end before looking at what is asked.',
      'Economy and social-issue passages dominate. Your newspaper reading is direct preparation.'
    ],
    attemptTarget: { min: 28, max: 34 },
    accuracyTarget: '85%+',
    theOneTrap:
      'Studying only the Prelims English topics. Mains introduces formats you will never have seen ' +
      'if you stopped after October, and RC is a third of this section rather than under a third of Prelims English.',
    timeStrategy:
      'Non-RC in 15 minutes, RC in 20. If RC has not started by minute 18, go to it regardless ' +
      'of what is unfinished.'
  },

  'mains-reas': {
    paper: 'mains', section: 'reas',
    whatItTests:
      'The richest section in the paper: its questions average more marks than any other ' +
      'section. And the part that separates candidates is not puzzles.',
    howToAttack: [
      'Attempt this second, after General Awareness. It is worth the most per question and you want your best attention on it.',
      'Take the non-puzzle topics first: input-output, data sufficiency, logical reasoning, coded blood relation. Roughly forty per cent of the section, and most candidates are weak at all of it.',
      'Then puzzles, hardest-looking last.',
      'Mains puzzles are genuinely harder than Prelims — triple row, inscribed arrangements, blood-relation seating. Budget accordingly.'
    ],
    attemptTarget: { min: 26, max: 32 },
    accuracyTarget: '88%+',
    theOneTrap:
      'Skipping logical reasoning, machine input-output and data sufficiency because they never ' +
      'appeared in Prelims. That is close to a quarter of the paper\'s richest section, left on the ' +
      'table by most Clerk candidates. It is the single largest edge available in this exam.',
    timeStrategy:
      'Non-puzzle block in 14 minutes, puzzles in 21. Two solid puzzle sets beat four half-built ones.'
  },

  'mains-num': {
    paper: 'mains', section: 'num',
    whatItTests:
      'Data Interpretation, mostly. It has been as high as three quarters of this section and is ' +
      'never below a third. Everything else is arithmetic under time pressure.',
    howToAttack: [
      'Scan every DI set first and rank them. They vary enormously in cost and the labels do not tell you which is which.',
      'Take approximation and quadratic first if present — fast, self-contained marks.',
      'Then the DI sets in the order you ranked them.',
      'Caselet DI last. It is prose you must convert into a table before you can compute, which is two jobs in the time budget of one.'
    ],
    attemptTarget: { min: 22, max: 28 },
    accuracyTarget: '88%+',
    theOneTrap:
      'Treating every DI set as equal. A missing-value table and a caselet look similar on the page ' +
      'and differ by three minutes in practice. Rank before you commit.',
    timeStrategy:
      'Ranking scan 90 seconds — it feels wasteful and it is the highest-return 90 ' +
      'seconds in the section. Then fast marks, then DI.'
  }
};

/**
 * Attempt targets are a RANGE, not a string like "22–26 of 30".
 *
 * The total belongs to official.js, which is quoted from the notification. Baking
 * it into a display string here would create a second copy that silently goes
 * wrong the day IBPS changes a section size — the same failure mode as the
 * "147 days" label that survived two builds. The view composes the two.
 */

/** Guides in paper order, matching official.js section order. */
export const GUIDE_ORDER = {
  prelims: ['prelims-eng', 'prelims-num', 'prelims-reas'],
  mains:   ['mains-ga', 'mains-eng', 'mains-reas', 'mains-num']
};

export function guideFor(paper, sectionId) {
  return GUIDES[`${paper}-${sectionId}`] || null;
}
