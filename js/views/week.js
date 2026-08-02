/**
 * Week view — the 7-day table.
 *
 * A 5-column table is unusable at 375px, so this is a real table only from 900px
 * up; below that the same data renders as stacked day cards. Same information,
 * two shapes, no horizontal scrolling on a phone.
 */

import { el } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { CURRICULUM, DAY_BY_NUMBER } from '../data/curriculum.js';
import { TOPIC_BY_ID, SUBJECT_META } from '../data/topics.js';
import { getState } from '../state/store.js';
import { dayProgress, currentDayNumber } from '../state/selectors.js';

const SUBJECTS = ['reasoning', 'quant', 'english', 'ga'];
const SLOT = { reasoning: 'reas', quant: 'quant', english: 'eng', ga: 'ga' };

const TYPE_CHIP = {
  review: ['chip--warn', 'Review'],
  mock:   ['chip--accent', 'Mock'],
  exam:   ['chip--danger', 'Exam'],
  audit:  ['chip--warn', 'Audit'],
  taper:  ['chip--good', 'Taper']
};

function topicFor(day, subject) {
  const block = day.blocks.find(b => b.id === SLOT[subject]);
  return block?.topicId ? TOPIC_BY_ID[block.topicId] : null;
}

function weekOf(n) {
  const start = (n - 1) * 7 + 1;
  return CURRICULUM.filter(d => d.day >= start && d.day < start + 7);
}

function dayCell(day, subject) {
  const topic = topicFor(day, subject);
  if (!topic) {
    return el('td.wk-cell', {}, [el('span.wk-empty', { text: '—' })]);
  }
  return el('td.wk-cell', {}, [
    el('a.wk-topic', { href: `#/today/${day.day}`, style: `--key:var(--${subject})` }, [
      el('span.wk-topic__name', { text: topic.name }),
      topic.tier === 1 ? el('span.wk-tier', { text: 'T1' }) : null
    ])
  ]);
}

/** Phone layout: one card per day. */
function dayCard(day, state, today) {
  const prog = dayProgress(state, day.day);
  const chip = TYPE_CHIP[day.type];

  const rows = SUBJECTS.map(s => {
    const topic = topicFor(day, s);
    if (!topic) return null;
    return el('div.wk-row', { style: `--key:var(--${s})` }, [
      el('span.wk-row__key', { text: SUBJECT_META[s].short }),
      el('span.wk-row__name', { text: topic.name })
    ]);
  }).filter(Boolean);

  return el(`a.wk-card${day.day === today ? '.is-today' : ''}${prog.complete ? '.is-done' : ''}`, {
    href: `#/today/${day.day}`
  }, [
    el('div.wk-card__head', {}, [
      el('div', {}, [
        el('span.wk-card__day', { text: `Day ${day.day}` }),
        el('span.wk-card__date', { text: ` · ${day.weekday} ${day.dateLabel}` })
      ]),
      prog.total === 0
        ? (chip ? el(`span.chip.${chip[0]}`, { text: chip[1] }) : null)
        : el(`span.chip${prog.complete ? '.chip--good' : ''}`, { text: `${prog.done}/${prog.total}` })
    ]),
    rows.length
      ? el('div.wk-card__rows', {}, rows)
      : el('div.wk-card__note', { text: day.headline || '—' })
  ]);
}

export function weekView(weekNumber) {
  const state = getState();
  const today = currentDayNumber();
  const totalWeeks = Math.ceil(CURRICULUM.length / 7);
  const n = Math.min(totalWeeks, Math.max(1, weekNumber || Math.ceil(today / 7)));
  const days = weekOf(n);
  if (!days.length) return el('div.placeholder', {}, ['That week is outside the plan.']);

  const first = days[0];
  const last = days[days.length - 1];
  const doneCount = days.filter(d => d.blocks.length && dayProgress(state, d.day).complete).length;
  const studyCount = days.filter(d => d.blocks.length).length;

  const header = el('section.card', {}, [
    el('div.card__body', {}, [
      el('div.section-head', {}, [
        el('div', {}, [
          el('h1', { text: `Week ${n}` }),
          el('p.muted', { style: 'font-size:var(--step--1);margin-top:2px',
            text: `${first.dateLabel} – ${last.dateLabel} · ${first.phaseName}${first.weekTheme ? ' · ' + first.weekTheme : ''}` })
        ]),
        studyCount
          ? el(`span.chip${doneCount === studyCount ? '.chip--good' : ''}`,
              { text: `${doneCount} / ${studyCount} days complete` })
          : null
      ])
    ])
  ]);

  // ---- desktop table
  const table = el('div.wk-tablewrap.scroll-x', {}, [
    el('table.wk-table', {}, [
      el('thead', {}, [
        el('tr', {}, [
          el('th.wk-th-day', { text: 'Day' }),
          ...SUBJECTS.map(s => el('th', { style: `--key:var(--${s})` },
            [el('span.wk-th', { text: SUBJECT_META[s].label })])),
          el('th.wk-th-prog', { text: 'Done' })
        ])
      ]),
      el('tbody', {}, days.map(day => {
        const prog = dayProgress(state, day.day);
        const chip = TYPE_CHIP[day.type];
        const isToday = day.day === today;

        if (!day.blocks.length || day.type === 'exam') {
          return el(`tr.wk-tr${isToday ? '.is-today' : ''}`, {}, [
            el('th.wk-daycell', { scope: 'row' }, [
              el('a.wk-daylink', { href: `#/today/${day.day}` }, [
                el('span.day-number', { text: String(day.day) }),
                el('span.wk-daydate', { text: `${day.weekday} ${day.dateLabel}` })
              ])
            ]),
            el('td.wk-span', { colspan: '5' }, [
              chip ? el(`span.chip.${chip[0]}`, { text: chip[1] }) : null,
              el('span', { style: 'margin-left:8px', text: day.headline || '' })
            ])
          ]);
        }

        return el(`tr.wk-tr${isToday ? '.is-today' : ''}${prog.complete ? '.is-done' : ''}`, {}, [
          el('th.wk-daycell', { scope: 'row' }, [
            el('a.wk-daylink', { href: `#/today/${day.day}` }, [
              el('span.day-number', { text: String(day.day) }),
              el('span.wk-daydate', { text: `${day.weekday} ${day.dateLabel}` }),
              chip ? el(`span.chip.${chip[0]}`, { text: chip[1] }) : null
            ])
          ]),
          ...SUBJECTS.map(s => dayCell(day, s)),
          el('td.wk-prog', {}, [
            el(`span.chip${prog.complete ? '.chip--good' : ''}`, { text: `${prog.done}/${prog.total}` })
          ])
        ]);
      }))
    ])
  ]);

  const cards = el('div.wk-cards', {}, days.map(d => dayCard(d, state, today)));

  const nav = el('div.wk-nav', {}, [
    el('button.btn.btn--sm', {
      type: 'button', disabled: n <= 1,
      onclick: () => { location.hash = `#/week/${n - 1}`; }
    }, ['← Week ' + (n - 1)]),
    n !== Math.ceil(today / 7)
      ? el('button.btn.btn--sm', { type: 'button', onclick: () => { location.hash = '#/week'; } },
          ['This week'])
      : null,
    el('button.btn.btn--sm', {
      type: 'button', disabled: n >= totalWeeks,
      onclick: () => { location.hash = `#/week/${n + 1}`; }
    }, ['Week ' + (n + 1) + ' →'])
  ]);

  return el('div.view', {}, [header, table, cards, nav]);
}
