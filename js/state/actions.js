/** Every write to state goes through one of these. Views never mutate directly. */

import { update, replaceState } from './store.js';
import { DAY_BY_NUMBER } from '../data/curriculum.js';
import { todayISO, addDays, iso } from '../utils/dates.js';

/** Spaced repetition: a topic studied on day N is revisited at N+1, N+7, N+21. */
const REVISION_OFFSETS = [1, 7, 21];

function ensureDay(draft, day) {
  if (!draft.days[day]) {
    draft.days[day] = { blocks: {}, questionsSolved: 0, notes: '', completedAt: null };
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

export function toggleBlock(dayNumber, blockId) {
  return update(draft => {
    const curriculumDay = DAY_BY_NUMBER[dayNumber];
    const day = ensureDay(draft, dayNumber);
    const nowDone = !day.blocks[blockId];
    day.blocks[blockId] = nowDone;

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

export function markRevisionDone(topicId, offset) {
  return update(draft => {
    const topic = draft.topics[topicId];
    const rev = topic?.revisions.find(r => r.offset === offset);
    if (rev) rev.done = true;
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
