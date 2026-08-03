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
    body.replaceChildren(el('div.ms-empty', {}, [
      el('p', { text: 'Detailed guidance for this topic is not available yet.' }),
      el('p.muted', { text: 'The daily plan still applies — use the block note above and your core book.' })
    ]));
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
    m.needsReview
      ? el('div.banner.banner--warn', {}, [icon('alert', 'banner__icon'), el('div', {}, [
          el('strong', { text: 'Under review. ' }),
          'A reviewer flagged parts of this topic as inaccurate. Treat the method as a ' +
          'starting point and verify against your book until this is corrected.'
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
