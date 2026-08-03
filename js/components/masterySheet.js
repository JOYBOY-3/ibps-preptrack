/**
 * "How to master this" — a native <dialog> sheet.
 *
 * Bottom sheet on phones, centred modal on desktop. Uses <dialog> so focus
 * trapping, Esc-to-close and the top layer come from the platform rather than
 * from a library. The Today screen stays clean; the depth lives one tap away.
 */

import { el, $ } from '../utils/dom.js';
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
    body.replaceChildren(sessionGuide(topicId, topicName));
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

  body.replaceChildren(
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
  );
}

/** How to RUN a session, for the scheduled activities that have no method. */
const SESSION = {
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
