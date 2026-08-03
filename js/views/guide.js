/**
 * The operating manual, inside the app.
 *
 * It lives here rather than in a README because a file you would never open is
 * not documentation. Deliberately NOT in the bottom nav: that bar is for the six
 * places you go daily, and cramping them to add a screen you read twice is a bad
 * trade. Reachable from the header, from Settings, and from the sign-in gate.
 *
 * Everything below <details> so a phone shows a scannable table of contents
 * rather than four thousand words. The first section is open by default because
 * it is the one thing that changes how you spend the next 145 days.
 */

import { el } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { getState } from '../state/store.js';
import { currentDayNumber } from '../state/selectors.js';
import { PLAN_LABEL } from '../data/phases.js';
import { MAINS, PRELIMS, NEGATIVE_MARK, VACANCIES, TARGETS } from '../data/official.js';

/* ---------------------------------------------------------------- primitives */

const p = text => el('p.g-p', { text });

const lead = text => el('p.g-lead', { text });

function list(items, cls = '') {
  return el(`ul.g-list${cls}`, {}, items.map(x =>
    typeof x === 'string' ? el('li', { text: x }) : el('li', {}, x)));
}

function steps(items) {
  return el('ol.g-steps', {}, items.map(x => el('li', { text: x })));
}

/** A table that scrolls inside itself rather than pushing the page sideways. */
function table(head, rows) {
  return el('div.g-tablewrap', {}, [
    el('table.g-table', {}, [
      el('thead', {}, [el('tr', {}, head.map(h => el('th', { text: h })))]),
      el('tbody', {}, rows.map(r => el('tr', {}, r.map((c, i) =>
        el(i === 0 ? 'th' : 'td', { scope: i === 0 ? 'row' : null, text: String(c) })))))
    ])
  ]);
}

function callout(title, body, tone = '') {
  return el(`div.banner${tone}`, {}, [
    icon(tone.includes('danger') ? 'alert' : tone.includes('good') ? 'check' : 'clock', 'banner__icon'),
    el('div', {}, [title ? el('strong', { text: title + ' ' }) : null, body])
  ]);
}

let openSection = 'start';

function section(id, title, sub, children) {
  // `open: true`, not `open: ''`. el() assigns straight to the property when the
  // key exists on the node, and details.open = '' is FALSY — so the section that
  // is meant to be open by default silently rendered collapsed.
  const d = el('details.g-sec', {
    open: id === openSection ? true : null,
    ontoggle: e => { if (e.target.open) openSection = id; }
  }, [
    el('summary.g-sum', {}, [
      el('div.g-sum__text', {}, [
        el('span.g-sum__title', { text: title }),
        sub ? el('span.g-sum__sub', { text: sub }) : null
      ])
    ]),
    el('div.g-body', {}, children.filter(Boolean))
  ]);
  return d;
}

/* ---------------------------------------------------------------- the guide */

export function guideView() {
  const day = currentDayNumber();
  const state = getState();

  return el('div.view.g-view', {}, [
    el('div.section-head', {}, [
      el('div', {}, [
        el('h1', { text: 'How to use this' }),
        el('p.muted', { style: 'font-size:var(--step--1);margin-top:2px',
          text: `${PLAN_LABEL} · you are on day ${day}` })
      ])
    ]),

    // ------------------------------------------------------------ start here
    section('start', 'Start here', 'The one thing that changes everything', [
      lead('Only your Mains score reaches the merit list. There is no interview.'),
      callout('The notification says it in capitals:',
        '"MARKS OBTAINED IN THE ONLINE MAIN EXAMINATION ONLY WILL BE CONSIDERED FOR ' +
        'FINAL MERIT LISTING."', '.banner--accent'),
      p('Prelims is a gate. Clearing it by one mark and by twenty are worth exactly the same. ' +
        'Everything in this app is arranged around that: get through the gate comfortably, then ' +
        'spend the remaining 77 days on the paper that actually decides your rank.'),
      p('Most aspirants invert this. They over-prepare Prelims because it comes first, arrive at ' +
        'Mains with no Data Interpretation depth and no General Awareness base, and finish 15 ' +
        'marks below a cut-off they never saw. That is the most common way this exam is lost.'),
      table(
        ['Paper', 'Questions', 'Marks', 'Time'],
        [['Prelims', PRELIMS.totalQuestions, PRELIMS.totalMarks, `${PRELIMS.totalMinutes} min`],
         ['Mains', MAINS.totalQuestions, MAINS.totalMarks, `${MAINS.totalMinutes} min`]]),
      p(`Both papers deduct ${NEGATIVE_MARK} for every wrong answer, and both have sectional ` +
        `cut-offs — you must clear a minimum in every single section, not just overall. ` +
        `${VACANCIES.total.toLocaleString('en-IN')} vacancies, and recruitment is state-wise.`)
    ]),

    // ------------------------------------------------------------ daily loop
    section('daily', 'The daily loop', 'Open it, do the blocks, tick them', [
      p('That is the whole job. The app decides what, you decide when.'),
      table(
        ['Block', 'Why it earns its slot'],
        [['10m Calculation drill', 'Unlocks 33 of 35 Numerical questions'],
         ['30m General Awareness', '50 marks in 20 min in Mains. Cannot be crammed.'],
         ['60m Reasoning', '15m concept → 20m untimed → 20m timed → 5m log'],
         ['60m Quantitative', 'Same protocol'],
         ['40m English', 'Topic + 1 RC, timed, every single day'],
         ['10m DI set', 'Largest Mains Quant block. Doubled in Prelims since 2021.'],
         ['30m Revision queue', 'Six graded items, closed book']]),
      callout('Two blocks are never skipped:',
        'the calculation drill and General Awareness. They compound daily and cannot be caught ' +
        'up. Everything else can flex within the day.', '.banner--warn'),
      p('240 minutes of study is about 4 hours 25 minutes of clock once you count breaks. Take ' +
        'them — if you do not, breaks come out of study time and the plan quietly under-delivers.'),
      p('You cannot tick tomorrow. The app refuses days you have not reached, because a tracker ' +
        'you can complete in an afternoon tracks nothing.')
    ]),

    // ------------------------------------------------------------ the logger
    section('logger', 'The practice logger', 'The part that makes everything else work', [
      lead('This app has no questions of its own. What you log is the only evidence it has that ' +
           'you studied at all.'),
      p('After every block: open the topic, tap "How to master this", and enter untimed attempted, ' +
        'timed attempted, and correct. Ten seconds.'),
      p('Skip it and:'),
      list([
        'Every topic reads "not started" forever',
        'The weakest-topics list on Progress stays empty',
        'The weekly "move 10 minutes from X to Y" advice never appears',
        'The app cannot tell a candidate heading for 78 from one heading for 44'
      ], '.g-list--bad'),
      p('Do it and the app can tell you the one thing you cannot tell yourself: which topics are ' +
        'quietly costing you marks.')
    ]),

    // ------------------------------------------------------------ syllabus
    section('syllabus', 'Checking your coverage', 'The Syllabus screen, and what its tick means', [
      lead('Today tells you what to do now. Syllabus tells you whether you are actually covering ' +
           'the exam — open it weekly, not daily.'),
      p('Header, next to the guide and Settings. Prelims and Mains tabs. Under each section you ' +
        'get a guide to attacking that paper, the full year-by-year weightage grid, and every ' +
        'topic grouped under its analysis row, heaviest first.'),
      el('h3.g-h3', { text: 'The tick means what you say it means' }),
      p('Tick a topic when you understand the concept and can solve its questions. That is your ' +
        'judgement, not the app\'s — it records what you say and does not argue. Your logged ' +
        'accuracy sits beside it as information, never as a veto. You are allowed to know ' +
        'something the app has no evidence for.'),
      p('The tick syncs to Drive like everything else, including un-ticking. If you untick on your ' +
        'phone, a stale tick on your laptop will not bring it back.'),
      el('h3.g-h3', { text: 'Two kinds of information, deliberately kept apart' }),
      list([
        'The panel at the top is quoted from the official notification — questions, marks, minutes, negative marking, sectional cut-offs. That is fact.',
        'Everything below it is reverse-engineered from 8 years of memory-based paper analyses, because IBPS has NEVER published a topic-level syllabus and has never released a question paper. That is inference, and the screen says so.'
      ]),
      p('Anyone selling you "the official IBPS Clerk syllabus" is selling you the same inference ' +
        'without the disclaimer.')
    ]),

    // ------------------------------------------------------------ screens
    section('screens', 'Screen by screen', 'What each one is actually for', [
      el('div.g-screens', {}, [
        screenRow('today', 'Today', 'Where you live. Six or seven cards with the next one marked. ' +
          'Tier and weightage chips tell you why this topic is here today. "How to master this" ' +
          'holds the method, tricks, traps, a time target, the book chapter and an AI prompt.'),
        screenRow('week', 'Week', 'Sunday-anchored. Week 1 is short (Wed–Sun); every week after ' +
          'ends on a review day. Use it on Sunday evening, not daily.'),
        screenRow('plan', 'Plan', 'All 145 days. Use it once in week one to see the shape, and ' +
          'again whenever you feel behind. You usually are not.'),
        screenRow('trophy', 'Mocks', 'Log every mock. Negative marking is applied for you and ' +
          'every section is banded live against its target as you type. It will not let you save ' +
          'until you log at least one error — a mock you did not analyse taught you nothing.'),
        screenRow('progress', 'Progress', 'Weekly check. "Where your minutes should go" adapts to ' +
          'your logged accuracy. "Fix these first" ranks weak topics by marks at stake, not raw ' +
          'accuracy — a weak Puzzles beats a weak Mensuration every time.'),
        screenRow('checklist', 'Syllabus', 'Not part of the daily flow — open it weekly to check ' +
          'coverage. Every Prelims and Mains topic, ranked by how many questions it is worth, with ' +
          'the full 8-year weightage grid, how each topic is asked, and a guide to attacking each ' +
          'paper. Tick a topic when you understand it and can solve it.'),
        screenRow('settings', 'Settings', 'Set your state and your real exam dates. Read "Six ' +
          'things that are not about studying" — those cost people the job AFTER they pass.')
      ])
    ]),

    // ------------------------------------------------------------ revision
    section('revision', 'The revision queue', 'Grade honestly or it learns nothing', [
      p('Up to six items a day, closed book, about four minutes each, ranked by what forgetting ' +
        'them would cost.'),
      table(
        ['Button', 'Means', 'What happens'],
        [['Solid', 'I had it, cleanly', 'Pushed further out'],
         ['Shaky', 'Slow, or I hesitated', 'Comes back in 2 days'],
         ['Failed', 'Could not do it', 'Drops back — you see it almost immediately']]),
      callout('Marking Shaky as Solid',
        'is lying to a system whose only job is to catch what you are forgetting.', '.banner--warn'),
      p('What the queue does not reach today, it drops. That is correct, not a failure — an ' +
        'accumulating backlog is a guilt meter, not a study tool. Every topic you have practised ' +
        'also gets a forced touch 12 days and 4 days before Mains.')
    ]),

    // ------------------------------------------------------------ mocks
    section('errors', 'Error buckets', 'Selection is the one nobody tracks', [
      p('Every wrong or skipped question goes in exactly one bucket:'),
      table(
        ['Bucket', 'Meaning'],
        [['Concept', 'I did not know how'],
         ['Slow', 'I knew how, took too long'],
         ['Silly', 'I knew it and misread'],
         ['Selection', 'I should never have attempted this question']]),
      callout('Selection is usually the biggest bucket and almost nobody tracks it.',
        'Chasing a floor puzzle for four minutes costs more than getting it wrong would have.',
        '.banner--danger'),
      p('On Sunday, whichever bucket is largest is the ONLY thing you fix that week. Chasing all ' +
        'four fixes none of them.'),
      p('Analyse harder than you take: 75 minutes of analysis on a 60-minute mock. This is the ' +
        'single biggest difference between a 55 and a 72.')
    ]),

    // ------------------------------------------------------------ rules
    section('rules', 'The eight rules', 'These decide your rank', [
      steps([
        'The calculation drill and GA happen every single day. They compound; everything else flexes.',
        'Log your practice after every block. Ten seconds. Without it this is just a checklist.',
        'The next-day revisit is the whole trick. Studying once is coverage; touching it again is retention.',
        'Never extend a topic past its assigned day. Log it and move on — Sunday has a backlog slot.',
        'Missed a whole day? Skip it permanently and stay on the calendar date. Debt-chasing is how 45-day plans die in week three.',
        'Reading Comprehension every day from day one. Your newspaper reading IS your RC practice.',
        'Fix only the largest error bucket each week.',
        'Apply to IBPS PO, RRB and SBI in parallel — about 90% syllabus overlap, and this plan covers them too.'
      ])
    ]),

    // ------------------------------------------------------------ phases
    section('phases', 'What changes at each phase', 'Five phases, five different jobs', [
      table(
        ['Phase', 'Days', 'What you do differently'],
        [['1 Syllabus', '1–45', '100% of Prelims, weightage-ordered. Six Sunday reviews.'],
         ['2 Prelims mocks', '46–66', 'No new topics. One mock daily + 75 min analysis.'],
         ['PRELIMS', '67–68', ''],
         ['3 Mains build', '69–96', 'The topics that never appear in Prelims.'],
         ['4 Mains mocks', '97–124', 'Three full 125-minute mocks a week.'],
         ['5 Mains final', '125–144', 'Four mocks a week. Three full GA revision passes.'],
         ['MAINS', '145', '']]),
      callout('Phase 2 is where discipline breaks.',
        'Twenty-one days of mocks with no new material feels like you have stopped progressing. ' +
        'You have not — attempt strategy and question selection are what you are building, and ' +
        'they are worth more than another topic.', '.banner--warn'),
      p('Phase 4 runs the full 125 minutes deliberately. Arrive having only ever sat 60-minute ' +
        'mocks and the fourth section collapses on fatigue you never trained for.')
    ]),

    // ------------------------------------------------------------ exam hall
    section('hall', 'In the exam hall', 'Attempt strategy and what to carry', [
      el('h3.g-h3', { text: 'Prelims — 20 minutes per section, no going back' }),
      table(
        ['Section', 'Attempt', 'Accuracy'],
        [['English 30 Q', '22–26', '90%+'],
         ['Numerical 35 Q', '26–30', '92%+'],
         ['Reasoning 35 Q', '28–32', '92%+']]),
      p('Two rounds per section: clear the easy ones in about 13 minutes, then return. If you ' +
        'cannot see the path in 45 seconds, leave it.'),
      callout('Blind guessing is worth exactly zero.',
        'Five options, 0.25 penalty. Guess only when you can eliminate at least one — then it ' +
        'turns positive.', '.banner--accent'),
      el('h3.g-h3', { text: 'Mains — attempt General Awareness FIRST' }),
      p('50 marks in 20 minutes, pure recall, zero thinking cost. Then Reasoning (1.5 marks a ' +
        'question, the richest in the paper), then Quant, then English.'),
      el('h3.g-h3', { text: 'Carry' }),
      list([
        'Call letter with your photograph pasted on it',
        'One additional identical photograph',
        'Original photo ID and a photocopy',
        'FOR MAINS ALSO: your stamped Prelims call letter and stamped ID photocopy — without ' +
          'these you will not be allowed to sit the paper'
      ]),
      el('h3.g-h3', { text: 'Leave at home' }),
      p('Any watch, phone, calculator, scale, wallet chain, ring, earrings, belt, cap, water ' +
        'bottle. The full list is in Settings.')
    ]),

    // ------------------------------------------------------------ milestones
    section('working', 'How you will know it is working', 'Checkpoints, not vibes', [
      table(
        ['By', 'You should see'],
        [['Week 2', 'Calculation drill under 12 min'],
         ['Day 45', 'Every Prelims topic logged. Nothing reading "not started".'],
         ['Day 55', `Prelims mocks at ${TARGETS.prelims.total.good}+, all sections above target`],
         ['Day 66', `${TARGETS.prelims.total.safe}+ consistently`],
         ['Day 96', 'Input-Output and Data Sufficiency at 80%+'],
         ['Day 124', `Mains mocks at ${TARGETS.mains.total.minimum}+ out of 200`],
         ['Day 144', `${TARGETS.mains.total.safe}+. Error notebook shrinking, not growing.`]]),
      p('If a number falls well short, the app has already told you which topic is responsible — ' +
        'that is what "Fix these first" on Progress is for.')
    ]),

    // ------------------------------------------------------------ honesty
    section('limits', 'What this app does not do', 'Read this one', [
      lead('It contains no questions, no mocks and no current affairs. It is a controller ' +
           'pointed at books, a test series and a newspaper.'),
      p('It cannot make you study, and it cannot replace:'),
      list([
        'One test series — Testbook, Adda247 or Oliveboard. Pick ONE.',
        'Three books — Rajesh Verma (Quant), M.K. Pandey (Reasoning), S.P. Bakshi (English)',
        'Daily current affairs — a newspaper, one monthly capsule, one 10-minute recall quiz',
        'A physical error notebook. ₹50, and it is your only revision material in the last ten days.'
      ]),
      p('Topic weightage comes from memory-based shift analyses 2018–2025, because IBPS has never ' +
        'released an official question paper. The rankings have been stable for eight years; the ' +
        'individual numbers carry roughly ±2 questions of error. Everything about the exam ' +
        'structure, dates, vacancies and rules comes from the official notification and nothing else.'),
      el('h3.g-h3', { text: 'Will this guarantee a top rank?' }),
      p('No. Nothing can. Your rank is your preparation relative to everyone else who applied in ' +
        'your state, and you do not control the applicant count, the cut-off, your shift, or your ' +
        'health on the day.'),
      p('What it can do is remove every excuse that is not effort. You will never open the app ' +
        'wondering what to study. You will never spend an hour on a low-weightage topic while a ' +
        '17-question topic sits untouched. You will never take a mock you do not analyse, forget ' +
        'a topic you learned in August, or discover in December that your English was quietly ' +
        'below the sectional cut-off all along.'),
      callout('The plan can carry you. It cannot walk for you.',
        'Open it on day one. Do the blocks. Do it again tomorrow.', '.banner--good')
    ]),

    el('p.g-foot', { text:
      'Exam structure, dates, vacancies and rules: IBPS CRP CSA-XVI notification, 1 Aug 2026. ' +
      'Topic weightage: memory-based shift analyses 2018–2025.' })
  ]);
}

function screenRow(iconName, name, text) {
  return el('div.g-screen', {}, [
    el('span.g-screen__icon', {}, [icon(iconName)]),
    el('div', {}, [
      el('div.g-screen__name', { text: name }),
      el('div.g-screen__text', { text })
    ])
  ]);
}
