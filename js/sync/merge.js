/**
 * Conflict resolution. Pure functions, no imports, trivially unit-testable.
 *
 * WHY NOT LAST-WRITE-WINS: it would eventually eat a real study day. Concretely —
 * you tick four blocks on your phone on the train, then open the laptop whose
 * localStorage is a day stale and tick two blocks. Last-write-wins silently deletes
 * the phone's four. That is unacceptable for four months of work.
 *
 * This data model merges cleanly because it is keyed maps plus append-only logs:
 *
 *   days[n].blocks[k]        OR         completion is monotonic
 *   days[n].questionsSolved  max        monotonic counter
 *   days[n].completedAt      earliest   first completion is the truth
 *   days[n].notes            newer wins, else concatenate — never silently lost
 *   topics[id] counters      max each   monotonic
 *   topics[id].revisions     union by due date, done = OR
 *   mocks[] / errors[]       union by id, minus deletedIds tombstones
 *   settings                 last-write-wins by settings.updatedAt (trivial to redo)
 *
 * ACCEPTED TRADE-OFF: because blocks merge with OR, un-ticking a block on one device
 * does not propagate to another that still has it ticked. Losing an accidental tick
 * is a trivial cost; losing a real study day is not. The asymmetry is deliberate.
 */

const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const maxNum = (a, b) => Math.max(num(a), num(b));

/** Earliest non-null ISO timestamp. */
function earliest(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return a <= b ? a : b;
}

/** Latest non-null ISO timestamp. */
function latest(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return a >= b ? a : b;
}

export function mergeDay(local = {}, remote = {}) {
  const blocks = {};
  for (const k of new Set([
    ...Object.keys(local.blocks || {}),
    ...Object.keys(remote.blocks || {})
  ])) {
    blocks[k] = Boolean(local.blocks?.[k]) || Boolean(remote.blocks?.[k]);
  }

  let notes = local.notes || '';
  if (remote.notes && remote.notes !== local.notes) {
    if (!local.notes) notes = remote.notes;
    else if (local.notes.includes(remote.notes)) notes = local.notes;
    else if (remote.notes.includes(local.notes)) notes = remote.notes;
    else notes = `${local.notes}\n---\n${remote.notes}`;
  }

  return {
    ...remote,
    ...local,
    blocks,
    questionsSolved: maxNum(local.questionsSolved, remote.questionsSolved),
    completedAt: earliest(local.completedAt, remote.completedAt),
    notes
  };
}

export function mergeTopic(local = {}, remote = {}) {
  const byDue = new Map();
  for (const r of [...(remote.revisions || []), ...(local.revisions || [])]) {
    if (!r?.due) continue;
    const prev = byDue.get(r.due);
    byDue.set(r.due, prev ? { ...prev, ...r, done: Boolean(prev.done) || Boolean(r.done) } : { ...r });
  }

  return {
    ...remote,
    ...local,
    untimed: maxNum(local.untimed, remote.untimed),
    timed: maxNum(local.timed, remote.timed),
    correct: maxNum(local.correct, remote.correct),
    firstStudied: earliest(local.firstStudied, remote.firstStudied),
    revisions: [...byDue.values()].sort((a, b) => a.due.localeCompare(b.due))
  };
}

/** Union two append-only logs by stable id, dropping anything tombstoned. */
export function mergeLog(localList = [], remoteList = [], deletedIds = []) {
  const dead = new Set(deletedIds);
  const byId = new Map();
  for (const item of [...remoteList, ...localList]) {
    if (!item) continue;
    const id = item.id;
    if (!id || dead.has(id)) continue;
    byId.set(id, byId.has(id) ? { ...byId.get(id), ...item } : item);
  }
  return [...byId.values()].sort((a, b) =>
    String(a.createdAt || a.date || '').localeCompare(String(b.createdAt || b.date || '')));
}

function mergeKeyed(localMap = {}, remoteMap = {}, mergeOne) {
  const out = {};
  for (const k of new Set([...Object.keys(localMap), ...Object.keys(remoteMap)])) {
    out[k] = mergeOne(localMap[k] || {}, remoteMap[k] || {});
  }
  return out;
}

/**
 * Merge a remote state into the local state. Neither input is mutated.
 * Order of arguments matters only for settings and for notes tie-breaks.
 */
export function mergeStates(local, remote) {
  if (!remote) return local;
  if (!local) return remote;

  const deletedIds = [...new Set([...(local.deletedIds || []), ...(remote.deletedIds || [])])];

  const localSettingsAt = local.settings?.updatedAt || '';
  const remoteSettingsAt = remote.settings?.updatedAt || '';
  const settings = remoteSettingsAt > localSettingsAt
    ? { ...local.settings, ...remote.settings }
    : { ...remote.settings, ...local.settings };

  return {
    ...remote,
    ...local,
    version: Math.max(num(local.version), num(remote.version)) || local.version,
    createdAt: earliest(local.createdAt, remote.createdAt),
    lastBackupAt: latest(local.lastBackupAt, remote.lastBackupAt),
    settings,
    days: mergeKeyed(local.days, remote.days, mergeDay),
    topics: mergeKeyed(local.topics, remote.topics, mergeTopic),
    mocks: mergeLog(local.mocks, remote.mocks, deletedIds),
    errors: mergeLog(local.errors, remote.errors, deletedIds),
    deletedIds,
    // syncMeta is device-local and must never come from the remote copy.
    syncMeta: local.syncMeta
  };
}

/**
 * Cheap change detector, used to decide whether an upload is worth doing.
 * Compares everything except device-local sync bookkeeping.
 */
export function statesDiffer(a, b) {
  if (!a || !b) return true;
  const strip = s => JSON.stringify({
    days: s.days, topics: s.topics, mocks: s.mocks,
    errors: s.errors, settings: s.settings, deletedIds: s.deletedIds
  });
  return strip(a) !== strip(b);
}
