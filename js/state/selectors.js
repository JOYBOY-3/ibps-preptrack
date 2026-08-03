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
  // Rank by what forgetting COSTS: a topic's exam weight multiplied by how long
  // it has been slipping. Weight alone starves the cheap Mains-only topics
  // (Machine I/O, Data Sufficiency) that a solo candidate can win marks on.
  const daysOverdue = r => Math.max(0, Math.round(
    (new Date(onDate) - new Date(r.due)) / 86400000));
  const value = r => ((r.topic?.prelimsWeight || 0) + (r.topic?.mainsWeight || 0) + 1)
                     * (1 + Math.min(daysOverdue(r), 14) / 7);
  out.sort((a, b) => (value(b) - value(a)) || a.due.localeCompare(b.due));
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
/**
 * Weakest topics, ranked by what fixing them is WORTH.
 *
 * Pure accuracy order is the wrong list: it puts a 62% score on a one-question
 * topic above a 71% score on Puzzles, which is 17 questions in Prelims and 19 in
 * Mains. The cost of a weakness is (1 − accuracy) × its weight in the papers, and
 * that is what should decide where the next hour goes.
 */
export function topicsByWeakness(state, limit = 6) {
  return Object.keys(state.topics)
    .map(id => {
      const topic = TOPIC_BY_ID[id];
      const accuracy = topicAccuracy(state, id);
      if (!topic || accuracy === null) return null;
      const rec = state.topics[id] || {};
      const attempted = (rec.untimed || 0) + (rec.timed || 0);
      const weight = (topic.prelimsWeight || 0) + (topic.mainsWeight || 0);
      return {
        id, topic, accuracy, attempted, weight,
        status: topicStatus(state, id),
        cost: (1 - accuracy) * weight          // marks left on the table
      };
    })
    .filter(t => t && t.attempted >= 10)       // fewer than 10 answers is noise, not a signal
    .sort((a, b) => b.cost - a.cost)
    .slice(0, limit);
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

export function countdowns(state = null) {
  const t = todayISO();
  // The notification gives MONTHS, not dates ("October, 2026" / "December, 2026").
  // Settings lets you enter the real date the moment the call letter arrives; until
  // then these are the plan's assumed dates and the UI must label them as such.
  const set = state?.settings?.examDates || {};
  return KEY_DATES.map(k => {
    const date = set[k.id] || k.date;
    return {
      ...k,
      date,
      assumed: (k.id === 'prelims' || k.id === 'mains') && !set[k.id],
      daysLeft: Math.max(0, daysBetween(t, date))
    };
  });
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
