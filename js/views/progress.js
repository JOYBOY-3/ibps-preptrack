/**
 * Progress — headline numbers and phase completion.
 * Charts, topic mastery and bucket analysis land in M3/M4.
 */

import { el } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { scoreChart, bucketChart } from '../components/chart.js';
import { CURRICULUM } from '../data/curriculum.js';
import { PHASES } from '../data/phases.js';
import { getState } from '../state/store.js';
import {
  completedDayCount, studyDayCount, totalQuestions, streak, missedDays,
  countdowns, dayProgress, currentDayNumber, largestBucket, bucketCounts
} from '../state/selectors.js';

function stat(value, label, mod = '') {
  return el(`div.stat${mod}`, {}, [
    el('span.stat-value', { text: String(value) }),
    el('span.stat-label', { text: label })
  ]);
}

function bar(pct) {
  return el('div', {
    style: 'height:7px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin-top:var(--sp-2)'
  }, [
    el('div', {
      style: `height:100%;width:${Math.round(pct * 100)}%;background:var(--accent);border-radius:999px;transition:width .3s ease`
    })
  ]);
}

export function progressView() {
  const state = getState();
  const done = completedDayCount(state);
  const totalStudy = studyDayCount();
  const today = currentDayNumber();
  const counts = bucketCounts(state);
  const worst = largestBucket(state);

  const phaseRows = PHASES.filter(p => p.blocks.length > 0).map(p => {
    const days = CURRICULUM.filter(d => d.phaseId === p.id && d.blocks.length > 0);
    const n = days.filter(d => dayProgress(state, d.day).complete).length;
    return el('div', { style: 'padding:var(--sp-3) 0;border-bottom:1px solid var(--rule)' }, [
      el('div', { style: 'display:flex;justify-content:space-between;gap:var(--sp-3);font-size:var(--step--1)' }, [
        el('span', { style: 'font-weight:650', text: `${p.id} · ${p.name}` }),
        el('span.muted', { text: `${n} / ${days.length} days` })
      ]),
      bar(days.length ? n / days.length : 0)
    ]);
  });

  return el('div.view', {}, [
    el('div.section-head', {}, [el('h1', { text: 'Progress' })]),

    el('div.stat-grid', {}, [
      stat(done, `of ${totalStudy} days complete`, '.stat--accent'),
      stat(`${totalStudy ? Math.round((done / totalStudy) * 100) : 0}%`, 'plan complete', '.stat--accent'),
      stat(streak(state), 'day streak', '.stat--good'),
      stat(totalQuestions(state), 'questions solved')
    ]),

    el('div.stat-grid', {}, [
      ...countdowns().map(c => stat(c.daysLeft, `days to ${c.label.toLowerCase()}`,
        c.id === 'application' || c.id === 'prelims' ? '.stat--warn' : ''))
    ]),

    missedDays(state) > 0
      ? el('div.banner.banner--warn', {}, [icon('alert', 'banner__icon'), el('div', {}, [
          el('strong', { text: `${missedDays(state)} missed days. ` }),
          'Do not try to catch up by doubling. Stay on the calendar date — debt-chasing is how plans collapse.'
        ])])
      : null,

    worst
      ? el('div.banner.banner--accent', {}, [icon('alert', 'banner__icon'), el('div', {}, [
          el('strong', { text: `Largest error bucket: ${worst} (${counts[worst]}). ` }),
          'That is the only thing you work on this week. One change, not five.'
        ])])
      : null,

    el('section.card', {}, [
      el('div.card__body', {}, [
        el('span.eyebrow', { text: 'Phase completion' }),
        el('div', { style: 'margin-top:var(--sp-2)' }, phaseRows)
      ])
    ]),

    el('section.card', {}, [
      el('div.card__body', {}, [
        el('span.eyebrow', { text: 'Prelims mocks · out of 100' }),
        el('div', { style: 'margin-top:var(--sp-3)' }, [scoreChart(state.mocks, { stage: 'prelims' })]),
        el('span.eyebrow', { style: 'display:block;margin-top:var(--sp-5)', text: 'Mains mocks · out of 200' }),
        el('div', { style: 'margin-top:var(--sp-3)' }, [scoreChart(state.mocks, { stage: 'mains' })])
      ])
    ]),

    el('section.card', {}, [
      el('div.card__body', {}, [
        el('span.eyebrow', { text: 'Where your marks leak' }),
        el('div', { style: 'margin-top:var(--sp-3)' }, [bucketChart(counts)]),
        el('p.ios-section__note', { style: 'margin-top:var(--sp-3);padding:0',
          text: 'Fix only the largest bucket each week. Chasing all four at once fixes none of them.' })
      ])
    ])
  ]);
}
