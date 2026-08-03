/**
 * Eight years of paper analysis, as data.
 *
 * PROVENANCE, because this matters more than the numbers: IBPS has never
 * publicly released a question paper. Not one, in any year. Everything here is
 * memory-based shift analysis — candidates report topics and counts leaving the
 * centre, and platforms aggregate across shifts. It is the only quantitative
 * record that exists for this exam.
 *
 *   · Prelims covers 2018–2025 (8 years)
 *   · Mains covers 2020–2025 (6 years) — earlier Mains was never compiled at
 *     this granularity, and padding it with guesses would be worse than saying so
 *   · A range like '15–20' means the lowest shift that year had 15 and the
 *     highest had 20
 *   · Individual cells carry roughly ±2 questions of error. The RANKING is far
 *     more reliable than any single number, and it has barely moved in 8 years
 *
 * `topicIds` joins each row back to TOPIC_BY_ID. One analysis row often covers
 * several of the app's topics — "Puzzles & Seating" is ten separate teachable
 * topics — which is exactly why the join exists rather than a shared name.
 */

export const PRELIMS_YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];
export const MAINS_YEARS   = [2025, 2024, 2023, 2022, 2021, 2020];

export const MAINS_NOTE =
  'Mains covers 2020–2025 only. Earlier years were never compiled at this level of detail, ' +
  'and inventing the missing four would be worse than leaving them out.';

/** steady · rising · falling · extinct · volatile */
const T = {
  steady:   { label: 'steady',   mark: '',   tone: '' },
  rising:   { label: 'rising',   mark: '↑',  tone: 'good' },
  surging:  { label: 'doubled',  mark: '↑↑', tone: 'good' },
  falling:  { label: 'declining', mark: '↓', tone: 'warn' },
  collapsing: { label: 'collapsing', mark: '↓↓', tone: 'danger' },
  extinct:  { label: 'extinct',  mark: '✕',  tone: 'danger' },
  volatile: { label: 'volatile', mark: '~',  tone: '' },
  // Not asked directly; scored through other rows. See "Grammar foundations".
  foundation: { label: 'underpins other topics', mark: '⌂', tone: 'accent' }
};
export const TREND = T;

/* ------------------------------------------------------------------ PRELIMS */

export const PRELIMS = {
  reas: [
    { topic: 'Puzzles & Seating Arrangement', avg: 17.4, trend: 'steady',
      years: ['15–19','15–20','15–20','15–20','15–20','20','20','15'],
      note: 'Half the section, every single year, without exception. If you master nothing else in Reasoning, master these.',
      topicIds: ['r-linear-single','r-linear-double','r-circular','r-polygon','r-box',
                 'r-floor','r-floor-flat','r-dmy','r-category','r-uncertain'] },
    { topic: 'Alphanumeric & Symbol Series', avg: 3.6, trend: 'steady',
      years: ['0–5','4–5','3–5','3–5','3–5','–','4–5','5'],
      topicIds: ['r-series-alpha'] },
    { topic: 'Number & Letter Series', avg: 3.1, trend: 'steady',
      years: ['4–5','4–5','4–5','5','–','5','–','–'],
      topicIds: ['r-series-num'] },
    { topic: 'Inequality', avg: 3.2, trend: 'steady',
      years: ['3–4','2–5','1–5','3–5','3–4','3','–','4'],
      topicIds: ['r-inequality'] },
    { topic: 'Syllogism', avg: 3.2, trend: 'steady',
      years: ['3–4','2–4','2–4','3–4','4–5','3','5','–'],
      topicIds: ['r-syllogism'] },
    { topic: 'Coding-Decoding', avg: 2.6, trend: 'volatile',
      years: ['0–4','0–5','4–5','3','1–5','–','–','3'],
      topicIds: ['r-coding'] },
    { topic: 'Blood Relation', avg: 2.4, trend: 'falling',
      years: ['0–3','0–3','2–5','1–4','3–5','–','3','3'],
      topicIds: ['r-blood'] },
    { topic: 'Order & Ranking', avg: 2.7, trend: 'volatile',
      years: ['0–3','3–5','3','1–3','1','3–5','3–5','3–5'],
      topicIds: ['r-order'] },
    { topic: 'Direction & Distance', avg: 1.5, trend: 'steady',
      years: ['0–3','0–3','2–4','1–3','1–3','0–1','0–1','0–1'],
      topicIds: ['r-direction'] },
    { topic: 'Word / number pair, word formation', avg: 2.8, trend: 'steady',
      years: ['2–4','1–4','2–4','1–2','2–5','1–7','2–3','3–5'],
      topicIds: ['r-wordpair'] },
    { topic: 'Alphabet Test', avg: 1.4, trend: 'extinct',
      years: ['–','0–1','–','–','–','3','2','5'],
      note: 'Five questions in 2018, none now. Do not spend a minute on it.',
      topicIds: [] }
  ],

  num: [
    { topic: 'Simplification / Approximation', avg: 12.4, trend: 'falling',
      years: ['8–13','10–15','12–15','13–15','12–15','14','10','10'],
      note: 'Pure speed. This is what the daily calculation drill buys you.',
      topicIds: ['q-calc','q-simpl-2'] },
    { topic: 'Arithmetic word problems', avg: 11.8, trend: 'rising',
      years: ['11–15','10–15','8–12','10–12','12–13','10','10','15'],
      topicIds: ['q-numsys','q-percentage','q-ratio','q-average','q-ages','q-pld-1','q-pld-2',
                 'q-si','q-ci','q-timework','q-pipes','q-tsd','q-boats','q-trains',
                 'q-mixture','q-partnership'] },
    { topic: 'Data Interpretation', avg: 6.7, trend: 'surging',
      years: ['9–12','9–10','5–10','5','5','5','5','5'],
      note: 'Flat at 5 for five straight years, then 5–10, 9–10, 9–12. Historically a Mains topic; now ~30% of Prelims Numerical. Most candidates have not adjusted.',
      topicIds: ['q-di-table','q-di-bar','q-di-line','q-di-pie','q-di-caselet','q-di-missing'] },
    { topic: 'Number Series', avg: 3.0, trend: 'collapsing',
      years: ['0–2','0–5','5','5','–','–','5','5'],
      note: 'Still taught heavily by coaching. Falling fast.',
      topicIds: ['q-series-missing','q-series-wrong'] },
    { topic: 'Quadratic Equations', avg: 1.9, trend: 'extinct',
      years: ['–','–','–','–','5','5','5','–'],
      note: 'Absent from Prelims since 2021. Learn it for MAINS only, where it is ~4 questions.',
      topicIds: ['q-quadratic'] },
    { topic: 'Mensuration, Permutation, Probability', avg: 1, trend: 'volatile',
      years: ['0–2','0–2','0–2','0–1','0–2','0–1','0–2','0–1'],
      note: 'Never a named block in any shift analysis — they surface inside the arithmetic mix, ' +
            'roughly one question between them. Learn the formulas, do not build a topic around it.',
      topicIds: ['q-mensuration-2d','q-mensuration-3d','q-permutation','q-probability'] }
  ],

  eng: [
    { topic: 'Reading Comprehension', avg: 8.8, trend: 'steady',
      years: ['8–10','9–13','8–10','7–10','8–9','6','8','8'],
      note: 'Every shift, every year. Your newspaper reading IS this practice.',
      topicIds: ['e-rc-technique'] },
    { topic: 'Cloze Test', avg: 5.3, trend: 'steady',
      years: ['5–6','5','6','4–7','5','5','6','5'],
      topicIds: ['e-cloze','e-cloze-replace'] },
    { topic: 'Error Detection', avg: 4.1, trend: 'steady',
      years: ['3–5','4–6','4–5','4–5','5','5','3','–'],
      topicIds: ['e-error-1','e-error-2','e-error-double'] },
    { topic: 'Phrase Replacement', avg: 3.3, trend: 'volatile',
      years: ['3–4','3–5','4–5','3–5','–','5','–','7'],
      topicIds: ['e-phrase'] },
    { topic: 'Fillers', avg: 3.4, trend: 'volatile',
      years: ['3–5','5–6','3–7','2–5','–','–','5','5'],
      topicIds: ['e-fillers'] },
    { topic: 'Para Jumbles', avg: 2.9, trend: 'volatile',
      years: ['0–5','0–5','3–5','5','0–5','0–5','0–5','0–5'],
      topicIds: ['e-parajumble'] },
    { topic: 'Misspelt / Spelling', avg: 2.4, trend: 'volatile',
      years: ['3–5','0–5','4–5','3–6','0–2','0–2','0–2','0–2'],
      topicIds: ['e-vocab'] },
    { topic: 'Word Rearrangement / Replacement', avg: 2.4, trend: 'volatile',
      years: ['3–6','0–5','3','–','4–5','–','3','–'],
      topicIds: ['e-wordrearr'] },
    { topic: 'Word Swap', avg: 2.3, trend: 'volatile',
      years: ['3–4','0–5','2–5','5','–','4','–','–'],
      topicIds: ['e-wordswap'] },
    { topic: 'Sentence Rearrangement / Improvement', avg: 1.9, trend: 'volatile',
      years: ['3–4','–','3–5','2–5','–','5','–','–'],
      topicIds: ['e-sent-rearr','e-improvement'] },
    { topic: 'Word Usage', avg: 1.5, trend: 'volatile',
      years: ['0–1','2–4','1','2–3','4–5','–','–','–'],
      topicIds: ['e-wordusage'] },
    { topic: 'Match the Column', avg: 1.3, trend: 'volatile',
      years: ['1–3','0–3','1–3','–','–','–','–','5'],
      topicIds: ['e-matchcol'] },
    { topic: 'Grammar foundations', avg: null, trend: 'foundation',
      years: null,
      note: 'These are never asked as a question type of their own, which is why they appear in ' +
            'no shift analysis — and why they are easy to skip. They are the machinery underneath ' +
            'Error Detection, Fillers, Phrase Replacement and Sentence Improvement, which together ' +
            'are about 12 of the 30 English questions. Weak grammar shows up as a low score in four ' +
            'other rows, never in this one.',
      topicIds: ['e-tenses','e-sva','e-articles','e-noun','e-adjective'] }
  ]
};

/* -------------------------------------------------------------------- MAINS */

export const MAINS = {
  reas: [
    { topic: 'Puzzles & Seating', avg: 18.3, trend: 'falling',
      years: ['14–15','15','15','21–24','23–24','25'],
      note: 'Fell from 25 to about 15 — and the slack went to logical reasoning, input-output and data sufficiency.',
      topicIds: ['r-triple-row','r-inscribed','r-blood-seating','r-box','r-floor','r-category','r-uncertain'] },
    { topic: 'Logical / Critical Reasoning', avg: 7.4, trend: 'steady',
      years: ['0–7','9','10','10','7–8','7–8'],
      note: 'Never appears in Prelims, so most Clerk candidates never study it. That is the edge.',
      topicIds: ['r-assumption','r-inference','r-coa'] },
    { topic: 'Machine Input-Output', avg: 5.1, trend: 'steady',
      years: ['3–5','5','5','4–8','5','5'],
      topicIds: ['r-io-1','r-io-2'] },
    { topic: 'Data Sufficiency', avg: 3.2, trend: 'steady',
      years: ['0–3','4','3','3','3–4','5'],
      topicIds: ['r-ds-2','r-ds-3'] },
    { topic: 'Coded Blood Relations', avg: 2.6, trend: 'rising',
      years: ['1–5','5','–','2','3','3'],
      topicIds: ['r-coded-blood'] },
    { topic: 'Coded Inequality', avg: 1.5, trend: 'volatile',
      years: ['–','–','3','3','3','–'],
      topicIds: ['r-coded-ineq'] },
    { topic: 'Syllogism', avg: 1.5, trend: 'volatile',
      years: ['–','3','3','3','–','–'],
      topicIds: ['r-syllogism'] },
    { topic: 'Coded Directions', avg: 1.3, trend: 'volatile',
      years: ['0–3','3','–','–','3','–'],
      topicIds: ['r-coded-dir'] },
    { topic: 'Coding-Decoding', avg: 1.7, trend: 'volatile',
      years: ['0–5','–','5','–','–','–'],
      topicIds: ['r-coding-chinese'] }
  ],

  num: [
    { topic: 'Data Interpretation', avg: 20.1, trend: 'falling',
      years: ['13–16','21','27–31','20','20','18–20'],
      note: 'Peaked at 27–31 in 2023 — three quarters of the section. Still the largest single block even at its lowest.',
      topicIds: ['q-di-table','q-di-bar','q-di-line','q-di-pie','q-di-caselet',
                 'q-di-missing','q-di-arith','q-di-new'] },
    { topic: 'Arithmetic', avg: 9.6, trend: 'volatile',
      years: ['6–11','8','10','16–17','10–12','–'],
      topicIds: ['q-percentage','q-ratio','q-average','q-pld-1','q-pld-2','q-si','q-ci',
                 'q-timework','q-tsd','q-mixture','q-partnership','q-pipes'] },
    { topic: 'Quadratic Equation', avg: 3.8, trend: 'steady',
      years: ['2–4','6','3','4','4–5','2'],
      topicIds: ['q-quadratic'] },
    { topic: 'Simplification / Approximation', avg: 3.4, trend: 'steady',
      years: ['–','6','3–4','3–6','5','5'],
      topicIds: ['q-calc','q-simpl-2'] },
    { topic: 'Series Based', avg: 2.9, trend: 'steady',
      years: ['2–4','6','2–3','3','2–3','–'],
      topicIds: ['q-series-missing','q-series-wrong'] },
    { topic: 'Data Sufficiency', avg: 2.5, trend: 'steady',
      years: ['1–3','3','3','3','–','5'],
      topicIds: ['q-ds'] },
    { topic: 'Quantity I vs Quantity II', avg: 0.5, trend: 'volatile',
      years: ['–','–','3','–','–','–'],
      topicIds: ['q-quantity'] }
  ],

  eng: [
    { topic: 'Reading Comprehension', avg: 12.6, trend: 'steady',
      years: ['15–16','13','11–12','12–13','10–12','11'],
      note: 'A third of the section. Economy and social-issue passages dominate.',
      topicIds: ['e-rc-long','e-rc-multi','e-rc-econ','e-rc-social'] },
    { topic: 'Cloze Test', avg: 4.6, trend: 'volatile',
      years: ['0–7','6','6','4','6–7','–'],
      topicIds: ['e-cloze-mains'] },
    { topic: 'Error Detection', avg: 4.1, trend: 'volatile',
      years: ['0–4','5','5','5–6','1','6–7'],
      topicIds: ['e-error-mains','e-error-double'] },
    { topic: 'Phrase Replacement', avg: 3.1, trend: 'volatile',
      years: ['0–2','–','4–5','6–7','5','–'],
      topicIds: ['e-phrase','e-phrase-swap'] },
    { topic: 'Para Jumble', avg: 2.8, trend: 'volatile',
      years: ['–','2','3','6','–','5–6'],
      topicIds: ['e-parajumble','e-coherent'] },
    { topic: 'Sentence Rearrangement', avg: 2.2, trend: 'volatile',
      years: ['0–5','3','1','4–5','–','–'],
      topicIds: ['e-sent-rearr'] },
    { topic: 'Double Fillers', avg: 2.1, trend: 'volatile',
      years: ['–','–','4–5','3–4','3','–'],
      topicIds: ['e-fillers'] },
    { topic: 'Match the Column', avg: 1.8, trend: 'volatile',
      years: ['0–3','–','–','4–5','3','–'],
      topicIds: ['e-matchcol'] },
    { topic: 'Connectors / Starters', avg: 1.5, trend: 'volatile',
      years: ['2–5','–','–','–','–','5–6'],
      topicIds: ['e-connectors'] },
    { topic: 'Odd One Out', avg: 0.9, trend: 'volatile',
      years: ['1–7','–','–','1','–','–'],
      topicIds: ['e-oddone'] },
    { topic: 'Word Usage / Word Swap', avg: 0.9, trend: 'volatile',
      years: ['0–5','–','–','3','–','–'],
      topicIds: ['e-wordusage','e-wordswap'] },
    { topic: 'Idioms & Phrases', avg: 0.5, trend: 'volatile',
      years: ['–','3','–','–','–','–'],
      topicIds: ['e-idioms'] },
    { topic: 'Inference / Para completion', avg: 1.2, trend: 'volatile',
      years: ['0–3','–','2–4','1–3','1–2','1–2'],
      topicIds: ['e-inference','e-paracompletion'] }
  ],

  /**
   * GA has no year-by-year grid, and that is an honest gap rather than an
   * omission. It is not decomposable into stable topics the way the other
   * sections are — it is whatever happened in the preceding six months.
   * Post-exam analyses report themes, not repeatable counts.
   */
  ga: [
    { topic: 'Current Affairs — last 6 months', avg: 23.5, trend: 'steady',
      years: null, note: 'Schemes, appointments, awards, summits, sports, defence, reports and indexes, obituaries, important days.',
      topicIds: ['ga-awards','ga-appointments','ga-summits','ga-sports','ga-defence',
                 'ga-scitech','ga-books','ga-ranks','ga-agreements','ga-state','ga-days','ga-committees'] },
    { topic: 'Banking & Financial Awareness', avg: 11, trend: 'steady',
      years: null, note: 'RBI and policy rates, regulators, payment systems, NPAs and Basel, money and capital markets, Budget, Economic Survey.',
      topicIds: ['ga-rbi','ga-rates','ga-banktypes','ga-regulators','ga-devbanks','ga-payments',
                 'ga-accounts','ga-negotiable','ga-npa','ga-moneymarket','ga-capitalmarket',
                 'ga-inclusion','ga-mudra','ga-insurance','ga-budget','ga-survey','ga-circulars'] },
    { topic: 'Static GK', avg: 4, trend: 'steady',
      years: null, note: 'Bank HQs and taglines, capitals, currencies, national parks, first-in-India.',
      topicIds: ['ga-static-hq','ga-static-cap','ga-intl-org'] }
  ]
};

export const GA_NOTE =
  'There is no year-by-year table for General Awareness, and that is an honest gap rather than ' +
  'an omission. GA is not decomposable into stable topics — it is whatever happened in the ' +
  'preceding six months, so analyses report themes rather than repeatable counts.';

/** Every analysis row for one paper, flattened. */
export function rowsFor(paper, sectionId) {
  const src = paper === 'mains' ? MAINS : PRELIMS;
  return src[sectionId] || [];
}

/** The analysis row a given topic belongs to, or null. */
export function rowForTopic(paper, topicId) {
  const src = paper === 'mains' ? MAINS : PRELIMS;
  for (const rows of Object.values(src)) {
    const hit = rows.find(r => r.topicIds.includes(topicId));
    if (hit) return hit;
  }
  return null;
}
