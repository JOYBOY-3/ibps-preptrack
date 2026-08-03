/** Hand-rolled inline SVG charts. No library — four charts do not justify 200 KB. */

import { el } from '../utils/dom.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) n.setAttribute(k, v);
  return n;
};

/** Score-over-time line with an emphasised endpoint. */
/**
 * Prelims is out of 100, Mains out of 200. Plotting both on one autoscaled axis
 * manufactures a fake +45 jump the day the exam changes, and simultaneously
 * squashes real Mains progress into a flat line. So: one stage per chart, and a
 * fixed domain per stage.
 */
export function scoreChart(mocks, { height = 150, stage = 'prelims' } = {}) {
  const data = [...mocks]
    .filter(m => (m.stage || 'prelims') === stage)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map(m => ({ v: Number(m.total) || 0, date: m.date }));

  if (data.length < 2) {
    return el('div.chart-empty', {
      text: data.length
        ? `One ${stage} mock logged. The trend appears from the second.`
        : `No ${stage} mocks logged yet.`
    });
  }

  const W = 320, H = height, PAD = { t: 12, r: 10, b: 20, l: 30 };
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const max = stage === 'mains' ? 200 : 100;   // the real paper total, not the observed range
  const min = 0;
  const span = max - min;

  const x = i => PAD.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = v => PAD.t + ih - ((v - min) / span) * ih;

  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img',
    'aria-label': `Mock scores from ${data[0].v} to ${data.at(-1).v}`
  });

  // gridlines
  for (let g = 0; g <= 3; g++) {
    const gy = PAD.t + (ih / 3) * g;
    svg.append(svgEl('line', { x1: PAD.l, x2: W - PAD.r, y1: gy, y2: gy, class: 'chart__grid' }));
    svg.append(Object.assign(svgEl('text', {
      x: PAD.l - 6, y: gy + 3, class: 'chart__tick', 'text-anchor': 'end'
    }), { textContent: Math.round(max - (span / 3) * g) }));
  }

  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${PAD.t + ih} L${x(0).toFixed(1)},${PAD.t + ih} Z`;

  svg.append(svgEl('path', { d: area, class: 'chart__area' }));
  svg.append(svgEl('path', { d: line, class: 'chart__line' }));

  data.forEach((d, i) => {
    const last = i === data.length - 1;
    svg.append(svgEl('circle', {
      cx: x(i), cy: y(d.v), r: last ? 4.5 : 2.5,
      class: last ? 'chart__dot chart__dot--last' : 'chart__dot'
    }));
  });

  const first = data[0].v, last = data.at(-1).v;
  const delta = last - first;

  return el('div.chart-wrap', {}, [
    svg,
    el('div.chart-legend', {}, [
      el('span.mono', { text: `${first.toFixed(1)} → ${last.toFixed(1)}` }),
      el(`span.chip${delta >= 0 ? '.chip--good' : '.chip--danger'}`, {
        text: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} over ${data.length} mocks`
      })
    ])
  ]);
}

/** Horizontal bars for the four error buckets. */
export function bucketChart(counts) {
  const entries = Object.entries(counts);
  const total = entries.reduce((n, [, v]) => n + v, 0);
  if (!total) return el('div.chart-empty', { text: 'No errors logged yet. Log them as you analyse mocks.' });

  const max = Math.max(...entries.map(([, v]) => v));
  const worst = entries.slice().sort((a, b) => b[1] - a[1])[0][0];

  return el('div.bars', {}, entries.map(([name, v]) => el('div.bar', {}, [
    el('span.bar__label', { text: name }),
    el('div.bar__track', {}, [
      el(`div.bar__fill${name === worst ? '.bar__fill--worst' : ''}`, {
        style: `width:${max ? (v / max) * 100 : 0}%`
      })
    ]),
    el('span.bar__value.mono', { text: String(v) })
  ])));
}
