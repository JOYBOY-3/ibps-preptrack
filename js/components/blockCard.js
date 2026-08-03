/** One study block: label, duration, topic, weightage, resources, complete button. */

import { el } from '../utils/dom.js';
import { icon } from './icons.js';
import { TOPIC_BY_ID, SUBJECT_META, TIER_LABEL } from '../data/topics.js';
import { RESOURCE_BY_ID } from '../data/resources.js';
import { openMasterySheet } from './masterySheet.js';

const RESOURCE_ICON = { book: 'book', video: 'video', website: 'globe', app: 'globe', tool: 'tool' };

function resourceRow(resourceId) {
  const r = RESOURCE_BY_ID[resourceId];
  if (!r) return null;

  const label = r.author ? `${r.title} — ${r.author}` : r.title;
  const titleNode = r.url
    ? el('a', { href: r.url, target: '_blank', rel: 'noopener noreferrer', text: label })
    : el('span.resource__title', { text: label });

  return el('div.resource', {}, [
    icon(RESOURCE_ICON[r.type] || 'globe', 'resource__icon'),
    el('div', {}, [titleNode, el('div.muted', { text: r.bestFor })])
  ]);
}

export function blockCard(block, { done, isNext, onToggle }) {
  const topic = block.topicId ? TOPIC_BY_ID[block.topicId] : null;
  const subject = block.subject;
  const meta = subject ? SUBJECT_META[subject] : null;
  const keyVar = subject ? `var(--${subject})` : 'var(--neutral-key)';

  const title = topic?.name || block.focus || block.label;

  // weightage chips — only shown when the topic actually carries weight
  const weightChips = [];
  if (topic) {
    if (topic.tier) weightChips.push(el('span.chip', { text: TIER_LABEL[topic.tier] }));
    if (topic.prelimsWeight > 0) {
      weightChips.push(el('span.chip', { text: `${topic.prelimsWeight} Q Prelims` }));
    }
    if (topic.mainsWeight > 0) {
      weightChips.push(el('span.chip', { text: `${topic.mainsWeight} Q Mains` }));
    }
  }

  const resources = topic
    ? topic.resources.map(resourceRow).filter(Boolean).slice(0, 3)
    : [];

  const card = el(`article.block-card${done ? '.is-done' : ''}${isNext && !done ? '.is-next' : ''}`, {
    style: `--key:${keyVar}`,
    dataset: { block: block.id }
  }, [
    el('div.block-card__head', {}, [
      el('span.block-label', { text: meta ? `${meta.short} · ${block.label}` : block.label }),
      el('span.block-time', { text: `${block.minutes}m` })
    ]),
    el('h3.block-title', { text: title }),
    block.note ? el('p.block-note', { text: block.note }) : null,
    weightChips.length ? el('div.block-meta', {}, weightChips) : null,
    resources.length ? el('div.block-resources', {}, resources) : null,
    el('div.block-actions', {}, [
      topic
        ? el('button.btn.btn--ghost', {
            type: 'button',
            onclick: () => openMasterySheet(topic.subject, topic.id, topic.name)
          }, [icon('book'), 'How to master this'])
        : null,
      el(`button.btn${done ? '.btn--done' : '.btn--primary'}`, {
        type: 'button',
        'aria-pressed': done ? 'true' : 'false',
        onclick: () => onToggle(block.id)
      }, [
        icon(done ? 'check' : 'circle'),
        done ? 'Completed' : 'Mark complete'
      ])
    ])
  ]);

  return card;
}
