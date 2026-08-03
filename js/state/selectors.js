/** Derived values. Nothing here is stored — it is all computed on read. */

import { CURRICULUM, DAY_BY_NUMBER, DAY_BY_DATE } from '../data/curriculum.js';
import { TOPIC_BY_ID } from '../data/topics.js';
import { KEY_DATES, START_DATE, TOTAL_DAYS } from '../data/phases.js';
import { todayISO, daysBetween } from '../utils/dates.js';

/** The day the app should open on: today's real date, clamped into the plan. */
export function currentDayNumber() {
  const t = todayISO();
  if (DAY_BY_DATE[t]) return DAY_BY_DATE[t].day;
  const offset = daysBetween(START_DATE, t);
  if (offset < 0) return 1;
  return Math.min(TOTAL_DAYS, offset + 1);
}

export function dayProgress(state, dayNumber) {
  const cur = DAY_BY_NUMBER[dayNumber];
  const saved = state.days[dayNumber];
  const total = cur?.blocks.length ?? 0;
  const done = total === 0 ? 0 : cur.blocks.filter(b => saved?.blocks?.[b.id]).length;
  return { done, total, complete: total > 0 && done === total, pct: total ? done / total : 0 };
}

export function isDayComplete(state, dayNumber) {
  return dayProgress(state, dayNumber).complete;
}

export function completedDayCount(state) {
  return CURRICULUM.filter(d => d.blocks.length > 0 && isDayComplete(state, d.day)).length;
}

export function studyDayCount() {
  return CURRICULUM.filter(d => d.blocks.length > 0).length;
}

export function totalQuestions(state) {
  return Object.values(state.days).reduce((sum, d) => sum + (d.questionsSolved || 0), 0);
}

/**
 * Honest streak: consecutive complete days counting back from the most recent day
 * that has passed. It breaks when you miss. That is the point.
 */
export function streak(state) {
  const today = currentDayNumber();
  let n = 0;
  for (let day = today; day >= 1; day--) {
    const cur = DAY_BY_NUMBER[day];
    if (!cur || cur.blocks.length === 0) continue;   // exam days don't break a streak
    if (isDayComplete(state, day)) n++;
    else if (day < today) break;                     // today still in progress doesn't break it
  }
  return n;
}

export function missedDays(state) {
  const today = currentDayNumber();
  return CURRICULUM.filter(d =>
    d.day < today && d.blocks.length > 0 && !isDayComplete(state, d.day)
  ).length;
}

/**
 * Revision items due on or before today.
 *
 * Deliberately CAPPED. An unbounded queue showing "217 overdue" is not a queue,
 * it is a reason to stop opening the app. Ranked by exam weight so that when you
 * cannot clear everything you clear the marks that matter, and the overflow is
 * reported separately rather than shown as a wall.
 */
export const REVISION_QUEUE_LIMIT = 6;

export function dueRevisions(state, onDate = todayISO(), limit = REVISION_QUEUE_LIMIT) {
  const out = [];
  for (const [topicId, t] of Object.entries(state.topics)) {
    for (const rev of t.revisions || []) {
      if (!rev.done && rev.due <= onDate) {
        out.push({ topicId, topic: TOPIC_BY_ID[topicId], ...rev });
      }
    }
  }
  const weight = r => (r.topic?.prelimsWeight || 0) + (r.topic?.mainsWeight || 0);
  out.sort((a, b) => (weight(b) - weight(a)) || a.due.localeCompare(b.due));
  const shown = out.slice(0, limit);
  shown.overdueTotal = out.length;
  return shown;
}

export function topicAccuracy(state, topicId) {
  const t = state.topics[topicId];
  if (!t) return null;
  const attempted = t.untimed + t.timed;
  if (!attempted) return null;
  return t.correct / attempted;
}

export function topicStatus(state, topicId) {
  const t = state.topics[topicId];
  if (!t) return 'not-started';
  const attempted = (t.untimed || 0) + (t.timed || 0);
  if (attempted === 0) return 'not-started';

  // GA topics carry targetQuestions: 0 because they are recall, not practice.
  // Without this floor a single logged question would promote them to "mastered".
  const declared = TOPIC_BY_ID[topicId]?.targetQuestions ?? 70;
  const target = declared > 0 ? declared : 40;

  if (attempted < target) return 'in-progress';
  const acc = topicAccuracy(state, topicId);
  return acc !== null && acc >= 0.7 ? 'mastered' : 'needs-rework';
}

/** Topics with real practice logged, worst accuracy first. Drives "needs rework". */
export function topicsByWeakness(state) {
  return Object.keys(state.topics)
    .map(id => ({ id, topic: TOPIC_BY_ID[id], status: topicStatus(state, id), accuracy: topicAccuracy(state, id) }))
    .filter(t => t.topic && t.accuracy !== null)
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function bucketCounts(state) {
  const counts = { Concept: 0, Slow: 0, Silly: 0, Selection: 0 };
  for (const e of state.errors) {
    if (counts[e.bucket] !== undefined) counts[e.bucket]++;
  }
  return counts;
}

export function largestBucket(state) {
  const counts = bucketCounts(state);
  const entries = Object.entries(counts).filter(([, n]) => n > 0);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

export function countdowns() {
  const t = todayISO();
  return KEY_DATES.map(k => ({ ...k, daysLeft: Math.max(0, daysBetween(t, k.date)) }));
}

export function daysSinceBackup(state) {
  if (!state.lastBackupAt) return null;
  return daysBetween(state.lastBackupAt.slice(0, 10), todayISO());
}

export function needsBackupWarning(state) {
  const since = daysSinceBackup(state);
  const hasData = completedDayCount(state) > 0 || state.errors.length > 0;
  return hasData && (since === null || since >= 7);
}
