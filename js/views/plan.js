/**
 * Plan browser — all 145 days grouped Phase → Week.
 * Minimal in M1; the full week table lands in M2.
 */

import { el } from '../utils/dom.js';
import { PLAN_LABEL } from '../data/phases.js';
import { CURRICULUM } from '../data/curriculum.js';
import { PHASES } from '../data/phases.js';
import { TOPIC_BY_ID } from '../data/topics.js';
import { getState } from '../state/store.js';
import { dayProgress, currentDayNumber } from '../state/selectors.js';

const TYPE_CHIP = {
  review: ['chip--warn', 'Review'],
  mock:   ['chip--accent', 'Mock'],
  exam:   ['chip--danger', 'EXAM'],
  audit:  ['chip--warn', 'Audit'],
  taper:  ['chip--good', 'Taper']
};

function dayRow(day, state, today) {
  const prog = dayProgress(state, day.day);
  const topics = day.blocks
    .filter(b => b.topicId && TOPIC_BY_ID[b.topicId])
    .map(b => TOPIC_BY_ID[b.topicId].name);

  const summary = day.headline || topics.slice(0, 3).join(' · ') || '—';
  const chip = TYPE_CHIP[day.type];

  return el('a.revision-item', {
    href: `#/today/${day.day}`,
    style: `text-decoration:none;color:inherit;${day.day === today ? 'outline:2px solid var(--accent);' : ''}`
  }, [
    el('div', { style: 'min-width:0' }, [
      el('div.revision-item__name', {}, [
        `Day ${day.day} · ${day.dateLabel} `,
        chip ? el(`span.chip.${chip[0]}`, { text: chip[1] }) : null
      ]),
      el('div.muted', { style: 'overflow:hidden;text-overflow:ellipsis', text: summary })
    ]),
    prog.total === 0
      ? el('span.chip', { text: '—' })
      : el(`span.chip${prog.complete ? '.chip--good' : ''}`, { text: `${prog.done}/${prog.total}` })
  ]);
}

export function planView() {
  const state = getState();
  const today = currentDayNumber();

  const sections = PHASES.map(phase => {
    const days = CURRICULUM.filter(d => d.phaseId === phase.id);
    const studyDays = days.filter(d => d.blocks.length > 0);
    const doneCount = studyDays.filter(d => dayProgress(state, d.day).complete).length;
    const isCurrent = today >= phase.from && today <= phase.to;

    return el('details.card', { open: isCurrent }, [
      el('summary', { style: 'padding:var(--sp-4);cursor:pointer;font-weight:650' }, [
        `${phase.id} · ${phase.name} `,
        el('span.chip', { text: `Day ${phase.from}–${phase.to}` }),
        ' ',
        studyDays.length
          ? el(`span.chip${doneCount === studyDays.length ? '.chip--good' : ''}`,
              { text: `${doneCount}/${studyDays.length} days` })
          : null,
        el('div.muted', { style: 'font-weight:500;font-size:var(--step--1);margin-top:2px', text: phase.tagline })
      ]),
      el('div', { style: 'padding:0 var(--sp-4) var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-2)' },
        days.map(d => dayRow(d, state, today)))
    ]);
  });

  return el('div.view', {}, [
    el('div.section-head', {}, [
      el('h1', { text: 'Full plan' }),
      el('span.muted', { style: 'font-size:var(--step--1)', text: PLAN_LABEL })
    ]),
    ...sections
  ]);
}
