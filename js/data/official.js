/**
 * Facts taken directly from the official notification.
 *
 * SOURCE: IBPS CRP CSA-XVI notification, dated 01.08.2026, Mumbai (Director).
 * Every value here is quoted from that PDF — nothing inferred, nothing from a
 * coaching site. Where the notification is silent (the actual exam dates), this
 * module says so rather than inventing a date.
 *
 * This exists because the app spent weeks carrying numbers from coaching sites
 * that contradicted each other, and one of them ("Reasoning Ability & Computer
 * Aptitude") turned out to be wrong.
 */

export const NOTIFICATION = {
  code: 'CRP CSA-XVI',
  post: 'Customer Service Associate (CSA)',
  vacancyYear: '2027-28',
  issued: '2026-08-01',
  source: 'https://www.ibps.in'
};

/** Clause D.I.a — Preliminary. Each test SEPARATELY timed. */
export const PRELIMS = {
  totalQuestions: 100,
  totalMarks: 100,
  totalMinutes: 60,
  sections: [
    { id: 'eng',  name: 'English Language',  questions: 30, marks: 30, minutes: 20, medium: 'English' },
    { id: 'num',  name: 'Numerical Ability', questions: 35, marks: 35, minutes: 20, medium: '*' },
    { id: 'reas', name: 'Reasoning Ability', questions: 35, marks: 35, minutes: 20, medium: '*' }
  ],
  qualifyingNote:
    'Candidates have to qualify in each of the three tests by securing cut-off marks to be ' +
    'decided by IBPS. Adequate number of candidates in each category as decided by IBPS ' +
    'depending upon requirements will be shortlisted for Online Main examination.',
  // "Candidates have to qualify in each of the three tests by securing cut-off
  //  marks to be decided by IBPS."
  sectionalCutoff: true
};

/**
 * Clause D.I.b — Main. Note the section name: "Reasoning Ability".
 *
 * NOT "Reasoning Ability & Computer Aptitude". Several coaching sites still
 * print the old combined heading with a computer sub-syllabus; the notification
 * does not. Computer literacy appears in this recruitment only as an ELIGIBILITY
 * requirement (clause B.VI), not as an examined section.
 */
export const MAINS = {
  totalQuestions: 160,
  totalMarks: 200,
  totalMinutes: 125,
  sections: [
    { id: 'ga',   name: 'General/Financial Awareness', questions: 40, marks: 50, minutes: 20, medium: '*' },
    { id: 'eng',  name: 'General English',             questions: 40, marks: 40, minutes: 35, medium: 'English' },
    { id: 'reas', name: 'Reasoning Ability',           questions: 40, marks: 60, minutes: 35, medium: '*' },
    { id: 'num',  name: 'Quantitative Aptitude',       questions: 40, marks: 50, minutes: 35, medium: '*' }
  ],
  /**
   * The notification's own table header reads "Name of Tests (NOT BY SEQUENCE)".
   * That is not decoration — the four sections can appear in ANY order on the day,
   * so a plan that depends on meeting GA first is a plan that can be broken by the
   * paper. What you control is which section you ATTEMPT first, not which is shown.
   */
  notBySequence: true,
  qualifyingNote:
    'Each candidate will be required to obtain a minimum score in each test of Online Main ' +
    'Examination and also a minimum total score to be considered for further process.',
  // Clause F — "Each candidate will be required to obtain a minimum score in
  // EACH test of Online Main Examination and ALSO a minimum total score."
  sectionalCutoff: true,
  // Clause K — "The total marks allotted for Online Main Examination are 200.
  // Marks will be converted out of 100 for Provisional allotment."
  convertedOutOf: 100,
  // Clause F — "MARKS OBTAINED IN THE ONLINE MAIN EXAMINATION ONLY WILL BE
  // CONSIDERED FOR FINAL MERIT LISTING." There is no interview.
  decidesMerit: true
};

/**
 * The asterisk in the notification's "Medium of Examination" column.
 * English Language is always in English; the rest are bilingual by state.
 */
export const MEDIUM_NOTE =
  'English Language is examined in English only. Every other test is available in English, Hindi ' +
  'and your state\'s language — and where the English and translated versions differ, the English ' +
  'version prevails.';

/** Clause E — applies to BOTH papers. */
export const NEGATIVE_MARK = 0.25;

/**
 * Clause D — the notification gives MONTHS ONLY, not dates.
 *
 *   "Online Examination – Preliminary   October, 2026"
 *   "Online Examination – Main          December, 2026"
 *
 * The plan has to sit on concrete days, so it assumes the dates below — but the
 * app must never present them as official. Real dates arrive with the call
 * letter (September for Prelims, November for Mains), and Settings lets you
 * correct them the moment you know.
 */
export const SCHEDULE = [
  { id: 'registration', label: 'Registration window',     window: '1 – 21 Aug 2026', official: true },
  { id: 'pet',          label: 'Pre-Exam Training (PET)',  window: 'September 2026',  official: true },
  { id: 'prelimsCall',  label: 'Prelims call letter',      window: 'September 2026',  official: true },
  { id: 'prelims',      label: 'PRELIMS',                  window: 'October 2026',    official: true,
    assumedDate: '2026-10-10' },
  { id: 'prelimsResult',label: 'Prelims result',           window: 'November 2026',   official: true },
  { id: 'mainsCall',    label: 'Mains call letter',        window: 'November 2026',   official: true },
  { id: 'mains',        label: 'MAINS',                    window: 'December 2026',   official: true,
    assumedDate: '2026-12-27' },
  { id: 'allotment',    label: 'Provisional allotment',    window: 'March 2027',      official: true }
];

/** Annexure I, summed. Union Bank of India reported nothing, so this is a floor. */
export const VACANCIES = {
  total: 11403,
  note: 'Union Bank of India reported no figures, so the real total is higher.',
  byState: {
    'Andaman & Nicobar': 18, 'Andhra Pradesh': 186, 'Arunachal Pradesh': 45,
    'Assam': 349, 'Bihar': 491, 'Chandigarh': 20, 'Chhattisgarh': 265,
    'Dadra & Nagar Haveli': 18, 'Daman & Diu': 7, 'Delhi': 415, 'Goa': 61,
    'Gujarat': 698, 'Haryana': 196, 'Himachal Pradesh': 97, 'Jammu & Kashmir': 67,
    'Jharkhand': 182, 'Karnataka': 1414, 'Kerala': 108, 'Ladakh': 6,
    'Lakshadweep': 11, 'Madhya Pradesh': 570, 'Maharashtra': 1051, 'Manipur': 42,
    'Meghalaya': 22, 'Mizoram': 17, 'Nagaland': 31, 'Odisha': 337,
    'Puducherry': 26, 'Punjab': 481, 'Rajasthan': 392, 'Sikkim': 28,
    'Tamil Nadu': 675, 'Telangana': 191, 'Tripura': 64, 'Uttar Pradesh': 1731,
    'Uttarakhand': 145, 'West Bengal': 946
  }
};

/**
 * Things in the notification that cost people the job AFTER they clear the exam.
 * None of these are about studying, which is exactly why they get missed.
 */
export const REQUIREMENTS = [
  {
    id: 'state',
    title: 'You apply for ONE state, and the choice is irrevocable',
    detail: 'Clerical recruitment is state-wise. Your cut-off is your state\'s cut-off, ' +
            'not a national one, so the same score can select in one state and miss in another. ' +
            'Vacancy counts vary from 6 (Ladakh) to 1,731 (Uttar Pradesh).'
  },
  {
    id: 'llpt',
    title: 'Local Language Proficiency Test — qualifying, and it can disqualify you',
    detail: 'You must be able to read, write, speak and understand your state\'s specified ' +
            'language. If your 10th-standard marksheet shows you studied it, you are exempt. ' +
            'Otherwise there is a test after Mains, and failing it means no appointment.'
  },
  {
    id: 'computer',
    title: 'Computer literacy is an ELIGIBILITY requirement, not an exam section',
    detail: 'Clause B.VI: you need a certificate/diploma/degree in computer operations, OR to ' +
            'have studied Computer/IT as a subject in school or college. This is checked at ' +
            'document verification. It is NOT tested in the 2026 Mains paper.'
  },
  {
    id: 'sectional',
    title: 'Both papers have SECTIONAL cut-offs',
    detail: 'Clause D and F: you must clear a minimum in every individual test, and a minimum ' +
            'total. A brilliant Reasoning score does not rescue a failed English section.'
  },
  {
    id: 'normalisation',
    title: 'Scores are normalised across shifts (equi-percentile)',
    detail: 'Clause G. A harder shift is not a disadvantage, so there is no point hoping for ' +
            'an easy slot — your score is compared against everyone who sat that shift.'
  },
  {
    id: 'onlyMains',
    title: 'ONLY the Mains score counts for the merit list',
    detail: 'Clause F, stated in capitals in the notification. There is no interview. Prelims ' +
            'is purely a gate — clearing it by one mark or twenty makes no difference at all.'
  }
];

/** Clause O — what you cannot carry in. Worth reading once, in September. */
export const BANNED_ITEMS =
  'No calculator, scale, writing pad, log table, pen drive or any stationery. No mobile, ' +
  'Bluetooth, earphones or smartwatch. No watch of any kind, no camera. No goggles, handbag, ' +
  'hair-pin, hair-band, belt or cap. No ring, earrings, nose-pin, chain or pendant. ' +
  'No metallic item. No food or water bottle.';

/** Clause L — what you must carry. */
export const CARRY_LIST = [
  'Call letter with your photograph pasted on it',
  'One additional identical photograph',
  'Original photo ID + a photocopy (PAN, Passport, Driving Licence, Voter ID, Aadhaar, ' +
    'bank passbook with photo, or college ID). Ration card and learner\'s licence are NOT valid.',
  'For MAINS additionally: the stamped Prelims call letter and stamped ID photocopy — ' +
    'without these you will not be allowed to sit the Mains paper'
];


/**
 * Score targets.
 *
 * IBPS never publishes cut-offs before allotment (clause F), and they move by
 * state and year. So these are TARGETS derived from past selection ranges, not
 * predictions — and the app must present them that way. The point of a target is
 * not accuracy; it is that a mock score means nothing until it is compared with
 * something.
 *
 * Prelims is a gate: clearing it by one mark and by twenty are worth exactly the
 * same, because only the Mains score reaches the merit list.
 */
export const TARGETS = {
  prelims: {
    total:  { safe: 75, good: 68, minimum: 60 },
    // Sectional minimums exist and must each be cleared independently.
    sections: {
      eng:  { safe: 22, good: 18, minimum: 14 },
      num:  { safe: 26, good: 22, minimum: 16 },
      reas: { safe: 27, good: 23, minimum: 18 }
    },
    note: 'Prelims is only a gate. Clear it comfortably, then forget the number.'
  },
  mains: {
    total:  { safe: 120, good: 105, minimum: 90 },
    sections: {
      ga:   { safe: 32, good: 26, minimum: 18 },
      eng:  { safe: 24, good: 20, minimum: 14 },
      reas: { safe: 38, good: 32, minimum: 22 },
      num:  { safe: 28, good: 22, minimum: 15 }
    },
    note: 'This is the only score that reaches the merit list. 120+ out of 200 is ' +
          'top-rank territory in most states; 90 is where selection starts in the ' +
          'largest ones.'
  }
};

/** safe | good | minimum | below — for colour-coding a score against its target. */
export function bandFor(stage, sectionId, score) {
  const t = TARGETS[stage];
  if (!t) return null;
  const b = sectionId ? t.sections[sectionId] : t.total;
  if (!b) return null;
  if (score >= b.safe) return 'safe';
  if (score >= b.good) return 'good';
  if (score >= b.minimum) return 'minimum';
  return 'below';
}
