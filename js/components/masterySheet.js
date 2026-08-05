/**
 * "How to master this" — a native <dialog> sheet.
 *
 * Bottom sheet on phones, centred modal on desktop. Uses <dialog> so focus
 * trapping, Esc-to-close and the top layer come from the platform rather than
 * from a library. The Today screen stays clean; the depth lives one tap away.
 */

import { el, $, fill } from '../utils/dom.js';
import { icon } from './icons.js';
import { getMastery } from '../data/mastery.js';
import { logTopicPractice } from '../state/actions.js';
import { getState } from '../state/store.js';
import { topicAccuracy, topicStatus } from '../state/selectors.js';
import { toast } from '../utils/ui.js';

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const MOTIVATION_LABEL = {
  'quick-win': 'Quick win — visible gain within days',
  steady: 'Steady — reliable, gradual',
  grind: 'Grind — long payoff, worth it'
};

function copyButton(label, text) {
  if (!text) return null;
  return el('button.btn.btn--sm.copy-btn', {
    type: 'button',
    onclick: async e => {
      try {
        await navigator.clipboard.writeText(text);
        const btn = e.currentTarget;
        btn.classList.add('is-copied');
        toast('Copied');
        setTimeout(() => btn.classList.remove('is-copied'), 1400);
      } catch {
        toast('Could not copy — long-press to select instead', 'danger');
      }
    }
  }, [icon('check'), label]);
}

/** coreMethod and blockPlan arrive as newline-separated prose. Keep the breaks. */
function prose(text) {
  const box = el('div.ms-prose');
  for (const line of String(text || '').split('\n')) {
    if (!line.trim()) continue;
    box.append(el('p', { text: line.trim() }));
  }
  return box;
}

function section(title, node, mod = '') {
  if (!node) return null;
  return el(`section.ms-sec${mod}`, {}, [el('h3.ms-sec__title', { text: title }), node]);
}

function bullets(items, cls = '') {
  if (!items?.length) return null;
  return el(`ul.ms-list${cls}`, {}, items.map(x => el('li', { text: x })));
}

export async function openMasterySheet(subject, topicId, topicName) {
  const existing = $('#mastery-sheet');
  if (existing) existing.remove();

  const body = el('div.ms-body', {}, [el('div.ms-loading', { text: 'Loading…' })]);

  const dlg = el('dialog#mastery-sheet.ms', {}, [
    el('div.ms-grabber', { 'aria-hidden': 'true' }),
    el('header.ms-head', {}, [
      el('div', {}, [
        el('span.eyebrow', { text: 'How to master this' }),
        el('h2.ms-title', { text: topicName || topicId })
      ]),
      el('button.icon-btn', {
        type: 'button', 'aria-label': 'Close',
        onclick: () => dlg.close()
      }, [icon('close')])
    ]),
    body
  ]);

  document.body.append(dlg);
  dlg.showModal();
  dlg.addEventListener('close', () => dlg.remove());
  // Tapping the backdrop closes it, the way a sheet should behave.
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  const m = await getMastery(subject, topicId);

  if (!m) {
    // 24 days schedule ACTIVITIES rather than topics — "Banking awareness, full
    // revision", "Reasoning sectional", "Error notebook, complete pass". They have
    // no solving method to teach, so they used to open a blank sheet. They get a
    // session protocol instead, which is what they actually need.
    fill(body, sessionGuide(topicId, topicName));
    return;
  }

  const chips = el('div.chip-row', {}, [
    m.difficulty ? el('span.chip', { text: DIFFICULTY_LABEL[m.difficulty] || m.difficulty }) : null,
    m.motivationValue
      ? el(`span.chip${m.motivationValue === 'quick-win' ? '.chip--good' : ''}`,
          { text: MOTIVATION_LABEL[m.motivationValue] || m.motivationValue })
      : null,
    m.timeTarget ? el('span.chip.chip--accent', { text: 'Target: ' + shortTime(m.timeTarget) }) : null
  ]);

  fill(body, [
    m.confidence === 'medium' || m.confidence === 'low'
      ? el('div.banner.banner--warn', {}, [icon('alert', 'banner__icon'), el('div', {}, [
          el('strong', { text: 'Cross-check this one. ' }),
          'The method below is written with ' + m.confidence + ' confidence. It is sound as far as ' +
          'review could establish, but verify it against your book the first time you use it — ' +
          'and if your book disagrees, trust your book.'
        ])])
      : null,
    chips,
    m.whatItIs ? el('p.ms-lede', { text: m.whatItIs }) : null,
    section('The method', prose(m.coreMethod), '.ms-sec--method'),
    section('Tricks that save seconds', bullets(m.tricks, '.ms-list--good')),
    section('Traps that cost marks', bullets(m.traps, '.ms-list--bad')),
    section('Time target', m.timeTarget ? el('p', { text: m.timeTarget }) : null),
    section('You have mastered it when', m.masteryCheck ? el('p', { text: m.masteryCheck }) : null),
    section('How IBPS asks it', bullets(m.questionPatterns)),
    section('Your 60-minute block', prose(m.blockPlan)),
    practiceLogger(subject, topicId),
    section('Where to study it', el('div.ms-res', {}, [
      m.bookRef ? el('div.resource', {}, [icon('book', 'resource__icon'), el('span', { text: m.bookRef })]) : null,
      m.websiteRef
        ? el('div.resource', {}, [icon('globe', 'resource__icon'), linkOrText(m.websiteRef)])
        : null,
      m.searchQuery
        ? el('div.ms-copyrow', {}, [
            el('div', {}, [
              el('div.ms-copyrow__label', { text: 'Search this on YouTube' }),
              el('code.ms-code', { text: m.searchQuery })
            ]),
            copyButton('Copy', m.searchQuery)
          ])
        : null,
      m.aiPrompt
        ? el('div.ms-copyrow.ms-copyrow--ai', {}, [
            el('div', {}, [
              el('div.ms-copyrow__label', { text: 'Paste into Claude or ChatGPT for practice' }),
              el('code.ms-code.ms-code--long', { text: m.aiPrompt })
            ]),
            copyButton('Copy prompt', m.aiPrompt)
          ])
        : null
    ]))
  ]);
}

/** How to RUN a session, for the scheduled activities that have no method. */
const SESSION = {
  drill: {
    match: /^block:calc$/,
    title: 'How to run the calculation drill',
    steps: [
      'Ten minutes, timed, every day without exception. This block and General Awareness are the two that compound — miss them and you cannot catch up.',
      'Rotate: tables to 30 · squares to 40 · cubes to 20 · fraction↔percentage · reciprocals 1/7 to 1/25. One focus a day, all of them touched every week.',
      'Say the answers ALOUD or write them. Reading a table is not drilling it; retrieval is.',
      'Time yourself and write the number down. This is the one block where the only measure that matters is speed, and speed is invisible without a stopwatch.',
      'By September shift the emphasis to approximation and ratio comparison — that is the arithmetic Data Interpretation actually consumes under time pressure.'
    ],
    check: 'Any two-digit multiplication in under 3 seconds, and 1/13 as a decimal without pausing.'
  },
  distoday: {
    match: /^block:di$/,
    title: 'How to run the daily DI set',
    steps: [
      'One set a day, timed, whatever type you meet. Ten minutes.',
      'Before calculating anything, spend 20 seconds reading the caption and the units. Most DI errors are unit errors, not arithmetic errors.',
      'Work the questions in the order they are cheapest, not the order they are printed.',
      'Approximate first, calculate only if two options are close. Full precision on a question that needed a rough estimate is the commonest way DI eats six minutes.',
      'Log it. DI is 20 of 40 Mains Quant questions and has doubled in Prelims since 2021 — your accuracy here is worth knowing.'
    ],
    check: 'A five-question table or bar set inside 4 minutes with all five right.'
  },
  queue: {
    match: /^block:rev$/,
    title: 'How to run the revision queue',
    steps: [
      'Six items, closed book, about four minutes each.',
      'For each: write down what you remember of the method BEFORE opening anything. That retrieval attempt is the entire point — recognising a method you are shown teaches you nothing.',
      'Then do 3 to 5 questions on it, timed.',
      'Grade honestly. Solid pushes it further out, Shaky repeats it in two days, Failed drops it back to tomorrow. Marking Shaky as Solid is lying to the one system whose job is catching what you are forgetting.',
      'What the queue does not reach today, it drops. That is correct — an accumulating backlog is a guilt meter, not a study tool.'
    ],
    check: 'You can state the method cold, before looking, for five of the six.'
  },
  mock: {
    match: /^block:mock$/,
    title: 'How to sit a full mock',
    steps: [
      'Sit it at the hour your real shift is likely to run, not late at night. You are training a body clock as well as a brain.',
      'Phone in another room, one sheet of rough paper, no pausing, no looking anything up. A mock you paused is a practice set, and it will lie to you about your score.',
      'Prelims: 20 minutes locked per section — you cannot carry spare English time into Quant, so rehearse that constraint. Mains: the four sections can arrive in ANY order, so never rehearse a fixed sequence.',
      'Two passes inside each section. Pass one takes only what you see the path to within about 40 seconds; pass two returns to what you left. The single commonest way to lose a paper is sinking four minutes into question three.',
      'Score it with negative marking — 0.25 off every wrong answer — and check each sectional cut-off separately. A strong total with one failed section is a failed paper.',
      'Log it in Mocks the same day. An unlogged mock tells you nothing next month, and the trend is the only thing here that matters.'
    ],
    check: 'You finished under the real clock, cleared every sectional target, and your attempt count landed inside the band rather than above it.'
  },
  analysis: {
    match: /^block:anal$/,
    title: 'How to analyse a mock',
    steps: [
      'Seventy-five minutes on analysis against sixty on the paper is deliberate, and it is the most valuable block in this plan. The mock only generates the data; this is where the marks are actually made.',
      'Start with what you SKIPPED and got right by leaving alone — that was good selection, and you should know what it felt like.',
      'Then the three expensive categories, in this order: questions you attempted and got wrong · questions you skipped that you could easily have solved · questions you spent over 90 seconds on.',
      'Give every error a bucket — concept · calculation · misread · selection · time. Do not write "silly mistake". That bucket does not exist; a misread is a reading-speed problem and a calculation slip is a drill problem, and they have different fixes.',
      'Re-solve every wrong question fully, on paper, without the solution in front of you. Reading a solution and nodding produces the feeling of learning and none of it.',
      'Copy each error into the error notebook with its bucket, then write ONE sentence: what you will do differently in the next mock. One change, not five.',
      'Whichever bucket is biggest is the only thing you change this week.'
    ],
    check: 'Every wrong answer is re-solved and bucketed, and you can name the single change you are making before the next mock.'
  },
  weakarea: {
    match: /^block:weak$/,
    title: 'How to run weak-area drilling',
    steps: [
      'Open Progress and take the top item from the weakest-topics list. Do not choose by feel — you will pick the topic you enjoy, which is by definition not the weak one.',
      'Weightage breaks the tie. A topic at 60% that is worth 5 questions beats one at 40% worth half a question.',
      'Read your own notes on the method for two minutes, then close them. Everything after this point is closed-book.',
      'Twenty questions, easy to hard, untimed first. You are rebuilding the method, and a clock at this stage just rehearses the panic.',
      'Then ten more, timed, at exam pace. A method you can only run slowly is not yet worth anything in a 20-minute section.',
      'Still under 70% after the timed ten? It is a concept gap, not a practice gap — schedule the full topic again rather than drilling the same hole deeper.'
    ],
    check: 'The topic has moved above 75% in Progress, on questions logged today rather than remembered from last month.'
  },
  gaweek: {
    match: /^block:ga$/,
    title: 'How to run the weekly GA revision',
    steps: [
      'Current affairs is the one section you can guarantee marks in, and the only one where a week off is unrecoverable. Treat this block as fixed.',
      'Closed book first. On one sheet, write everything you remember from the week: appointments · schemes · banking and RBI news · awards · sport · obituaries · summits.',
      'Now open your source and mark ONLY the misses in red. What you recalled needs no more time.',
      'Numbers matter more than names in this exam — repo rate, limits, scheme amounts, ranks. Names are recognised in the options; figures are not.',
      'For banking items, ask what CHANGED and by how much. "RBI issued guidelines" is not an answer to anything.',
      'Carry the red items into the six-week revision pass. Everything else is done — do not re-read it.'
    ],
    check: 'Fifteen or more items recalled cold, before opening anything, with the figures attached.'
  },
  puzzles: {
    match: /^block:puzz$/,
    title: 'How to run the puzzle sets',
    steps: [
      'Two sets, twenty minutes. Puzzles and seating are about 17 of 35 Prelims Reasoning questions — half the section rides on this block.',
      'Two minutes reading before you write anything. Sort the clues into fixed (place them now), relative (place them later) and negative (they eliminate). Most people write the grid first and lose because of it.',
      'Start from the most constrained clue, never from clue one.',
      'If a set has not opened up after 6 minutes, leave it and start the second. Knowing when to abandon a puzzle IS the skill being tested, and it is the one you cannot practise if you always push through.',
      'Then go back to the abandoned one and find the exact clue you should have started from. That single habit is what moves puzzle timing.'
    ],
    check: 'A five-question set solved fully inside 7 minutes, and an honest abandon inside 6 when it is not opening.'
  },
  mixed: {
    match: /^block:mixed$/,
    title: 'How to run the mixed set',
    steps: [
      'Twenty questions per topic, shuffled, no labels. Practising a topic in a labelled block teaches you the method; this teaches you to RECOGNISE which method to reach for, which is what the paper actually asks.',
      'Before solving each one, say what type it is. If you cannot name the type in 10 seconds, that is the error — record it as a recognition failure even if you go on to solve it.',
      'Timed, at exam pace, in one sitting.',
      'Mark recognition failures separately from method failures. They have completely different fixes: one needs more variety, the other needs the topic again.'
    ],
    check: 'You name the type correctly on eighteen of twenty before starting to solve.'
  },
  backlog: {
    match: /^block:backlog$/,
    title: 'How to run backlog clearing',
    steps: [
      'Fifteen minutes, hard stop. This block exists so a missed day does not become a missed week — it is not a second chance to do everything.',
      'List what slipped. Then take the ONE item with the highest exam weightage and do only that.',
      'Everything else is written off deliberately, today, rather than carried forward as guilt. A backlog you keep carrying is heavier than the work in it.',
      'Slipping in the same slot three weeks running is not a discipline problem — the schedule is wrong for your day. Move that block permanently in Settings.'
    ],
    check: 'Fifteen minutes, one item cleared, the rest consciously dropped rather than postponed.'
  },
  decide: {
    match: /^block:decide$/,
    title: 'How to run the weekly decision',
    steps: [
      'Fifteen minutes, once a week, and it decides what the next seven days look like. Skipping it is how people study hard for four months in the wrong direction.',
      'Read three numbers only: this week\u2019s mock total, the weakest section, and the largest error bucket.',
      'Choose ONE change for next week. One. Two changes and you will not know which one worked.',
      'Write it as a specific action — "attempt 4 fewer Quant questions and check each one" beats "improve accuracy", which is not an instruction anyone can follow.',
      'Check the sectional targets too, not just the total. A rising total hiding a sinking section is the failure mode this block exists to catch.'
    ],
    check: 'One written, specific change for the coming week, chosen from the numbers rather than from how the week felt.'
  },
  fullsubject: {
    match: /^block:(reas|quant|eng)$/,
    title: 'How to run a full-subject revision day',
    steps: [
      'This is a consolidation day immediately before Prelims, not a learning day. Nothing new is opened today — starting a new topic now costs confidence and buys nothing.',
      'Go along your topic list for this subject and, for each, state the method aloud from memory. Ten to twenty seconds each.',
      'Anything you cannot state gets 5 questions immediately. Anything you can, gets none.',
      'Then one timed sectional at full length to confirm the pace is still there.',
      'Finish by writing this subject onto one index card: the order you attempt it in, your attempt target, and the two traps you personally fall into. That card is what you read the morning of the exam.'
    ],
    check: 'Every topic\u2019s method stated cold, and one sectional at target attempts with 90%+ accuracy.'
  },
  revision: {
    match: /-rev$|revision/i,
    title: 'How to run a revision pass',
    steps: [
      'Close the book. Write down everything you remember on one sheet, from memory only. This is the whole exercise — reading is not revision.',
      'Now open your notes and mark, in red, only what you MISSED. Not what you got right.',
      'Count the red marks. Fewer than 5 means this block is solid; park it for two weeks.',
      'More than 15 means you never learned it — this is not a revision problem, so re-study it in tomorrow\'s slot instead.',
      'Finish by writing the 5 hardest items onto a single index card. That card, not the notes, is what you read in the last week.'
    ],
    check: 'You can reproduce 80% of the block on blank paper in under 10 minutes.'
  },
  sectional: {
    match: /sectional|marathon/i,
    title: 'How to run a sectional',
    steps: [
      'Set a timer for the REAL sectional time and do not pause it. Prelims: 20 minutes. Mains Reasoning or English: 35 minutes.',
      'Two rounds. Round one takes only what you can see the path to in 45 seconds. Round two returns to what you skipped.',
      'Mark every question you SKIPPED as well as every one you got wrong — selection errors cost more than concept errors and are invisible unless you record them.',
      'Score it with negative marking. −0.25 per wrong answer. A raw count of correct answers is not a score.',
      'Log it in Mocks as a sectional so it joins the trend, and put every error in the error notebook with its bucket.'
    ],
    check: 'Your attempt count sits inside the target band and accuracy stays above 90%.'
  },
  audit: {
    match: /audit/i,
    title: 'How to run the syllabus audit',
    steps: [
      'Open Progress and read the weakest-topics list. Do not rely on memory for this — memory flatters you.',
      'For every topic below 75% accuracy, write it on a single list. That list is your remaining syllabus.',
      'Anything with zero questions logged is NOT covered, whatever the tick says. Ticking a block means you sat there; accuracy means you learned it.',
      'Rank the list by exam weightage, not by how much you dislike each topic.',
      'The top five become the weak-area slots for the next fortnight. Ignore the rest until those five move.'
    ],
    check: 'You can name your five weakest high-weightage topics without looking.'
  },
  errorbook: {
    match: /error notebook|errorbook/i,
    title: 'How to run an error-notebook pass',
    steps: [
      'Read only the ERROR, not the solution. Try to re-solve it cold.',
      'Solved it instantly? Strike it out — it is learned and it is now noise.',
      'Hesitated? Leave it. It comes round again next pass.',
      'Failed it again? It is a concept gap, not a slip. Schedule the parent topic as a full study block.',
      'Count the buckets at the end. Whichever is largest is the ONLY thing you change next week.'
    ],
    check: 'The notebook shrinks between passes. If it only grows, you are collecting errors instead of fixing them.'
  }
};

/**
 * Block ids that have a session protocol, mapped to the name the sheet is opened with.
 *
 * blockCard reads THIS — the button and the sheet must never disagree about whether
 * there is anything to show. A block absent from here and carrying no topic gets no
 * button at all, rather than one that opens an apology.
 */
export const BLOCK_SESSIONS = {
  calc:    'Calculation drill',
  di:      'DI set',
  rev:     'Revision queue',
  mock:    'Full mock',
  anal:    'Mock analysis',
  errbk:   'Error notebook',
  weak:    'Weak-area drilling',
  ga:      'GA week revision',
  puzz:    'Puzzle sets',
  mixed:   'Mixed set',
  backlog: 'Backlog clearing',
  decide:  'Weekly decision',
  reas:    'Reasoning revision day',
  quant:   'Quantitative revision day',
  eng:     'English revision day'
};

function sessionGuide(topicId, topicName) {
  const key = Object.keys(SESSION).find(k => SESSION[k].match.test(topicId) || SESSION[k].match.test(topicName || ''));
  const g = key ? SESSION[key] : null;

  if (!g) {
    return el('div.ms-empty', {}, [
      el('p', { text: 'This is a scheduled session rather than a topic, so there is no method to teach.' }),
      el('p.muted', { text: 'Follow the block note on the card and use your own notes and error book.' })
    ]);
  }

  return el('div', {}, [
    el('p.ms-lede', {
      text: 'This is a session, not a topic — there is nothing new to learn here. ' +
            'What matters is running it properly, because a session done passively is a session wasted.'
    }),
    el('section.ms-sec.ms-sec--method', {}, [
      el('h3.ms-sec__title', { text: g.title }),
      el('ol.ms-steps', {}, g.steps.map(x => el('li', { text: x })))
    ]),
    el('section.ms-sec', {}, [
      el('h3.ms-sec__title', { text: 'You have done it properly when' }),
      el('p', { text: g.check })
    ])
  ]);
}

/**
 * Log practice against this topic.
 *
 * Without this the app has no evidence the outsourced practice ever happened.
 * topicStatus() would return 'not-started' for all 136 topics for all 145 days,
 * and the app could not tell a candidate heading for 78 from one heading for 44.
 */
function practiceLogger(subject, topicId) {
  const state = getState();
  const rec = state.topics[topicId] || {};
  const attempted = (rec.untimed || 0) + (rec.timed || 0);
  const acc = topicAccuracy(state, topicId);
  const status = topicStatus(state, topicId);

  const untimed = el('input.input.input--num', { type: 'number', min: '0', placeholder: '0', inputmode: 'numeric' });
  const timed   = el('input.input.input--num', { type: 'number', min: '0', placeholder: '0', inputmode: 'numeric' });
  const correct = el('input.input.input--num', { type: 'number', min: '0', placeholder: '0', inputmode: 'numeric' });

  const STATUS_TONE = { mastered: 'chip--good', 'needs-rework': 'chip--danger', 'in-progress': 'chip--warn' };
  const STATUS_TEXT = { mastered: 'Mastered', 'needs-rework': 'Needs rework',
                        'in-progress': 'In progress', 'not-started': 'Not started' };

  return el('section.ms-sec', {}, [
    el('h3.ms-sec__title', { text: 'Log your practice' }),
    el('div.practice', {}, [
      el('div.practice__now', {}, [
        el(`span.chip${STATUS_TONE[status] ? '.' + STATUS_TONE[status] : ''}`, { text: STATUS_TEXT[status] }),
        el('span.muted', { text: `${attempted} questions logged` }),
        acc !== null ? el('span.mono', { text: `${Math.round(acc * 100)}% accuracy` }) : null
      ]),
      el('div.practice__grid', {}, [
        el('label', {}, [el('span', { text: 'Untimed' }), untimed]),
        el('label', {}, [el('span', { text: 'Timed' }), timed]),
        el('label', {}, [el('span', { text: 'Correct' }), correct])
      ]),
      el('button.btn.btn--full', {
        type: 'button',
        onclick: () => {
          const u = Number(untimed.value) || 0, t = Number(timed.value) || 0, c = Number(correct.value) || 0;
          if (!u && !t) { toast('Enter how many you attempted', 'danger'); return; }
          if (c > u + t) { toast('Correct cannot exceed attempted', 'danger'); return; }
          logTopicPractice(topicId, { untimed: u, timed: t, correct: c });
          untimed.value = timed.value = correct.value = '';
          toast('Practice logged');
        }
      }, [icon('check'), 'Add to this topic'])
    ])
  ]);
}

function shortTime(t) {
  const m = String(t).match(/[\d]+[\d\-–:. ]*(?:seconds|sec|s|minutes|min|m)?/i);
  return m ? m[0].trim().replace(/\s+$/, '') : String(t).slice(0, 24);
}

function linkOrText(ref) {
  const url = String(ref).match(/https?:\/\/\S+/);
  if (!url) return el('span', { text: ref });
  const rest = String(ref).replace(url[0], '').replace(/^[\s(]+|[\s)]+$/g, '');
  return el('span', {}, [
    el('a', { href: url[0], target: '_blank', rel: 'noopener noreferrer', text: prettyHost(url[0]) }),
    rest ? el('span.muted', { text: ' — ' + rest }) : null
  ]);
}

function prettyHost(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; }
}
