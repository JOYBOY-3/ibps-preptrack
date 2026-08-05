/**
 * Resource catalogue.
 *
 * Rule the app enforces in the UI: one core book per subject, one video channel
 * per subject, ONE test series. Everything marked `pick-one` is interchangeable —
 * choose a free tier and never switch again.
 *
 * Prices are indicative and change. Platform quality and free-tier limits were not
 * independently verified; these are the resources most widely used by bank aspirants.
 */

export const RESOURCES = [
  // ---------------------------------------------------------------- books
  {
    id: 'bk-verma', type: 'book', title: 'Fast Track Objective Arithmetic',
    author: 'Rajesh Verma', subject: 'quant', priority: 'essential', cost: '₹400–500',
    bestFor: 'Your main Quant book. Arithmetic + simplification, shortcut-heavy.',
    url: null
  },
  {
    id: 'bk-rsa-quant', type: 'book', title: 'Quantitative Aptitude for Competitive Examinations',
    author: 'R.S. Aggarwal', subject: 'quant', priority: 'recommended', cost: '₹500–700',
    bestFor: 'Concept depth and a large question bank per topic.', url: null
  },
  {
    id: 'bk-arun-di', type: 'book', title: 'How to Prepare for Data Interpretation',
    author: 'Arun Sharma', subject: 'quant', priority: 'recommended', cost: '₹450–600',
    bestFor: 'DI sets, especially caselet and mixed DI.', url: null
  },
  {
    id: 'bk-mkpandey', type: 'book', title: 'Analytical Reasoning',
    author: 'M.K. Pandey', subject: 'reasoning', priority: 'essential', cost: '₹350–450',
    bestFor: 'Puzzles, seating, syllogism, data sufficiency — the depth book.', url: null
  },
  {
    id: 'bk-rsa-reas', type: 'book', title: 'A Modern Approach to Verbal & Non-Verbal Reasoning',
    author: 'R.S. Aggarwal', subject: 'reasoning', priority: 'essential', cost: '₹500–700',
    bestFor: 'Broad coverage of every reasoning topic.', url: null
  },
  {
    id: 'bk-sijwali', type: 'book', title: 'A New Approach to Reasoning',
    author: 'B.S. Sijwali', subject: 'reasoning', priority: 'optional', cost: '₹400–550',
    bestFor: 'Extra practice bank once you exhaust the above.', url: null
  },
  {
    id: 'bk-bakshi', type: 'book', title: 'Objective General English',
    author: 'S.P. Bakshi (Arihant)', subject: 'english', priority: 'essential', cost: '₹300–400',
    bestFor: 'Your main English book: grammar rules plus objective practice.', url: null
  },
  {
    id: 'bk-wren', type: 'book', title: 'High School English Grammar & Composition',
    author: 'Wren & Martin', subject: 'english', priority: 'recommended', cost: '₹300–400',
    bestFor: 'Grammar reference for error detection. A lookup, not a cover-to-cover read.', url: null
  },
  {
    id: 'bk-lewis', type: 'book', title: 'Word Power Made Easy',
    author: 'Norman Lewis', subject: 'english', priority: 'optional', cost: '₹200–300',
    bestFor: 'Vocabulary — 15 min/day maximum. Reading beats word lists.', url: null
  },
  {
    id: 'bk-banking', type: 'book', title: 'Banking Awareness',
    author: 'Arihant', subject: 'ga', priority: 'essential', cost: '₹300–400',
    bestFor: 'Static banking and financial awareness for Mains.', url: null
  },
  {
    id: 'bk-lucent', type: 'book', title: "Lucent's General Knowledge",
    author: 'Lucent', subject: 'ga', priority: 'recommended', cost: '₹250–350',
    bestFor: 'Static GK — capitals, currencies, first-in-India.', url: null
  },

  // ---------------------------------------------------------------- video
  {
    id: 'yt-adda247', type: 'video', title: 'Adda247 / Bankers Adda',
    author: null, provider: 'YouTube', subject: 'all', priority: 'essential', cost: 'Free',
    bestFor: 'Full syllabus coverage, daily live classes, post-exam analysis.',
    url: 'https://www.youtube.com/@Adda247'
  },
  {
    id: 'yt-studysmart', type: 'video', title: 'Study Smart — Chandrahas Tiwari',
    author: null, provider: 'YouTube', subject: 'quant', priority: 'recommended', cost: 'Free',
    bestFor: 'Quant concepts and DI technique.',
    url: 'https://www.youtube.com/@StudySmart'
  },
  {
    id: 'yt-oliveboard', type: 'video', title: 'Oliveboard',
    author: null, provider: 'YouTube', subject: 'all', priority: 'recommended', cost: 'Free',
    bestFor: 'Strategy sessions, GA capsules, mock walkthroughs.',
    url: 'https://www.youtube.com/@Oliveboard'
  },
  {
    id: 'yt-feelfree', type: 'video', title: 'Feel Free to Learn',
    author: null, provider: 'YouTube', subject: 'quant', priority: 'optional', cost: 'Free',
    bestFor: 'Quantitative aptitude concept building.',
    url: 'https://www.youtube.com/@FeelFreetoLearn'
  },
  {
    id: 'yt-bankerspoint', type: 'video', title: 'Bankers Point — YouTube search',
    author: null, provider: 'YouTube', subject: 'all', priority: 'optional', cost: 'Free',
    bestFor: 'Practice questions, quizzes, live solving.',
    url: 'https://www.youtube.com/results?search_query=bankers+point'
  },

  // ---------------------------------------------------------------- test series
  {
    id: 'ts-testbook', type: 'website', title: 'Testbook — IBPS Clerk test series',
    provider: 'Testbook', subject: 'all', priority: 'pick-one', cost: 'Free tier / ₹500–1,000',
    bestFor: 'Mocks plus the strongest analytics dashboard.',
    url: 'https://testbook.com/ibps-clerk/test-series'
  },
  {
    id: 'ts-adda247', type: 'website', title: 'Adda247 — IBPS Clerk mock tests',
    provider: 'Adda247', subject: 'all', priority: 'pick-one', cost: 'Free tier / ₹500–1,000',
    bestFor: '280+ tests including memory-based papers and sectionals.',
    url: 'https://www.adda247.com/ibps-clerk/mock-test'
  },
  {
    id: 'ts-oliveboard', type: 'website', title: 'Oliveboard — IBPS Clerk test series',
    provider: 'Oliveboard', subject: 'all', priority: 'pick-one', cost: 'Free tier / ₹500–1,000',
    bestFor: 'Mock analytics with percentile comparison.',
    url: 'https://www.oliveboard.in/ibps-clerk/'
  },
  {
    id: 'ts-ixambee', type: 'website', title: 'ixamBee — free mocks',
    provider: 'ixamBee', subject: 'all', priority: 'optional', cost: 'Free',
    bestFor: 'Free mocks in both Hindi and English.',
    url: 'https://www.ixambee.com/free-mock-tests/ibps-clerk'
  },
  {
    id: 'ts-practicemock', type: 'website', title: 'PracticeMock',
    provider: 'PracticeMock', subject: 'all', priority: 'optional', cost: 'Free / paid',
    bestFor: 'Detailed post-mock reports.',
    url: 'https://www.practicemock.com/'
  },

  // ---------------------------------------------------------------- current affairs
  {
    id: 'ca-hindu', type: 'website', title: 'The Hindu / Indian Express — editorial page',
    provider: null, subject: 'ga', priority: 'essential', cost: '₹10–15/day',
    bestFor: '15 pages daily. Doubles as your Reading Comprehension practice.',
    url: 'https://www.thehindu.com/opinion/editorial/'
  },
  {
    id: 'ca-capsule', type: 'website', title: 'Monthly current affairs capsule PDF',
    provider: 'Adda247 / Oliveboard', subject: 'ga', priority: 'essential', cost: 'Free',
    bestFor: 'One capsule a month. Your revision spine for Mains GA.',
    url: 'https://currentaffairs.adda247.com/'
  },
  {
    id: 'ca-quiz', type: 'website', title: 'Daily current affairs quiz',
    provider: 'Adda247 / GKToday', subject: 'ga', priority: 'essential', cost: 'Free',
    bestFor: '10 min daily. Tests recall, not just reading.',
    url: 'https://www.gktoday.in/current-affairs/'
  },
  {
    id: 'ca-rbi', type: 'website', title: 'RBI — press releases & circulars',
    provider: 'Reserve Bank of India', subject: 'ga', priority: 'recommended', cost: 'Free',
    bestFor: 'Primary source for banking awareness questions.',
    url: 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx'
  },
  {
    id: 'ca-pib', type: 'website', title: 'PIB — Press Information Bureau',
    provider: 'Government of India', subject: 'ga', priority: 'optional', cost: 'Free',
    bestFor: 'Government schemes and announcements, first-hand.',
    url: 'https://www.pib.gov.in/'
  },

  // ---------------------------------------------------------------- official & tools
  {
    id: 'off-ibps', type: 'website', title: 'ibps.in — notification, syllabus, admit card',
    provider: 'IBPS', subject: 'all', priority: 'essential', cost: 'Free',
    bestFor: 'Read the actual notification PDF once, fully. Verify the pattern here.',
    url: 'https://www.ibps.in/'
  },
  {
    id: 'tool-errorbook', type: 'tool', title: 'One physical error notebook',
    provider: null, subject: 'all', priority: 'essential', cost: '₹50',
    bestFor: 'Your only revision material in the final ten days before each exam.', url: null
  },
  {
    id: 'tool-calcdrill', type: 'tool', title: 'Calculation drill sheet',
    provider: null, subject: 'quant', priority: 'essential', cost: 'Free',
    bestFor: 'Tables to 30, squares to 40, cubes to 20, fraction↔% table. Buys ~4 min per paper.',
    url: null
  }
];

export const RESOURCE_BY_ID = Object.fromEntries(RESOURCES.map(r => [r.id, r]));

/** Default resource bundle per subject, used when a topic declares none of its own. */
export const DEFAULT_RESOURCES = {
  reasoning: ['bk-mkpandey', 'yt-adda247', 'ts-testbook'],
  quant: ['bk-verma', 'yt-studysmart', 'ts-testbook'],
  english: ['bk-bakshi', 'yt-adda247', 'ts-testbook'],
  ga: ['bk-banking', 'ca-capsule', 'ca-quiz'],
  all: ['yt-adda247', 'ts-testbook']
};
