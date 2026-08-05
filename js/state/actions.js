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
 * Mains on the last day of the plan.
 *
 * This ladder is expanding, and its final rung lands ~110 days out so August
 * material still gets a touch in December.
 */
/**
 * Retuned against the actual load, not against theory.
 *
 * The old ladder [1,4,10,25,55,110] put a mean of 12.9 items on every day of the
 * plan against a 6-item queue, and its last rung reached the exam for only 24% of
 * topics. This one halves nothing — the load is structurally high because four
 * topic-bearing blocks a day each spawn a ladder — but it lowers the mean to 11.3
 * and doubles last-rung coverage to 49%.
 *
 * The real fix is not the intervals. It is that the queue now has 30 minutes of
 * its own, and that overflow EXPIRES instead of accumulating into a backlog no
 * human can clear. See advanceStaleRevisions().
 */
export const REVISION_OFFSETS = [1, 4, 12, 35, 75];

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
      firstStudied: null, revisions: [],
      understood: false, understoodAt: null
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
/**
 * A revision you never got to is a revision the schedule should move past.
 *
 * Without this, missing three days in November leaves ~40 items permanently
 * "due", the queue shows the same six forever, and the number at the top only
 * grows. That is a guilt meter, not a study tool. Anything more than a week
 * overdue is quietly advanced to its next rung — you lost that touch, and the
 * schedule carries on rather than pretending you can still make it up.
 */
/**
 * Two forced touches anchored to the EXAM, not to when you learned the topic.
 *
 * No survivable ladder spans 145 days. With five rungs the last one lands on day
 * 76 for anything learned in the first week — a 69-day silence before Mains. A
 * sixth rung at N+110 fixes that for 24% of topics and floods the queue for the
 * rest.
 *
 * So the ladder handles acquisition and these two handle the exam: every topic
 * you have actually practised gets a touch 12 days out and again 4 days out,
 * counted back from Mains. August material is revised in December because the
 * calendar says so, not because an offset happened to land there.
 */
const EXAM_SWEEP_DAYS = [12, 4];

export function scheduleExamSweep(mainsDate) {
  if (!mainsDate) return;
  update(draft => {
    for (const [id, rec] of Object.entries(draft.topics)) {
      const attempted = (rec.untimed || 0) + (rec.timed || 0);
      if (attempted < 5) continue;                 // never practised, nothing to revise
      rec.revisions = rec.revisions || [];
      for (const back of EXAM_SWEEP_DAYS) {
        const due = addDays(mainsDate, -back);
        if (rec.revisions.some(r => r.due === due && r.sweep)) continue;
        rec.revisions.push({ due, offset: -back, sweep: true, done: false });
      }
    }
    return draft;
  });
}

export function advanceStaleRevisions(graceDays = 7) {
  const cutoff = addDays(todayISO(), -graceDays);
  update(draft => {
    for (const rec of Object.values(draft.topics)) {
      for (const r of rec.revisions || []) {
        if (r.done || r.sweep || r.due > cutoff) continue;   // sweep touches never expire
        const idx = REVISION_OFFSETS.indexOf(r.offset);
        const next = REVISION_OFFSETS[idx + 1];
        r.done = true;
        r.expired = true;
        if (next !== undefined && rec.firstStudied) {
          rec.revisions.push({ due: addDays(rec.firstStudied, next), offset: next, done: false });
        }
      }
    }
    return draft;
  });
}

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

/**
 * "I understand this and can solve it" — set by you, on the Syllabus screen.
 *
 * Pure self-declaration. The app records it and does not argue: logged accuracy
 * is shown beside it as information, never as a veto. You are allowed to know
 * something the app has no evidence for.
 *
 * The TIMESTAMP is what makes un-ticking work across devices. mergeTopic
 * previously resolved unknown keys local-wins, so a `false` you set here would
 * beat a remote `true` for ever. Same failure the block ticks had before
 * blocksAt existed.
 */
export function setTopicUnderstood(topicId, understood) {
  update(draft => {
    const t = ensureTopic(draft, topicId);
    t.understood = Boolean(understood);
    t.understoodAt = new Date().toISOString();
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

/**
 * Record a confirmed exam date.
 *
 * The notification gives months only, so every countdown in the app is an
 * assumption until this is set. When the call letter lands, one field here makes
 * the whole app tell the truth again.
 */
export function setExamDate(which, isoDate) {
  update(draft => {
    draft.settings = { ...draft.settings, updatedAt: new Date().toISOString() };
    const dates = { ...(draft.settings.examDates || {}) };
    if (isoDate) dates[which] = isoDate; else delete dates[which];
    draft.settings.examDates = dates;
    return draft;
  });
}

/** The state you applied for — it decides your cut-off and your vacancy count. */
export function setStateApplied(name) {
  update(draft => {
    draft.settings = {
      ...draft.settings,
      stateApplied: name || null,
      updatedAt: new Date().toISOString()
    };
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
