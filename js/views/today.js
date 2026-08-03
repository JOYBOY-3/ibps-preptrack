/**
 * Today — the hero screen.
 *
 * Principle 1: one screen answers "what now?". It opens by default and
 * auto-scrolls to the first incomplete block, so starting costs zero taps.
 */

import { el, announce } from '../utils/dom.js';
import { icon } from './../components/icons.js';
import { blockCard } from '../components/blockCard.js';
import { DAY_BY_NUMBER } from '../data/curriculum.js';
import { TOPIC_BY_ID } from '../data/topics.js';
import { getState } from '../state/store.js';
import { toggleBlock, setQuestionsSolved, markRevisionDone, isFutureDay, REVISION_OFFSETS } from '../state/actions.js';
import {
  currentDayNumber, dayProgress, dueRevisions, streak, countdowns
} from '../state/selectors.js';
import { formatLong, relative } from '../utils/dates.js';
import { prefetchSubject } from '../data/mastery.js';

let viewedDay = null;

/**
 * Refs to the few nodes a block tap actually changes. Patching these in place is
 * the difference between "ticked a box" and "the page reloaded": the entry
 * animation does not replay, the scroll position holds, and focus survives.
 */
let refs = null;

export function setViewedDay(day) { viewedDay = day; }

function dots(done, total) {
  return el('div.dots', { 'aria-hidden': 'true' },
    Array.from({ length: total }, (_, i) => el(`span.dot${i < done ? '.is-done' : ''}`)));
}

function revisionQueue(state, day) {
  const due = dueRevisions(state, day.date);
  if (!due.length) return null;

  return el('section.card', {}, [
    el('div.card__body', {}, [
      el('div.section-head', { style: 'margin-bottom:var(--sp-3)' }, [
        el('span.eyebrow', { text: `Due for revision (${due.length})` }),
        el('span.muted', { style: 'font-size:var(--step--1)',
          text: due.overdueTotal > due.length
            ? `Top ${due.length} by exam weight · ${due.overdueTotal - due.length} more can wait`
            // Derived, never typed. A hardcoded list here silently advertised the
            // OLD ladder for a whole build after the intervals were retuned.
            : `Spaced repetition — ${REVISION_OFFSETS.map(o => 'N+' + o).join(' · ')}, then a forced touch 12 and 4 days before Mains` })
      ]),
      el('div.revision-list', {}, due.map(r => el('div.revision-item', {}, [
        el('div', { style: 'min-width:0' }, [
          el('div.revision-item__name', { text: r.topic?.name || r.topicId }),
          el('div.muted', { text: `N+${r.offset} · due ${relative(r.due)}` })
        ]),
        // Grading, not dismissing. A single "Done" button lets you tick away a
        // topic you could not actually solve, and teaches the schedule nothing.
        el('div.rev-grade', {}, [
          el('button.btn.btn--sm.rev-grade__solid', {
            type: 'button', title: 'I had it — push it further out',
            onclick: () => { markRevisionDone(r.topicId, r.offset, 'solid'); announce('Marked solid'); }
          }, ['Solid']),
          el('button.btn.btn--sm', {
            type: 'button', title: 'Slow or unsure — repeat in 2 days',
            onclick: () => { markRevisionDone(r.topicId, r.offset, 'shaky'); announce('Marked shaky'); }
          }, ['Shaky']),
          el('button.btn.btn--sm.rev-grade__failed', {
            type: 'button', title: 'Could not do it — drop back two rungs',
            onclick: () => { markRevisionDone(r.topicId, r.offset, 'failed'); announce('Marked failed'); }
          }, ['Failed'])
        ])
      ])))
    ])
  ]);
}

function examDay(day) {
  return el('div.view', {}, [
    el('section.big-note', {}, [
      el('div.eyebrow', { text: `Day ${day.day} · ${formatLong(day.date)}` }),
      el('div.big-note__title', { text: day.headline }),
      el('p.big-note__body', { text: day.detail })
    ])
  ]);
}

export function todayView() {
  const state = getState();
  const dayNumber = viewedDay ?? currentDayNumber();
  const day = DAY_BY_NUMBER[dayNumber];
  if (!day) return el('div.placeholder', {}, ['That day is outside the plan.']);

  if (day.type === 'exam') return examDay(day);

  const saved = state.days[dayNumber] || {};
  const prog = dayProgress(state, dayNumber);
  const firstIncomplete = day.blocks.find(b => !saved.blocks?.[b.id]);
  const prelims = countdowns(state).find(c => c.id === 'prelims');
  const s = streak(state);

  const subjectChips = day.blocks
    .filter(b => b.topicId && TOPIC_BY_ID[b.topicId])
    .map(b => el(`span.chip.chip--${b.subject}`, { text: TOPIC_BY_ID[b.topicId].name }));

  const head = el('section.day-head', {}, [
    el('div.day-head__top', {}, [
      el('div.day-title', {}, [
        el('span.day-number', { text: `Day ${day.day}` }),
        el('span.day-date', { text: formatLong(day.date) })
      ]),
      el('div.chip-row', {}, [
        el('span.chip.chip--accent', { text: `${day.phaseId} · ${day.phaseName}` }),
        el('span.chip', { text: `Week ${day.week}` })
      ])
    ]),
    day.weekTheme ? el('div.muted', { style: 'font-size:var(--step--1);font-weight:600', text: day.weekTheme }) : null,
    el('div.progress-line', {}, [
      dots(prog.done, prog.total),
      el('span.progress-count', { text: `${prog.done} of ${prog.total} blocks` }),
      // 240 minutes of STUDY is about 4h25 of clock. Say so, or breaks get taken
      // out of study time and the plan quietly under-delivers.
      day.blocks.length
        ? el('span.muted', { style: 'font-size:var(--step--2)',
            title: '240 minutes of study plus about 25 minutes of breaks',
            text: '· 4h 25m with breaks' })
        : null,
      el('span.chip.chip--good.day-complete-chip', { text: 'Day complete', hidden: !prog.complete }),
      s > 0 ? el('span.chip', {}, [icon('flame'), ` ${s} day streak`]) : null,
      prelims
        ? el(`span.chip${prelims.assumed ? '' : '.chip--accent'}`, {
            title: prelims.assumed
              ? 'The notification says only "October, 2026". This is the plan\'s assumed date — set the real one in Settings when your call letter arrives.'
              : 'Your confirmed exam date'
          }, [icon('clock'), ` ${prelims.daysLeft} days to Prelims${prelims.assumed ? '*' : ''}`])
        : null
    ])
  ]);

  const banners = [];
  if (day.milestone) {
    banners.push(el('div.banner.banner--warn', {}, [icon('alert', 'banner__icon'), el('div', {}, [
      el('strong', { text: 'Milestone: ' }), day.milestone
    ])]));
  }
  if (day.headline && day.type !== 'study') {
    banners.push(el('div.banner.banner--accent', {}, [icon('trophy', 'banner__icon'), el('div', {}, [
      el('strong', { text: day.headline }),
      day.detail ? el('div', { style: 'margin-top:2px;font-weight:500', text: day.detail }) : null
    ])]));
  }
  if (prog.complete) {
    banners.push(el('div.banner.banner--good', {}, [icon('check', 'banner__icon'),
      el('div', {}, [el('strong', { text: `Day ${day.day} complete. ` }),
        'All blocks done — that is what counts. No partial credit, no self-deception.'])]));
  }

  // Warm the mastery files for today's subjects so the sheet opens instantly.
  for (const b of day.blocks) if (b.subject) prefetchSubject(b.subject);

  const future = isFutureDay(dayNumber);
  if (future) {
    banners.push(el('div.banner.banner--accent', {}, [icon('clock', 'banner__icon'), el('div', {}, [
      el('strong', { text: 'This day has not happened yet. ' }),
      'You can read ahead, but blocks can only be ticked on the day itself — a plan you can tick in an afternoon tracks nothing.'
    ])]));
  }

  if (day.lighter) {
    banners.push(el('div.banner.banner--good', {}, [icon('check', 'banner__icon'), el('div', {}, [
      el('strong', { text: 'Scheduled lighter day. ' }),
      'If you are running on empty, do the first four blocks and stop. That is not falling ' +
      'behind — it is the plan. One planned half-day a fortnight is how you avoid the ' +
      'unplanned collapse that desynchronises everything.'
    ])]));
  }

  const cardEls = new Map();
  const cards = day.blocks.map(b => {
    const card = blockCard(b, {
      done: !!saved.blocks?.[b.id],
      isNext: !future && firstIncomplete?.id === b.id,
      locked: future,
      onToggle: id => {
        toggleBlock(dayNumber, id);
        patchDay(dayNumber);
        const nowDone = Boolean(getState().days[dayNumber]?.blocks?.[id]);
        announce(nowDone ? `${b.label} marked complete` : `${b.label} marked incomplete`);
      }
    });
    cardEls.set(b.id, card);
    return card;
  });

  const footer = el('section.card', {}, [
    el('div.card__body', {}, [
      el('div.field', {}, [
        el('label', { for: 'qs-solved', text: 'Questions solved today' }),
        el('div.inline-field', {}, [
          el('input#qs-solved.input', {
            type: 'number', min: '0', inputmode: 'numeric',
            value: saved.questionsSolved || '',
            placeholder: '0',
            onchange: e => setQuestionsSolved(dayNumber, e.target.value)
          }),
          el('span.muted', { style: 'font-size:var(--step--1)',
            text: 'Target across the 45 days: 3,000+' })
        ])
      ])
    ])
  ]);

  const nav = el('div', { style: 'display:flex;gap:var(--sp-2);justify-content:space-between' }, [
    el('button.btn.btn--sm', {
      type: 'button', disabled: dayNumber <= 1,
      onclick: () => { location.hash = `#/today/${dayNumber - 1}`; }
    }, ['← Previous day']),
    viewedDay !== null && viewedDay !== currentDayNumber()
      ? el('button.btn.btn--sm', { type: 'button', onclick: () => { location.hash = '#/today'; } }, ['Jump to today'])
      : null,
    el('button.btn.btn--sm', {
      type: 'button', disabled: dayNumber >= 147,
      onclick: () => { location.hash = `#/today/${dayNumber + 1}`; }
    }, ['Next day →'])
  ]);

  const dotsBox = head.querySelector('.dots');
  const progressLine = head.querySelector('.progress-line');
  refs = { dayNumber, cardEls, dotsBox, progressLine, blocks: day.blocks };

  return el('div.view', {}, [
    head,
    ...banners,
    revisionQueue(state, day),
    el('div.block-list', {}, cards),
    footer,
    nav
  ]);
}

/** Update only what a block tap changes. No rebuild, no animation replay. */
function patchDay(dayNumber) {
  if (!refs || refs.dayNumber !== dayNumber) return;
  const state = getState();
  const saved = state.days[dayNumber] || {};
  const prog = dayProgress(state, dayNumber);
  const firstIncomplete = refs.blocks.find(b => !saved.blocks?.[b.id]);

  for (const b of refs.blocks) {
    const card = refs.cardEls.get(b.id);
    if (!card) continue;
    const done = Boolean(saved.blocks?.[b.id]);
    card.classList.toggle('is-done', done);
    card.classList.toggle('is-next', !done && firstIncomplete?.id === b.id);

    const btn = card.querySelector('button[aria-pressed]');
    if (btn) {
      btn.setAttribute('aria-pressed', done ? 'true' : 'false');
      btn.classList.toggle('btn--done', done);
      btn.classList.toggle('btn--primary', !done);
      const label = btn.querySelector('span.btn-label');
      if (label) label.textContent = done ? 'Completed' : 'Mark complete';
    }
  }

  if (refs.dotsBox) {
    [...refs.dotsBox.children].forEach((d, i) => d.classList.toggle('is-done', i < prog.done));
  }
  const count = refs.progressLine?.querySelector('.progress-count');
  if (count) count.textContent = `${prog.done} of ${prog.total} blocks`;

  const chip = refs.progressLine?.querySelector('.day-complete-chip');
  if (chip) chip.hidden = !prog.complete;
}
