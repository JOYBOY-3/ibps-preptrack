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
 *   days[n].blocks[k]        newest wins, per block, by blocksAt timestamp
 *   days[n].questionsSolved  max        monotonic counter
 *   days[n].completedAt      earliest, but cleared if any block merged to false
 *   days[n].notes            newer wins, else concatenate — never silently lost
 *   topics[id] counters      max each   monotonic
 *   topics[id].understood    newest wins by understoodAt, so an untick propagates
 *   topics[id].revisions     union by due date, done = OR
 *   mocks[] / errors[]       union by id, minus deletedIds tombstones
 *   settings                 last-write-wins by settings.updatedAt (trivial to redo)
 *
 * BLOCKS USED TO MERGE WITH OR, and that was wrong. It protected the phone-vs-laptop
 * case but made un-ticking impossible: you untick, the next sync ORs your false
 * against the remote's true, and the tick silently returns. Per-block timestamps
 * (blocksAt) keep the protection — two devices ticking DIFFERENT blocks still merge
 * to both — while letting an explicit undo win, because it is the more recent fact.
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
  /**
   * Each block is resolved INDEPENDENTLY by whichever side touched it last.
   *
   * The old rule was OR, which protected the phone-vs-laptop case but made
   * unticking impossible: you untick, the next sync ORs your false against the
   * remote's true, and the tick silently returns. Per-block timestamps keep the
   * protection (two devices ticking DIFFERENT blocks still merge to both) while
   * letting an explicit undo win, because it is simply the more recent fact.
   *
   * A missing timestamp means pre-v3 data. It loses to any stamped change; if
   * neither side is stamped we fall back to OR, since we cannot tell them apart
   * and keeping work is the safer error.
   */
  const blocks = {};
  const blocksAt = {};
  const keys = new Set([
    ...Object.keys(local.blocks || {}),
    ...Object.keys(remote.blocks || {})
  ]);

  for (const k of keys) {
    const lv = Boolean(local.blocks?.[k]);
    const rv = Boolean(remote.blocks?.[k]);
    const lt = local.blocksAt?.[k] || '';
    const rt = remote.blocksAt?.[k] || '';

    if (!lt && !rt) { blocks[k] = lv || rv; continue; }
    if (lt >= rt) { blocks[k] = lv; if (lt) blocksAt[k] = lt; }
    else { blocks[k] = rv; if (rt) blocksAt[k] = rt; }
  }

  let notes = local.notes || '';
  if (remote.notes && remote.notes !== local.notes) {
    if (!local.notes) notes = remote.notes;
    else if (local.notes.includes(remote.notes)) notes = local.notes;
    else if (remote.notes.includes(local.notes)) notes = remote.notes;
    else notes = `${local.notes}\n---\n${remote.notes}`;
  }

  /**
   * completedAt is cleared only when the merge produced an explicit FALSE — that
   * is the one case where we know for certain the day is no longer complete.
   *
   * We must not infer the opposite. This function has no access to the
   * curriculum, so it cannot know a day has six blocks; a day with three ticks
   * has three `true` keys and looks "all true" here. Asserting completeness from
   * that would mark a third-finished day as done. toggleBlock() recomputes
   * completedAt against the real block count, so the merge only has to avoid
   * lying in the direction it can actually verify.
   */
  const anyUnticked = Object.values(blocks).some(v => !v);

  return {
    ...remote,
    ...local,
    blocks,
    blocksAt,
    questionsSolved: maxNum(local.questionsSolved, remote.questionsSolved),
    completedAt: anyUnticked ? null : earliest(local.completedAt, remote.completedAt),
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

  /**
   * The Syllabus tick resolves NEWEST-WINS, by its own timestamp.
   *
   * The spread below would otherwise resolve it local-wins — whichever device
   * happens to be `local` at merge time keeps its value, so an untick on your
   * phone would be undone by a stale `true` on your laptop, for ever. Exactly the
   * bug blocksAt fixed in mergeDay. If neither side is stamped we fall back to
   * OR, because we cannot tell them apart and keeping the tick is the safer error.
   */
  const lu = local.understoodAt || '';
  const ru = remote.understoodAt || '';
  const understood = (!lu && !ru)
    ? Boolean(local.understood) || Boolean(remote.understood)
    : (lu >= ru ? Boolean(local.understood) : Boolean(remote.understood));

  return {
    ...remote,
    ...local,
    untimed: maxNum(local.untimed, remote.untimed),
    timed: maxNum(local.timed, remote.timed),
    correct: maxNum(local.correct, remote.correct),
    firstStudied: earliest(local.firstStudied, remote.firstStudied),
    understood,
    understoodAt: latest(lu, ru) || null,
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
