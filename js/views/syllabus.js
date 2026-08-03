/**
 * Syllabus — the coverage screen.
 *
 * Separate from the daily flow on purpose. Today answers "what do I do now";
 * this answers "am I actually covering the syllabus", which is a question you ask
 * weekly, not hourly. Opened from the header, not the bottom bar.
 *
 * Two things are kept visibly apart, because conflating them is how the coaching
 * industry sells inference as fact:
 *
 *   · the exam STRUCTURE, quoted from the CRP CSA-XVI notification (official.js)
 *   · the topic list, reverse-engineered from 8 years of memory-based analyses,
 *     because IBPS has never published a topic-level syllabus
 *
 * The topic list is TOPICS itself — not a copy. A second list would be the
 * "147 days" drift bug again, in a place that matters more.
 */

import { el, announce } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { getState } from '../state/store.js';
import { setTopicUnderstood } from '../state/actions.js';
import { topicAccuracy } from '../state/selectors.js';
import { TOPICS, TOPIC_BY_ID, SUBJECT_META, TIER_LABEL } from '../data/topics.js';
import { PRELIMS, MAINS, NEGATIVE_MARK, MEDIUM_NOTE } from '../data/official.js';
import * as W from '../data/weightage.js';
import { guideFor } from '../data/paperGuide.js';
import { getMasterySync, prefetchSubject, isLoaded } from '../data/mastery.js';
import { openMasterySheet } from '../components/masterySheet.js';

/** Scheduled activities, not teachable topics — they have no place in a syllabus. */
const SESSION = /-rev$|sectional|audit|errorbook|marathon|^e-mixed$/;

/** Which app subject feeds which paper section. */
const SECTION_SUBJECT = {
  eng: 'english', num: 'quant', reas: 'reasoning', ga: 'ga'
};

let paper = 'prelims';
const openSections = new Set(['reas']);

/* ------------------------------------------------------------------ helpers */

function topicsForSection(sectionId) {
  const subject = SECTION_SUBJECT[sectionId];
  const rows = W.rowsFor(paper, sectionId);
  // Order by the analysis: heaviest row first, and within a row keep tier order.
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const ts = row.topicIds
      .map(id => TOPIC_BY_ID[id])
      .filter(t => t && !SESSION.test(t.id) && !seen.has(t.id));
    ts.forEach(t => seen.add(t.id));
    if (ts.length) out.push({ row, topics: ts.sort((a, b) => a.tier - b.tier) });
  }
  // Anything in the subject that no analysis row claimed — should be none, but
  // showing it beats hiding it.
  const orphans = TOPICS.filter(t =>
    t.subject === subject && !SESSION.test(t.id) && !seen.has(t.id));
  if (orphans.length) out.push({ row: { topic: 'Other', avg: null, trend: 'volatile', years: null, topicIds: [] }, topics: orphans });
  return out;
}

function sectionProgress(state, sectionId) {
  const groups = topicsForSection(sectionId);
  const all = groups.flatMap(g => g.topics);
  const done = all.filter(t => state.topics[t.id]?.understood).length;
  return { done, total: all.length, pct: all.length ? done / all.length : 0 };
}

/* -------------------------------------------------------------------- rows */

function topicRow(topic, state) {
  const rec = state.topics[topic.id] || {};
  const acc = topicAccuracy(state, topic.id);
  const attempted = (rec.untimed || 0) + (rec.timed || 0);
  const m = getMasterySync(topic.subject, topic.id);

  const box = el('button.syl-tick', {
    type: 'button',
    role: 'checkbox',
    'aria-checked': rec.understood ? 'true' : 'false',
    'aria-label': `${topic.name} — I understand this and can solve it`,
    onclick: e => {
      const now = !(getState().topics[topic.id]?.understood);
      setTopicUnderstood(topic.id, now);
      e.currentTarget.setAttribute('aria-checked', now ? 'true' : 'false');
      row.classList.toggle('is-understood', now);
      e.currentTarget.focus({ preventScroll: true });
      announce(now ? `${topic.name} marked understood` : `${topic.name} unmarked`);
      refreshHeads();
    }
  }, [icon('check', 'syl-tick__mark')]);

  // Question patterns come from the mastery file, which loads per subject on
  // expand. Until it arrives the row still works; the patterns just are not there.
  const patterns = m?.questionPatterns?.length
    ? el('details.syl-pat', {}, [
        el('summary', { text: `How it is asked · ${m.questionPatterns.length}` }),
        el('ul.g-list', {}, m.questionPatterns.map(x => el('li', { text: x })))
      ])
    : null;

  const row = el(`div.syl-row${rec.understood ? '.is-understood' : ''}`, {}, [
    box,
    el('div.syl-row__main', {}, [
      el('div.syl-row__head', {}, [
        el('button.syl-row__name', {
          type: 'button',
          title: 'Open the full method for this topic',
          onclick: () => openMasterySheet(topic.subject, topic.id, topic.name)
        }, [topic.name]),
        topic.tier <= 2
          ? el(`span.chip${topic.tier === 1 ? '.chip--accent' : ''}`, { text: `T${topic.tier}`, title: TIER_LABEL[topic.tier] })
          : null
      ]),
      el('div.syl-row__meta', {
        text: attempted
          ? `${Math.round((acc ?? 0) * 100)}% over ${attempted} logged`
          : (m?.timeTarget ? String(m.timeTarget).split(/[.;]/)[0] : 'not practised yet')
      }),
      patterns
    ])
  ]);
  return row;
}

/* ---------------------------------------------------------------- weightage */

function weightageTable(sectionId) {
  const rows = W.rowsFor(paper, sectionId);
  const years = paper === 'mains' ? W.MAINS_YEARS : W.PRELIMS_YEARS;
  const withYears = rows.filter(r => r.years);

  if (!withYears.length) {
    return el('p.g-p', { text: W.GA_NOTE });
  }

  return el('div', {}, [
    el('div.g-tablewrap', {}, [
      el('table.g-table', {}, [
        el('thead', {}, [el('tr', {}, [
          el('th', { text: 'Topic' }),
          ...years.map(y => el('th', { text: String(y).slice(2) })),
          el('th', { text: 'avg' })
        ])]),
        el('tbody', {}, withYears.map(r => el('tr', {}, [
          el('th', { scope: 'row', text: r.topic }),
          ...r.years.map(v => el('td', { text: v })),
          el('td.syl-avg', { text: r.avg == null ? '—' : String(r.avg) })
        ])))
      ])
    ]),
    paper === 'mains' ? el('p.ios-note', { text: W.MAINS_NOTE }) : null
  ]);
}

/* ------------------------------------------------------------------ section */

const heads = new Map();

function refreshHeads() {
  const state = getState();
  for (const [id, node] of heads) {
    const p = sectionProgress(state, id);
    node.count.textContent = `${p.done} / ${p.total} understood`;
    node.bar.style.setProperty('--pct', `${Math.round(p.pct * 100)}%`);
    node.node.classList.toggle('is-complete', p.total > 0 && p.done === p.total);
  }
}

function sectionCard(section, state) {
  const meta = SUBJECT_META[SECTION_SUBJECT[section.id]];
  const groups = topicsForSection(section.id);
  const prog = sectionProgress(state, section.id);
  const guide = guideFor(paper, section.id);

  const count = el('span.syl-head__count', { text: `${prog.done} / ${prog.total} understood` });
  const bar = el('span.syl-head__bar', { style: `--pct:${Math.round(prog.pct * 100)}%` });

  const body = el('div.g-body', {}, [
    guide ? el('details.ios-adv', {}, [
      el('summary', {}, [el('span', { text: 'How to attack this paper' }), icon('tool')]),
      el('div.ios-advbody', {}, [
        el('p.g-p', { text: guide.whatItTests }),
        el('h4.g-h3', { text: 'Order of attack' }),
        el('ol.g-steps', {}, guide.howToAttack.map(x => el('li', { text: x }))),
        el('div.syl-targets', {}, [
          el('span.tchip', { text: `attempt ${guide.attemptTarget.min}–${guide.attemptTarget.max} of ${section.questions}` }),
          el('span.tchip', { text: `accuracy ${guide.accuracyTarget}` }),
          el('span.tchip', { text: `${section.minutes} min` })
        ]),
        el('h4.g-h3', { text: 'Time strategy' }),
        el('p.g-p', { text: guide.timeStrategy }),
        el('div.banner.banner--warn', {}, [icon('alert', 'banner__icon'),
          el('div', {}, [el('strong', { text: 'The one trap. ' }), guide.theOneTrap])])
      ])
    ]) : null,

    el('details.ios-adv', {}, [
      el('summary', {}, [
        el('span', { text: paper === 'mains' ? '6-year weightage' : '8-year weightage' }),
        icon('progress')
      ]),
      el('div.ios-advbody', {}, [weightageTable(section.id)])
    ]),

    ...groups.map(g => el('div.syl-group', {}, [
      el('div.syl-group__head', {}, [
        el('span.syl-group__name', { text: g.row.topic }),
        g.row.avg != null ? el('span.syl-group__avg', { text: `~${g.row.avg} Q` }) : null,
        trendChip(g.row.trend)
      ]),
      g.row.note ? el('p.syl-group__note', { text: g.row.note }) : null,
      el('div.syl-rows', {}, g.topics.map(t => topicRow(t, state)))
    ]))
  ].filter(Boolean));

  const node = el(`details.g-sec.syl-sec${prog.total && prog.done === prog.total ? '.is-complete' : ''}`, {
    open: openSections.has(section.id) ? true : null,
    ontoggle: e => {
      if (e.target.open) {
        openSections.add(section.id);
        // 1.58 MB across five files — never eager-load. Fetch this subject only
        // when its section is actually opened, then re-render the rows in place.
        const subject = SECTION_SUBJECT[section.id];
        if (!isLoaded(subject)) {
          prefetchSubject(subject);
          setTimeout(() => { if (isLoaded(subject)) rerenderRows(section.id, body); }, 600);
        }
      } else openSections.delete(section.id);
    }
  }, [
    el('summary.g-sum', {}, [
      el('div.g-sum__text', {}, [
        el('span.g-sum__title', {}, [
          el(`span.chip.chip--${SECTION_SUBJECT[section.id]}`, { text: meta.short }),
          ' ' + section.name
        ]),
        el('span.g-sum__sub', {}, [count, bar])
      ])
    ]),
    body
  ]);

  heads.set(section.id, { node, count, bar });
  return node;
}

/** Patterns arrive after the subject file loads; swap the rows without a rebuild. */
function rerenderRows(sectionId, body) {
  const state = getState();
  const groups = topicsForSection(sectionId);
  const holders = body.querySelectorAll('.syl-rows');
  holders.forEach((holder, i) => {
    if (!groups[i]) return;
    holder.replaceChildren(...groups[i].topics.map(t => topicRow(t, state)));
  });
}

function trendChip(trend) {
  const t = W.TREND[trend];
  if (!t || !t.mark) return null;
  return el(`span.syl-trend${t.tone ? '.syl-trend--' + t.tone : ''}`, { title: t.label },
    [t.mark + ' ' + t.label]);
}

/* --------------------------------------------------------------------- view */

export function syllabusView() {
  const state = getState();
  heads.clear();
  const spec = paper === 'mains' ? MAINS : PRELIMS;

  const seg = el('div.seg', { role: 'group', 'aria-label': 'Paper' },
    ['prelims', 'mains'].map(p => el('button', {
      type: 'button',
      'aria-pressed': paper === p ? 'true' : 'false',
      text: p === 'prelims' ? 'Prelims' : 'Mains',
      onclick: () => { paper = p; location.hash = '#/syllabus'; window.dispatchEvent(new HashChangeEvent('hashchange')); }
    })));

  const total = spec.sections.reduce((a, s) => {
    const p = sectionProgress(state, s.id);
    return { done: a.done + p.done, all: a.all + p.total };
  }, { done: 0, all: 0 });

  return el('div.view.syl-view', {}, [
    el('div.section-head', {}, [
      el('div', {}, [
        el('h1', { text: 'Syllabus' }),
        el('p.muted', { style: 'font-size:var(--step--1);margin-top:2px',
          text: `${total.done} of ${total.all} topics marked understood` })
      ]),
      seg
    ]),

    // Quoted from the notification, laid out the way the notification lays it out.
    // Chips showed only paper totals and hid the per-section split, which is the
    // part that actually decides how you spend the 60 or 125 minutes.
    el('section.syl-official', {}, [
      el('span.eyebrow', {
        text: `From the official notification · clause D · ${paper === 'mains' ? 'Main' : 'Preliminary'} Examination (Objective Test)`
      }),
      structureTable(spec),
      el('p.syl-official__note', {
        text: paper === 'mains'
          ? 'Only the Mains score reaches the merit list. There is no interview.'
          : 'A gate, not a rank. Clearing it by one mark and by twenty are worth the same.'
      })
    ]),

    el('div.banner', {}, [icon('alert', 'banner__icon'), el('div', {}, [
      el('strong', { text: 'There is no official topic list. ' }),
      'IBPS has never published one, and has never released a question paper. Everything below ' +
      'is reverse-engineered from memory-based shift analyses — ' +
      (paper === 'mains' ? '2020–2025 for Mains' : '2018–2025 for Prelims') +
      '. The ranking has been stable for years; individual counts carry about ±2 questions of error.'
    ])]),

    ...spec.sections.map(s => sectionCard(s, state)),

    el('p.g-foot', { text:
      'Tick a topic when you understand the concept and can solve its questions. ' +
      'That is your judgement — the app records it and does not argue.' })
  ]);
}

/**
 * The exam structure.
 *
 * FOUR columns, not the notification's six. Sr. No. is a row number carrying no
 * information, and Medium is one character wide with a footnote explaining it —
 * both were costing horizontal space that Questions, Marks and Time needed on a
 * phone. What remains fits a 320px screen without scrolling at all, which beats
 * a faithful six-column reproduction you have to drag sideways to read.
 *
 * Every figure is read from official.js, and the Total row is COMPUTED from the
 * sections rather than stated, so the table cannot disagree with itself.
 */
function structureTable(spec) {
  const sum = key => spec.sections.reduce((a, s) => a + s[key], 0);

  return el('div', {}, [
    el('div.g-tablewrap', {}, [
      el('table.g-table.syl-st', {}, [
        el('thead', {}, [el('tr', {}, [
          el('th.syl-st__name', {}, [
            'Test',
            // The notification's own header says this, and it matters: the four
            // Mains sections can appear in ANY order on the day.
            spec.notBySequence ? el('span.syl-st__seq', { text: 'NOT BY SEQUENCE' }) : null
          ]),
          el('th.syl-st__n', { text: 'Qs' }),
          el('th.syl-st__n', { text: 'Marks' }),
          el('th.syl-st__time', { text: 'Time' })
        ])]),
        el('tbody', {}, spec.sections.map(s => el('tr', {}, [
          el('th.syl-st__name', { scope: 'row', text: s.name }),
          el('td.syl-st__n', { text: String(s.questions) }),
          el('td.syl-st__n', { text: String(s.marks) }),
          el('td.syl-st__time', { text: `${s.minutes} min` })
        ]))),
        el('tfoot', {}, [el('tr.syl-st__total', {}, [
          el('th.syl-st__name', { scope: 'row', text: 'Total' }),
          el('td.syl-st__n', { text: String(sum('questions')) }),
          el('td.syl-st__n', { text: String(sum('marks')) }),
          el('td.syl-st__time', { text: `${spec.totalMinutes} min` })
        ])])
      ])
    ]),
    el('p.syl-official__fine', { text: 'Each test is separately timed — you cannot carry unused minutes from one section into the next.' }),
    el('p.syl-official__fine', { text: MEDIUM_NOTE }),
    el('p.syl-official__fine', { text: `Penalty for wrong answers: ${NEGATIVE_MARK} of the marks assigned to that question is deducted. A blank answer carries no penalty.` }),
    spec.qualifyingNote ? el('p.syl-official__fine', { text: spec.qualifyingNote }) : null
  ]);
}
