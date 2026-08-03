/**
 * localStorage persistence with schema versioning.
 *
 * Backup is a first-class feature, not a nicety: localStorage is wiped by clearing
 * browsing data, by private mode, and by some "storage cleaner" apps. Losing four
 * months of tracking would be devastating, so export/import ships in v1.
 */

const KEY = 'preptrack.ibps2026';
const SCHEMA_VERSION = 3;

/** crypto.randomUUID needs a secure context; fall back so file:// and http:// still work. */
export function newId(prefix = '') {
  const uuid = globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${uuid}` : uuid;
}

export function freshState() {
  return {
    version: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    lastBackupAt: null,
    settings: { theme: 'auto', updatedAt: new Date().toISOString() },
    // days: { "12": { blocks:{calc:true}, blocksAt:{calc:"<iso>"}, questionsSolved, notes, completedAt } }
    // blocksAt exists so an UNTICK can win a merge. Without a per-block timestamp
    // the only safe merge is OR, and OR makes unticking impossible across devices.
    days: {},
    topics: {},   // { "r-box": { untimed, timed, correct, firstStudied, revisions: [] } }
    mocks: [],
    errors: [],
    deletedIds: [],   // tombstones, so a deletion is not resurrected by another device
    syncMeta: {       // device-local; never merged in from a remote copy
      provider: null,
      fileId: null,
      lastSyncedAt: null,
      lastRemoteModifiedTime: null
    }
  };
}

/** Migration chain. Each function takes state at version N and returns version N+1. */
const MIGRATIONS = {
  // v2 -> v3: stamp existing block ticks so they can be compared against future
  // changes. Existing ticks are backdated to the day's completion (or creation)
  // time, which is the truthful answer: they happened before anything new.
  2: state => ({
    ...state,
    version: 3,
    days: Object.fromEntries(Object.entries(state.days || {}).map(([day, d]) => {
      const stamp = d.completedAt || state.createdAt || new Date(0).toISOString();
      const blocksAt = { ...(d.blocksAt || {}) };
      for (const k of Object.keys(d.blocks || {})) blocksAt[k] ??= stamp;
      return [day, { ...d, blocksAt }];
    }))
  }),
  // v1 → v2: array entries gain stable ids so they can be merged rather than duplicated.
  1: state => ({
    ...state,
    version: 2,
    mocks: (state.mocks || []).map(m => ({
      id: m.id || newId('m'),
      createdAt: m.createdAt || m.date || state.createdAt,
      ...m
    })),
    errors: (state.errors || []).map(e => ({
      id: e.id || newId('e'),
      createdAt: e.createdAt || e.date || state.createdAt,
      ...e
    })),
    settings: { theme: 'auto', updatedAt: state.createdAt, ...(state.settings || {}) },
    deletedIds: state.deletedIds || [],
    syncMeta: state.syncMeta || {
      provider: null, fileId: null, lastSyncedAt: null, lastRemoteModifiedTime: null
    }
  })
};

function migrate(state) {
  let s = state;
  while (s.version < SCHEMA_VERSION) {
    const step = MIGRATIONS[s.version];
    if (!step) { s.version = SCHEMA_VERSION; break; }
    s = step(s);
  }
  return s;
}

function isValid(s) {
  return s && typeof s === 'object' && typeof s.version === 'number'
    && s.days && typeof s.days === 'object'
    && Array.isArray(s.mocks) && Array.isArray(s.errors);
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    if (!isValid(parsed)) {
      console.warn('[preptrack] stored state failed validation — starting fresh');
      return freshState();
    }
    return migrate({ ...freshState(), ...parsed });
  } catch (err) {
    console.error('[preptrack] could not read saved data', err);
    return freshState();
  }
}

let writeTimer = null;
export function save(state) {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      console.error('[preptrack] save failed — storage may be full or blocked', err);
      window.dispatchEvent(new CustomEvent('preptrack:save-failed'));
    }
  }, 300);
}

export function saveNow(state) {
  clearTimeout(writeTimer);
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}

/** Ask the browser for durable storage so routine cache clearing doesn't wipe progress. */
export async function requestPersistence() {
  if (!navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch { return false; }
}

export function exportJSON(state) {
  const payload = { ...state, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `preptrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!isValid(parsed)) return reject(new Error('That file is not a PrepTrack backup.'));
        resolve(migrate({ ...freshState(), ...parsed }));
      } catch {
        reject(new Error('That file could not be read as JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('The file could not be opened.'));
    reader.readAsText(file);
  });
}

export function clearAll() {
  localStorage.removeItem(KEY);
}

export function storageBytes() {
  try { return new Blob([localStorage.getItem(KEY) || '']).size; }
  catch { return 0; }
}
