/** Derived values. Nothing here is stored — it is all computed on read. */

import { CURRICULUM, DAY_BY_NUMBER, DAY_BY_DATE } from '../data/curriculum.js';
import { TOPIC_BY_ID } from '../data/topics.js';
import { KEY_DATES, START_DATE, TOTAL_DAYS, phaseForDay } from '../data/phases.js';
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


/* ------------------------------------------------------- adaptive allocation */

/**
 * Floors, in minutes. A suggestion may never take a block below these.
 *
 * English's floor is the important one and it is NOT about marks-per-minute —
 * English is the worst rate in the Mains paper. It is about the SECTIONAL
 * cut-off: a Prelims English miss ends the year in October regardless of a 60 in
 * Quant, and that is the most common single-cause failure for a self-studying
 * candidate. GA's floor exists because it compounds and cannot be crammed.
 */
const BLOCK_FLOOR = { calc: 10, ga: 30, reas: 45, quant: 45, eng: 30, di: 10, rev: 25 };
const SUBJECT_OF_BLOCK = { reas: 'reasoning', quant: 'quant', eng: 'english', ga: 'ga', di: 'quant' };
const MAX_SHIFT = 10;

/** Questions-weighted accuracy per subject, with the sample size behind it. */
export function subjectAccuracy(state) {
  const acc = {};
  for (const [id, rec] of Object.entries(state.topics || {})) {
    const topic = TOPIC_BY_ID[id];
    if (!topic?.subject) continue;
    const attempted = (rec.untimed || 0) + (rec.timed || 0);
    if (!attempted) continue;
    const a = (acc[topic.subject] ||= { attempted: 0, correct: 0 });
    a.attempted += attempted;
    a.correct += rec.correct || 0;
  }
  for (const a of Object.values(acc)) a.accuracy = a.attempted ? a.correct / a.attempted : null;
  return acc;
}

/**
 * "Move 10 minutes from X to Y this week."
 *
 * This is the one thing an app can do that a printed plan cannot: every minute
 * allocation in this curriculum is a fixed guess about an average aspirant, and
 * this is the only part that adapts to the actual person. It is advice, not an
 * automatic reschedule — the blocks keep their nominal minutes and you decide.
 * Silent rescheduling would break the 240-minute contract the whole plan rests on.
 *
 * Deliberately conservative: it needs 120+ questions on both sides, a 12-point
 * gap, and it will not move more than 10 minutes or breach a floor.
 */
export function allocationAdvice(state) {
  const acc = subjectAccuracy(state);
  const ready = Object.entries(acc).filter(([, a]) => a.attempted >= 120 && a.accuracy !== null);
  if (ready.length < 2) {
    const short = 2 - ready.length;
    return { pending: true, need: short,
      message: `Log practice in ${short} more subject${short > 1 ? 's' : ''} (120+ questions each) ` +
               `and this will start recommending where your minutes should move.` };
  }

  ready.sort((a, b) => b[1].accuracy - a[1].accuracy);
  const [strongSub, strong] = ready[0];
  const [weakSub, weak] = ready[ready.length - 1];
  const gap = strong.accuracy - weak.accuracy;
  if (gap < 0.12) {
    return { balanced: true,
      message: `Your subjects are within ${Math.round(gap * 100)} points of each other. ` +
               `No reallocation needed — that is a good place to be.` };
  }

  // Take from a block of the strong subject that has room above its floor.
  const phase = phaseForDay(currentDayNumber());
  const blocks = phase?.blocks || [];
  const donor = blocks.find(b => SUBJECT_OF_BLOCK[b.id] === strongSub &&
                                 b.minutes - MAX_SHIFT >= (BLOCK_FLOOR[b.id] ?? 0));
  const receiver = blocks.find(b => SUBJECT_OF_BLOCK[b.id] === weakSub);
  if (!donor || !receiver) {
    return { blocked: true,
      message: `${label(weakSub)} is your weakest at ${pct(weak.accuracy)}, but ${label(strongSub)} ` +
               `is already at its floor — it cannot be cut further without risking its sectional cut-off. ` +
               `Use the weak-area slot on Sunday instead.` };
  }

  return {
    from: donor.id, to: receiver.id, minutes: MAX_SHIFT,
    strongSub, weakSub,
    message: `${label(strongSub)} is at ${pct(strong.accuracy)} over ${strong.attempted} questions; ` +
             `${label(weakSub)} is at ${pct(weak.accuracy)} over ${weak.attempted}. ` +
             `Spend ${MAX_SHIFT} of your ${donor.label} minutes on ${receiver.label} this week.`
  };
}

const pct = a => `${Math.round(a * 100)}%`;
const label = s => ({ reasoning: 'Reasoning', quant: 'Quant', english: 'English', ga: 'GA',
                      computer: 'Banking tech' }[s] || s);
