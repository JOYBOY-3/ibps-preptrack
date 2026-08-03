/** Every write to state goes through one of these. Views never mutate directly. */

import { update, replaceState } from './store.js';
import { DAY_BY_NUMBER } from '../data/curriculum.js';
import { todayISO, addDays, iso } from '../utils/dates.js';
import { currentDayNumber } from './selectors.js';

/**
 * Spaced repetition ladder.
 *
 * The old [1, 7, 21] was arithmetically impossible and stopped far too early.
 * Four topic-bearing blocks a day times three rungs meant ~12 items due EVERY day
 * from day 22 against a 30-minute block — so the queue became an unread backlog by
 * mid-September and the retention mechanism died. And the last rung landed 21 days
 * after first study: a topic learned on day 5 was never scheduled again before
 * Mains on day 147.
 *
 * This ladder is expanding, and its final rung lands ~110 days out so August
 * material still gets a touch in December.
 */
const REVISION_OFFSETS = [1, 4, 10, 25, 55, 110];

function ensureDay(draft, day) {
  if (!draft.days[day]) {
    draft.days[day] = { blocks: {}, blocksAt: {}, questionsSolved: 0, notes: '', completedAt: null };
  }
  return draft.days[day];
}

function ensureTopic(draft, topicId) {
  if (!draft.topics[topicId]) {
    draft.topics[topicId] = {
      untimed: 0, timed: 0, correct: 0,
      firstStudied: null, revisions: []
    };
  }
  return draft.topics[topicId];
}

/**
 * A day is "future" when it is past the day you have actually reached.
 *
 * Deliberately NOT a raw date comparison. currentDayNumber() clamps to day 1
 * before the plan's start date, so someone who opens the app on 3 August can
 * still work Day 1 rather than being told to come back on the 5th. The guard
 * exists to stop all 145 days being ticked in an afternoon, not to police
 * enthusiasm.
 */
export function isFutureDay(dayNumber) {
  return dayNumber > currentDayNumber();
}

export function toggleBlock(dayNumber, blockId) {
  return update(draft => {
    const curriculumDay = DAY_BY_NUMBER[dayNumber];
    // A day you have not reached yet cannot be complete. Without this the whole
    // tracker is decorative: 145 days could be ticked in an afternoon.
    if (dayNumber > currentDayNumber()) return draft;
    const day = ensureDay(draft, dayNumber);
    const nowDone = !day.blocks[blockId];
    day.blocks[blockId] = nowDone;
    // Stamp the change so a later untick beats an earlier tick from any device.
    day.blocksAt = day.blocksAt || {};
    day.blocksAt[blockId] = new Date().toISOString();

    // A day counts complete only at 6/6 (or however many blocks the phase defines).
    // No partial credit — that is the point.
    const total = curriculumDay?.blocks.length || 0;
    const done = curriculumDay?.blocks.filter(b => day.blocks[b.id]).length || 0;
    day.completedAt = total > 0 && done === total ? new Date().toISOString() : null;

    // Completing a subject block schedules that topic's revision ladder.
    const block = curriculumDay?.blocks.find(b => b.id === blockId);
    if (nowDone && block?.topicId) {
      const topic = ensureTopic(draft, block.topicId);
      if (!topic.firstStudied) {
        topic.firstStudied = curriculumDay.date;
        topic.revisions = REVISION_OFFSETS.map(offset => ({
          due: iso(addDays(curriculumDay.date, offset)),
          offset,
          done: false
        }));
      }
    }
    return draft;
  });
}

export function setQuestionsSolved(dayNumber, count) {
  return update(draft => {
    ensureDay(draft, dayNumber).questionsSolved = Math.max(0, Number(count) || 0);
    return draft;
  });
}

export function setDayNotes(dayNumber, notes) {
  return update(draft => {
    ensureDay(draft, dayNumber).notes = notes;
    return draft;
  });
}

/**
 * Grade a revision instead of just dismissing it.
 *   solid  — you had it. Advance to the next rung.
 *   shaky  — repeat this rung in 2 days rather than advancing.
 *   failed — drop two rungs back; you have not retained it.
 * A binary "Done" button teaches the app nothing and lets you tick away a topic
 * you could not actually solve.
 */
export function markRevisionDone(topicId, offset, quality = 'solid') {
  return update(draft => {
    const topic = draft.topics[topicId];
    const rev = topic?.revisions.find(r => r.offset === offset && !r.done);
    if (!rev) return draft;
    rev.done = true;
    rev.quality = quality;
    rev.reviewedOn = todayISO();

    const base = topic.firstStudied;
    if (!base) return draft;

    const idx = REVISION_OFFSETS.indexOf(offset);
    let nextOffset = null;
    if (quality === 'solid') nextOffset = REVISION_OFFSETS[idx + 1] ?? null;
    else if (quality === 'shaky') nextOffset = offset + 2;
    else nextOffset = REVISION_OFFSETS[Math.max(0, idx - 2)] + 1;

    if (nextOffset !== null) {
      const due = iso(addDays(base, nextOffset));
      if (!topic.revisions.some(r => r.due === due && !r.done)) {
        topic.revisions.push({ due, offset: nextOffset, done: false });
      }
    }
    return draft;
  });
}

export function logTopicPractice(topicId, { untimed = 0, timed = 0, correct = 0 }) {
  return update(draft => {
    const t = ensureTopic(draft, topicId);
    t.untimed += Number(untimed) || 0;
    t.timed += Number(timed) || 0;
    t.correct += Number(correct) || 0;
    return draft;
  });
}

export function logError(entry) {
  return update(draft => {
    draft.errors.push({
      id: `e${Date.now()}${Math.floor(performance.now() % 1000)}`,
      date: todayISO(),
      revisited: false,
      ...entry
    });
    return draft;
  });
}

export function logMock(entry) {
  return update(draft => {
    draft.mocks.push({
      id: `m${Date.now()}`,
      date: todayISO(),
      ...entry
    });
    return draft;
  });
}

export function setTheme(theme) {
  return update(draft => {
    draft.settings.theme = theme;
    return draft;
  });
}

export function markBackedUp() {
  return update(draft => {
    draft.lastBackupAt = new Date().toISOString();
    return draft;
  });
}

export { replaceState };
