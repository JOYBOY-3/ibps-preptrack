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
import { toggleBlock, setQuestionsSolved, markRevisionDone } from '../state/actions.js';
import {
  currentDayNumber, dayProgress, dueRevisions, streak, countdowns
} from '../state/selectors.js';
import { formatLong, relative } from '../utils/dates.js';

let viewedDay = null;

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
        el('span.muted', { style: 'font-size:var(--step--1)', text: 'Spaced repetition — N+1 · N+7 · N+21' })
      ]),
      el('div.revision-list', {}, due.map(r => el('div.revision-item', {}, [
        el('div', {}, [
          el('div.revision-item__name', { text: r.topic?.name || r.topicId }),
          el('div.muted', { text: `Scheduled N+${r.offset} · due ${relative(r.due)}` })
        ]),
        el('button.btn.btn--sm', {
          type: 'button',
          onclick: () => { markRevisionDone(r.topicId, r.offset); announce('Revision marked done'); }
        }, ['Done'])
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
  const prelims = countdowns().find(c => c.id === 'prelims');
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
      el('span', { text: `${prog.done} of ${prog.total} blocks` }),
      prog.complete ? el('span.chip.chip--good', { text: 'Day complete' }) : null,
      s > 0 ? el('span.chip', {}, [icon('flame'), ` ${s} day streak`]) : null,
      prelims ? el('span.chip', {}, [icon('clock'), ` ${prelims.daysLeft} days to Prelims`]) : null
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

  const cards = day.blocks.map(b => blockCard(b, {
    done: !!saved.blocks?.[b.id],
    isNext: firstIncomplete?.id === b.id,
    onToggle: id => {
      toggleBlock(dayNumber, id);
      const nowDone = !saved.blocks?.[id];
      announce(nowDone ? `${b.label} marked complete` : `${b.label} marked incomplete`);
    }
  }));

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

  return el('div.view', {}, [
    head,
    ...banners,
    revisionQueue(state, day),
    el('div.block-list', {}, cards),
    footer,
    nav
  ]);
}
