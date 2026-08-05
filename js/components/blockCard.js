/** One study block: label, duration, topic, weightage, resources, complete button. */

import { el } from '../utils/dom.js';
import { icon } from './icons.js';
import { TOPIC_BY_ID, SUBJECT_META, TIER_LABEL } from '../data/topics.js';
import { RESOURCE_BY_ID } from '../data/resources.js';
import { openMasterySheet, BLOCK_SESSIONS } from './masterySheet.js';

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

export function blockCard(block, { done, isNext, onToggle, locked = false }) {
  const topic = block.topicId ? TOPIC_BY_ID[block.topicId] : null;
  // Take the subject from the TOPIC when there is one. Computer Awareness occupies
  // the Reasoning slot because that is exactly where it sits in the real paper —
  // but it should still read as Computer Awareness, in its own colour.
  const subject = topic?.subject || block.subject;

  /**
   * What, if anything, this block can explain about itself.
   * A real topic gets the method sheet; an activity or a standing daily block
   * gets a session protocol. Everything else gets no button rather than a
   * promise the sheet cannot keep.
   */
  const SESSION_TOPIC = /-rev$|sectional|audit|errorbook|marathon|^e-mixed$/;
  const guidance = topic
    ? { subject, id: topic.id, name: topic.name, isSession: SESSION_TOPIC.test(topic.id) }
    : (BLOCK_SESSIONS[block.id]
        ? { subject: block.subject || 'quant', id: `block:${block.id}`, name: BLOCK_SESSIONS[block.id], isSession: true }
        : null);
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
      /**
       * The label must match what the sheet actually contains.
       *
       * It used to read "How to master this" on everything with a topicId —
       * including the eleven scheduled ACTIVITIES (sectionals, revision passes,
       * the syllabus audit), which open a session protocol rather than a method.
       * You do not "master" a sectional. Meanwhile the three standing daily
       * blocks — the calculation drill, the DI set and the revision queue — had
       * no button at all, despite running every single day for 145 days.
       */
      guidance
        ? el('button.btn.btn--ghost', {
            type: 'button',
            title: guidance.isSession ? 'How to run this session' : 'Method, tricks, traps and a time target',
            onclick: () => openMasterySheet(guidance.subject, guidance.id, guidance.name)
          }, [icon(guidance.isSession ? 'tool' : 'book'),
              guidance.isSession ? 'How to run this' : 'How to master this'])
        : null,
      el(`button.btn${done ? '.btn--done' : '.btn--primary'}`, {
        type: 'button',
        disabled: locked,
        title: locked ? 'Available on the day itself' : null,
        'aria-pressed': done ? 'true' : 'false',
        onclick: () => { if (!locked) onToggle(block.id); }
      }, [
        icon(done ? 'check' : 'circle'),
        el('span.btn-label', { text: locked ? 'Not yet' : (done ? 'Completed' : 'Mark complete') })
      ])
    ])
  ]);

  return card;
}
