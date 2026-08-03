/**
 * Mock log — the measurement loop.
 *
 * Taking mocks without analysing them is the most common way an aspirant plateaus
 * at 55. So this screen enforces Principle 3: a mock cannot be saved until at
 * least one error has been logged against it. The app will not let you pretend
 * a mock counted when you learned nothing from it.
 */

import { el, $, announce } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { getState } from '../state/store.js';
import { logMock, logError } from '../state/actions.js';
import { toast } from '../utils/ui.js';
import { todayISO } from '../utils/dates.js';
import { scoreChart } from '../components/chart.js';

const BUCKETS = ['Concept', 'Slow', 'Silly', 'Selection'];

const PRELIMS_SECTIONS = [
  { id: 'eng',  label: 'English',   q: 30 },
  { id: 'num',  label: 'Numerical', q: 35 },
  { id: 'reas', label: 'Reasoning', q: 35 }
];
const MAINS_SECTIONS = [
  { id: 'ga',   label: 'Gen/Fin Awareness', q: 40, marksPerQ: 1.25 },
  { id: 'eng',  label: 'English',           q: 40, marksPerQ: 1.0 },
  { id: 'reas', label: 'Reasoning',         q: 40, marksPerQ: 1.5 },
  { id: 'num',  label: 'Quantitative',      q: 40, marksPerQ: 1.25 }
];

/** IBPS deducts 0.25 for every wrong answer. Score is never just "correct". */
export function sectionScore(attempted, correct, marksPerQ = 1) {
  const a = Math.max(0, Number(attempted) || 0);
  const c = Math.min(a, Math.max(0, Number(correct) || 0));
  return (c * marksPerQ) - ((a - c) * 0.25);
}

function num(id, placeholder, max) {
  return el(`input#${id}.input.input--num`, {
    type: 'number', min: '0', max: String(max ?? 999), inputmode: 'numeric',
    placeholder, oninput: recalc
  });
}

let stage = 'prelims';
let pendingErrors = [];

function sections() { return stage === 'prelims' ? PRELIMS_SECTIONS : MAINS_SECTIONS; }

function recalc() {
  let total = 0, att = 0, corr = 0;
  for (const s of sections()) {
    const a = Number($(`#a-${s.id}`)?.value) || 0;
    const c = Number($(`#c-${s.id}`)?.value) || 0;
    const sc = sectionScore(a, c, s.marksPerQ ?? 1);
    const cell = $(`#s-${s.id}`);
    if (cell) cell.textContent = a ? sc.toFixed(2) : '—';
    total += a ? sc : 0; att += a; corr += Math.min(a, c);
  }
  const t = $('#mock-total'); if (t) t.textContent = total.toFixed(2);
  const acc = $('#mock-acc');
  if (acc) acc.textContent = att ? `${Math.round((corr / att) * 100)}%` : '—';
  const attEl = $('#mock-att'); if (attEl) attEl.textContent = String(att);
}

function errorRow(e, onRemove) {
  return el('div.mock-err', {}, [
    el(`span.chip${e.bucket === 'Selection' ? '.chip--danger' : ''}`, { text: e.bucket }),
    el('span.mock-err__text', { text: e.whatWentWrong || e.topic || 'error' }),
    el('button.icon-btn', { type: 'button', 'aria-label': 'Remove', onclick: onRemove }, [icon('close')])
  ]);
}

export function mocksView() {
  const state = getState();
  const mocks = [...state.mocks].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const errorList = el('div.mock-errs');
  const renderErrors = () => {
    errorList.replaceChildren(
      ...pendingErrors.map((e, i) => errorRow(e, () => {
        pendingErrors.splice(i, 1); renderErrors(); updateGate();
      })),
      pendingErrors.length === 0
        ? el('p.mock-gate', {}, [icon('alert'),
            el('span', { text: 'Log at least one error before saving. A mock you did not analyse taught you nothing.' })])
        : null
    );
  };

  const saveBtn = el('button.btn.btn--primary.btn--full', {
    type: 'button', disabled: true, onclick: save
  }, [icon('check'), 'Save mock']);

  function updateGate() {
    saveBtn.disabled = pendingErrors.length === 0;
  }

  // ---- add-error mini form
  const bucketSel = el('select#err-bucket.select', {},
    BUCKETS.map(b => el('option', { value: b, text: b })));
  const whatInput = el('input#err-what.input', {
    type: 'text', placeholder: 'e.g. chased a floor puzzle for 4 minutes'
  });

  const addError = () => {
    const what = whatInput.value.trim();
    if (!what) { toast('Describe what went wrong', 'danger'); whatInput.focus(); return; }
    pendingErrors.push({ bucket: bucketSel.value, whatWentWrong: what });
    whatInput.value = '';
    renderErrors(); updateGate();
    announce('Error added');
  };

  function save() {
    const secs = {};
    for (const s of sections()) {
      secs[s.id] = {
        att: Number($(`#a-${s.id}`).value) || 0,
        corr: Number($(`#c-${s.id}`).value) || 0
      };
    }
    const totalAtt = Object.values(secs).reduce((n, x) => n + x.att, 0);
    if (!totalAtt) { toast('Enter your attempts first', 'danger'); return; }

    const total = sections().reduce((n, s) =>
      n + sectionScore(secs[s.id].att, secs[s.id].corr, s.marksPerQ ?? 1), 0);
    const totalCorr = Object.values(secs).reduce((n, x) => n + Math.min(x.att, x.corr), 0);

    const counts = {};
    for (const e of pendingErrors) counts[e.bucket] = (counts[e.bucket] || 0) + 1;
    const largest = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    logMock({
      stage, sections: secs,
      total: Number(total.toFixed(2)),
      attempted: totalAtt,
      correct: totalCorr,
      accuracy: totalAtt ? Number((totalCorr / totalAtt).toFixed(3)) : 0,
      platform: $('#mock-platform')?.value || '',
      errorsLogged: pendingErrors.length,
      largestBucket: largest
    });
    for (const e of pendingErrors) logError({ ...e, source: 'mock' });

    pendingErrors = [];
    toast(`Mock saved — ${total.toFixed(2)} marks. Fix your ${largest} bucket this week.`);
    // The global re-render is gone by design, so this screen refreshes itself
    // after a save so the new mock appears in the history immediately.
    requestAnimationFrame(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
  }

  const stageSeg = el('div.seg', { role: 'group', 'aria-label': 'Stage' },
    ['prelims', 'mains'].map(s => el('button', {
      type: 'button', 'aria-pressed': stage === s ? 'true' : 'false',
      text: s === 'prelims' ? 'Prelims' : 'Mains',
      onclick: () => { stage = s; location.hash = '#/mocks'; }
    })));

  const grid = el('div.mock-grid', {}, [
    el('div.mock-grid__head', {}, [
      el('span', { text: 'Section' }), el('span', { text: 'Attempted' }),
      el('span', { text: 'Correct' }), el('span', { text: 'Score' })
    ]),
    ...sections().map(s => el('div.mock-grid__row', {}, [
      el('span.mock-grid__label', {}, [
        el('span', { text: s.label }),
        el('span.muted', { text: ` /${s.q}` })
      ]),
      num(`a-${s.id}`, '0', s.q),
      num(`c-${s.id}`, '0', s.q),
      el(`span#s-${s.id}.mock-grid__score`, { text: '—' })
    ]))
  ]);

  const totals = el('div.mock-totals', {}, [
    el('div.stat', {}, [el('span#mock-total.stat-value', { text: '0.00' }), el('span.stat-label', { text: 'total marks' })]),
    el('div.stat', {}, [el('span#mock-att.stat-value', { text: '0' }), el('span.stat-label', { text: 'attempted' })]),
    el('div.stat', {}, [el('span#mock-acc.stat-value', { text: '—' }), el('span.stat-label', { text: 'accuracy' })])
  ]);

  const history = mocks.length
    ? el('section.ios-section', {}, [
        el('h2.ios-section__title', { text: `History · ${mocks.length} mock${mocks.length > 1 ? 's' : ''}` }),
        scoreChart(mocks, { stage }),
        el('div.ios-group', {}, mocks.slice(0, 20).map(m => el('div.ios-row', {}, [
          el('div.ios-row__text', {}, [
            el('div.ios-row__label', {}, [
              el('span.mono', { text: String(m.total ?? 0) }),
              el('span.muted', { text: `  ${m.stage === 'mains' ? 'Mains' : 'Prelims'} · ${m.date}` })
            ]),
            el('div.ios-row__desc', {
              text: `${m.attempted} attempted · ${Math.round((m.accuracy || 0) * 100)}% accuracy` +
                    (m.largestBucket ? ` · biggest leak: ${m.largestBucket}` : '')
            })
          ]),
          m.largestBucket
            ? el(`span.chip${m.largestBucket === 'Selection' ? '.chip--danger' : ''}`, { text: m.largestBucket })
            : null
        ])))
      ])
    : null;

  renderErrors(); updateGate();
  requestAnimationFrame(recalc);

  return el('div.view', {}, [
    el('div.section-head', {}, [el('h1', { text: 'Mocks' }), stageSeg]),

    el('section.ios-section', {}, [
      el('h2.ios-section__title', { text: 'Log a mock' }),
      el('div.ios-group.ios-group--hero', {}, [
        grid,
        totals,
        el('div.field', { style: 'margin-top:var(--sp-4)' }, [
          el('label', { for: 'mock-platform', text: 'Platform (optional)' }),
          el('input#mock-platform.input', { type: 'text', placeholder: 'Testbook, Adda247, Oliveboard…' })
        ])
      ])
    ]),

    el('section.ios-section', {}, [
      el('h2.ios-section__title', { text: 'What went wrong' }),
      el('div.ios-group.ios-group--hero', {}, [
        el('p.ios-section__note', { style: 'padding:0 0 var(--sp-3)',
          text: 'Every wrong or skipped question falls into exactly one bucket. On Sunday, whichever bucket is largest is the ONLY thing you fix that week.' }),
        el('div.mock-addrow', {}, [
          bucketSel, whatInput,
          el('button.btn', { type: 'button', onclick: addError }, [icon('check'), 'Add'])
        ]),
        errorList
      ])
    ]),

    saveBtn,
    history
  ]);
}
