/**
 * Topic catalogue.
 *
 * Weightage figures are 5-year averages (2021–2025) aggregated from memory-based
 * shift analyses. IBPS does not release official papers, so individual numbers carry
 * roughly ±2 questions of noise — the RANKING is what's reliable, and it has been
 * stable for eight years.
 *
 * tier 1 = highest return per study hour. tier 2 = high frequency, fast to learn.
 * tier 3 = Mains-specific. tier 4 = breadth pass. tier 5 = deliberately deprioritised.
 */

import { DEFAULT_RESOURCES } from './resources.js';

// [id, name, tier, prelimsWeight, mainsWeight, targetQuestions, resources?]
const RAW = {
  reasoning: [
    ['r-linear-single',   'Linear seating — single row',                  1, 17, 19, 90],
    ['r-linear-double',   'Linear seating — double row',                  1, 17, 19, 90],
    ['r-circular',        'Circular seating (inward / outward)',           1, 17, 19, 90],
    ['r-polygon',         'Square / rectangle / triangular seating',       1, 17, 19, 80],
    ['r-box',             'Box-based puzzles',                            1, 17, 19, 90],
    ['r-floor',           'Floor-based puzzles',                          1, 17, 19, 90],
    ['r-floor-flat',      'Floor + flat puzzles',                         1, 17, 19, 80],
    ['r-dmy',             'Day / month / year puzzles',                   1, 17, 19, 80],
    ['r-category',        'Category / designation / variable puzzles',     1, 17, 19, 80],
    ['r-uncertain',       'Uncertain & mixed puzzles',                    1, 17, 19, 80],
    ['r-inequality',      'Inequality (direct)',                          2, 3.5, 2, 70],
    ['r-syllogism',       'Syllogism',                                    2, 3.5, 2, 70],
    ['r-series-alpha',    'Alphanumeric & symbol series',                 2, 4.5, 3.4, 70],
    ['r-series-num',      'Number & letter series',                       2, 4.5, 3.4, 70],
    ['r-coding',          'Coding-decoding (basic)',                      2, 3, 1.5, 70],
    ['r-coding-chinese',  'Coding-decoding (Chinese / coded)',            3, 0, 1.5, 60],
    ['r-blood',           'Blood relation',                               2, 2.6, 2.7, 60],
    ['r-direction',       'Direction & distance',                         2, 2, 1.5, 60],
    ['r-order',           'Order & ranking',                              2, 2.3, 1, 50],
    ['r-wordpair',        'Word pair, number pair, word formation',       4, 2.7, 1, 40],
    ['r-coded-ineq',      'Coded inequality',                             3, 0, 1.8, 50],
    ['r-syllogism-rev',   'Reverse & mixed syllogism',                    3, 0, 1.8, 50],
    ['r-coded-blood',     'Coded blood relation',                         3, 0, 2.7, 50],
    ['r-coded-dir',       'Coded direction',                              3, 0, 1.5, 50],
    ['r-io-1',            'Machine input-output I — shifting, arrangement', 3, 0, 5, 60],
    ['r-io-2',            'Machine input-output II — mathematical, coded',  3, 0, 5, 60],
    ['r-ds-2',            'Data sufficiency — 2 statements',              3, 0, 3.2, 50],
    ['r-ds-3',            'Data sufficiency — 3 statements',              3, 0, 3.2, 50],
    ['r-assumption',      'Statement & assumption',                       3, 0, 7.5, 60],
    ['r-inference',       'Statement & inference / conclusion',           3, 0, 7.5, 60],
    ['r-coa',             'Course of action + cause & effect',            3, 0, 7.5, 50],
    ['r-triple-row',      'Mains puzzles — triple row',                   3, 0, 19, 60],
    ['r-inscribed',       'Mains puzzles — inscribed circular / square',   3, 0, 19, 60],
    ['r-blood-seating',   'Blood-relation-based seating',                 3, 0, 19, 50],
    ['r-puzzle-marathon', 'Hard puzzle marathon — 8 sets, timed',         1, 17, 19, 80],
    ['r-sectional',       'Reasoning sectional — Mains level',            1, 0, 0, 40]
  ],
  quant: [
    ['q-calc',            'Calculation toolkit + Simplification I',       1, 13, 4, 120],
    ['q-simpl-2',         'Simplification II + Approximation',            1, 13, 4, 100],
    ['q-numsys',          'Number system, HCF & LCM',                     2, 12, 11, 60],
    ['q-percentage',      'Percentage',                                   1, 12, 11, 90],
    ['q-ratio',           'Ratio & proportion',                           1, 12, 11, 80],
    ['q-average',         'Average',                                      1, 12, 11, 70],
    ['q-ages',            'Ages',                                         2, 12, 11, 60],
    ['q-pld-1',           'Profit, loss & discount I',                    1, 12, 11, 80],
    ['q-pld-2',           'Profit, loss & discount II — successive discount, MP/CP', 1, 12, 11, 70],
    ['q-si',              'Simple Interest',                              1, 12, 11, 70],
    ['q-ci',              'Compound Interest',                            1, 12, 11, 70],
    ['q-timework',        'Time & work',                                  1, 12, 11, 80],
    ['q-pipes',           'Pipes & cistern',                              2, 12, 11, 60],
    ['q-tsd',             'Time, speed & distance',                       1, 12, 11, 80],
    ['q-boats',           'Boats & streams',                              2, 12, 11, 60],
    ['q-trains',          'Trains',                                       2, 12, 11, 60],
    ['q-mixture',         'Mixture & alligation',                         2, 12, 11, 60],
    ['q-partnership',     'Partnership',                                  2, 12, 11, 50],
    ['q-di-table',        'DI — Table',                                   1, 8, 21, 90],
    ['q-di-bar',          'DI — Bar graph',                               1, 8, 21, 90],
    ['q-di-line',         'DI — Line graph',                              1, 8, 21, 80],
    ['q-di-pie',          'DI — Pie chart',                               1, 8, 21, 80],
    ['q-di-caselet',      'DI — Caselet',                                 1, 8, 21, 80],
    ['q-di-missing',      'DI — Missing value & mixed',                   1, 8, 21, 80],
    ['q-di-arith',        'DI — Arithmetic-based',                        3, 0, 21, 70],
    ['q-di-new',          'DI — New patterns (radar, funnel, scatter)',    3, 0, 21, 60],
    ['q-series-missing',  'Number series — missing',                      2, 3.4, 3.4, 60],
    ['q-series-wrong',    'Number series — wrong',                        2, 3.4, 3.4, 60],
    ['q-quadratic',       'Quadratic equation & inequality',              5, 1, 4, 50],
    ['q-quantity',        'Quantity I vs Quantity II',                    3, 0, 2.5, 50],
    ['q-ds',              'Quant data sufficiency',                       3, 0, 2.2, 50],
    ['q-mensuration-2d',  'Mensuration 2D',                               5, 1, 1, 40],
    ['q-mensuration-3d',  'Mensuration 3D',                               5, 1, 1, 40],
    ['q-permutation',     'Permutation & combination',                    5, 1, 1, 40],
    ['q-probability',     'Probability',                                  5, 1, 1, 40],
    ['q-sectional',       'Quant sectional — Mains level',                1, 0, 0, 40]
  ],
  english: [
    ['e-tenses',          'Tenses',                                       2, 4.6, 3.7, 60],
    ['e-sva',             'Subject-verb agreement',                       2, 4.6, 3.7, 60],
    ['e-articles',        'Articles & prepositions',                      2, 4.6, 3.7, 60],
    ['e-noun',            'Noun & pronoun',                               2, 4.6, 3.7, 50],
    ['e-adjective',       'Adjective & adverb',                           2, 4.6, 3.7, 50],
    ['e-rc-technique',    'RC technique — skimming, question-first',       1, 9, 13, 80],
    ['e-cloze',           'Cloze test (blank type)',                      2, 5.4, 5.2, 70],
    ['e-cloze-replace',   'Cloze test — replacement type',                3, 0, 5.2, 50],
    ['e-error-1',         'Error detection I',                            2, 4.6, 3.7, 70],
    ['e-error-2',         'Error detection II',                           2, 4.6, 3.7, 70],
    ['e-error-double',    'Double / multiple error detection',            3, 0, 3.7, 50],
    ['e-improvement',     'Sentence improvement',                         4, 2.2, 1, 50],
    ['e-phrase',          'Phrase replacement',                           2, 3.2, 3.4, 60],
    ['e-fillers',         'Fillers (single & double)',                    2, 3.6, 2, 60],
    ['e-parajumble',      'Para jumbles',                                 2, 3.3, 2.2, 60],
    ['e-sent-rearr',      'Sentence rearrangement',                       2, 2.2, 2.9, 60],
    ['e-wordswap',        'Word swap',                                    4, 2.9, 1.5, 40],
    ['e-wordrearr',       'Word rearrangement',                           4, 2.9, 1.5, 40],
    ['e-wordusage',       'Word usage',                                   4, 2.3, 1.5, 40],
    ['e-oddone',          'Odd one out + spelling error',                 4, 1.5, 1.5, 40],
    ['e-idioms',          'Idioms & phrases',                             4, 1.5, 1, 40],
    ['e-matchcol',        'Match the column',                             4, 1.1, 1.7, 40],
    ['e-connectors',      'Connectors & starters',                        3, 0, 2, 50],
    ['e-paracompletion',  'Paragraph completion',                         3, 0, 2, 50],
    ['e-coherent',        'Coherent paragraph',                           3, 0, 2, 50],
    ['e-inference',       'Inference-based questions',                    3, 0, 2, 50],
    ['e-phrase-swap',     'Phrase swapping',                              3, 0, 1.5, 40],
    ['e-rc-multi',        'Multiple short-RC sets',                       3, 0, 13, 60],
    ['e-rc-econ',         'RC — economic themes',                         1, 9, 13, 60],
    ['e-rc-social',       'RC — social themes',                           1, 9, 13, 60],
    ['e-cloze-mains',     'Mains-level cloze',                            3, 0, 5.2, 50],
    ['e-error-mains',     'Mains-level error detection',                  3, 0, 3.7, 50],
    ['e-rc-long',         'Mains RC — long passage',                      1, 0, 13, 60],
    ['e-vocab',           'Vocabulary in context',                        4, 2, 2, 40],
    ['e-mixed',           'Mixed English sectional',                      2, 0, 0, 40],
    ['e-sectional',       'English sectional',                            2, 0, 0, 40]
  ],
  ga: [
    ['ga-rbi',            'RBI — structure & functions',                  2, 0, 11, 0],
    ['ga-rates',          'Policy rates — repo, reverse repo, CRR, SLR, MSF', 2, 0, 11, 0],
    ['ga-banktypes',      'Types of banks — PSB, private, SFB, payments, RRB', 2, 0, 11, 0],
    ['ga-regulators',     'Regulators — SEBI, IRDAI, PFRDA',              2, 0, 11, 0],
    ['ga-devbanks',       'NABARD, SIDBI, EXIM, NHB',                     2, 0, 11, 0],
    ['ga-payments',       'Payment systems — NEFT, RTGS, IMPS, UPI, AEPS', 2, 0, 11, 0],
    ['ga-accounts',       'Account types — savings, current, FD, RD, NRI', 2, 0, 11, 0],
    ['ga-negotiable',     'Negotiable instruments — cheque, DD, bill of exchange', 2, 0, 11, 0],
    ['ga-npa',            'NPA, SARFAESI, IBC, Basel norms',              2, 0, 11, 0],
    ['ga-moneymarket',    'Money market — T-bills, CP, CD, call money',    2, 0, 11, 0],
    ['ga-capitalmarket',  'Capital market — shares, bonds, debentures, mutual funds', 2, 0, 11, 0],
    ['ga-inclusion',      'PMJDY, PMJJBY, PMSBY, Atal Pension Yojana',     2, 0, 11, 0],
    ['ga-mudra',          'Mudra, Stand-Up India, Startup India',         2, 0, 11, 0],
    ['ga-insurance',      'Insurance basics + IRDAI schemes',             2, 0, 11, 0],
    ['ga-budget',         'Union Budget 2026 — key figures',              2, 0, 11, 0],
    ['ga-survey',         'Economic Survey 2026, GDP & inflation basics',  2, 0, 11, 0],
    ['ga-intl-org',       'IMF, World Bank, ADB, AIIB, WTO',              2, 0, 11, 0],
    ['ga-static-hq',      'Static — bank HQs & taglines',                 4, 0, 4, 0],
    ['ga-static-cap',     'Static — capitals & currencies',               4, 0, 4, 0],
    ['ga-days',           'Important days & themes',                      4, 0, 4, 0],
    ['ga-awards',         'Awards & honours — last 6 months',             1, 0, 23, 0],
    ['ga-appointments',   'Appointments — last 6 months',                 1, 0, 23, 0],
    ['ga-summits',        'Summits & conferences',                        1, 0, 23, 0],
    ['ga-sports',         'Sports — last 6 months',                       1, 0, 23, 0],
    ['ga-defence',        'Defence news',                                 1, 0, 23, 0],
    ['ga-scitech',        'Science & technology',                         1, 0, 23, 0],
    ['ga-books',          'Books & authors, obituaries',                  1, 0, 23, 0],
    ['ga-schemes-rev',    'Government schemes — full revision',           1, 0, 23, 0],
    ['ga-ranks',          'Ranks, reports & indexes',                     1, 0, 23, 0],
    ['ga-agreements',     'Agreements & MoUs',                            1, 0, 23, 0],
    ['ga-state',          'State current affairs',                        1, 0, 23, 0],
    ['ga-committees',     'Committees & their heads',                     1, 0, 23, 0],
    ['ga-circulars',      'RBI circulars — last 6 months',                1, 0, 23, 0],
    ['ga-national-rev',   'National current affairs — revision',          1, 0, 23, 0],
    ['ga-intl-rev',       'International current affairs — revision',      1, 0, 23, 0],
    ['ga-banking-rev',    'Banking awareness — full revision',            1, 0, 23, 0],
    ['ga-audit',          'Full GA checklist audit',                      1, 0, 23, 0],
    ['ga-6week-rev',      '6-week GA revision — full pass',               1, 0, 23, 0],
    ['ga-errorbook',      'Error notebook — complete pass',               1, 0, 0, 0]
  ]
};

export const TOPICS = Object.entries(RAW).flatMap(([subject, list]) =>
  list.map(([id, name, tier, prelimsWeight, mainsWeight, targetQuestions, resources]) => ({
    id,
    subject,
    name,
    tier,
    prelimsWeight,
    mainsWeight,
    targetQuestions,
    resources: resources || DEFAULT_RESOURCES[subject]
  }))
);

export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map(t => [t.id, t]));

export const SUBJECT_META = {
  reasoning: { label: 'Reasoning', short: 'REAS', varName: '--reasoning' },
  quant:     { label: 'Quantitative', short: 'QUANT', varName: '--quant' },
  english:   { label: 'English', short: 'ENG', varName: '--english' },
  ga:        { label: 'General Awareness', short: 'GA', varName: '--ga' }
};

export const TIER_LABEL = {
  1: 'Tier 1 · highest return',
  2: 'Tier 2 · high frequency',
  3: 'Tier 3 · Mains-specific',
  4: 'Tier 4 · breadth pass',
  5: 'Tier 5 · low priority'
};
