/**
 * Sync orchestration.
 *
 * DESIGN RULE: localStorage is the source of truth. Drive is a mirror.
 * The app must open instantly and work completely offline whether or not sync
 * ever succeeds. Sync is a feature, never a dependency — your progress is never
 * hostage to a network call at 6 a.m.
 *
 * Because the GIS popup needs transient user activation, a token can only be
 * minted inside a click handler. So the engine works in two modes:
 *   - opportunistic: piggy-backs on the user's next tap while a token is fresh
 *   - explicit: the "Sync now" / "Connect" buttons, which may open the popup
 */

import { getState, replaceState } from '../state/store.js';
import { saveNow } from '../state/persist.js';
import { mergeStates, statesDiffer } from './merge.js';
import { findStateFile, downloadState, uploadState } from './driveClient.js';
import { getToken, acquireToken, hasFreshToken, hasSignedInBefore } from './googleAuth.js';
import { SYNC_DEBOUNCE_MS } from '../config.js';

const listeners = new Set();

let status = { state: 'idle', message: '', at: null, error: null };
let dirty = false;
let pushTimer = null;
let inFlight = null;

export function onSyncStatus(fn) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

function setStatus(state, message = '', error = null) {
  status = { state, message, at: new Date().toISOString(), error };
  for (const fn of listeners) {
    try { fn(status); } catch (err) { console.error('[preptrack] sync listener threw', err); }
  }
}

export function getSyncStatus() { return status; }

export function isConnected() {
  return Boolean(getState().syncMeta?.provider === 'google' && hasSignedInBefore());
}

export function markDirty() {
  if (!isConnected()) return;
  dirty = true;
  clearTimeout(pushTimer);
  // We cannot open a popup from a timer, so this only fires when a token is
  // already fresh. Otherwise the flag simply waits for the user's next tap.
  pushTimer = setTimeout(() => { if (hasFreshToken()) sync({ interactive: false }); }, SYNC_DEBOUNCE_MS);
}

function writeSyncMeta(patch) {
  const next = { ...getState() };
  next.syncMeta = { ...next.syncMeta, ...patch };
  replaceState(next);
}

/**
 * Pull remote, merge into local, push the merged result if it differs.
 *
 * @param {object}  opts
 * @param {boolean} opts.interactive  true when called from a user gesture — only
 *                                    then may we open the Google popup.
 */
export async function sync({ interactive = false } = {}) {
  if (inFlight) return inFlight;

  if (!navigator.onLine) {
    setStatus('offline', 'Offline — changes are saved on this device and will sync later.');
    return null;
  }
  if (!isConnected()) {
    setStatus('disconnected', 'Not connected to Google Drive.');
    return null;
  }

  inFlight = (async () => {
    try {
      setStatus('syncing', 'Syncing…');

      const token = interactive ? await acquireToken() : getToken();
      if (!token) {
        setStatus('pending', 'Waiting to sync — tap anything to refresh access.');
        return null;
      }

      const local = getState();

      // 1. locate
      let fileId = local.syncMeta?.fileId || null;
      let remoteMeta = null;
      if (!fileId) {
        remoteMeta = await findStateFile(token);
        fileId = remoteMeta?.id || null;
      }

      // 2. pull + merge
      let merged = local;
      if (fileId) {
        let remote = null;
        try {
          remote = await downloadState(token, fileId);
        } catch (err) {
          // A missing or unreadable remote must never destroy local work.
          if (err.status !== 404) throw err;
          fileId = null;
        }
        if (remote && typeof remote === 'object' && remote.days) {
          merged = mergeStates(local, remote);
          if (statesDiffer(local, merged)) {
            merged.syncMeta = local.syncMeta;
            replaceState(merged);
            saveNow(merged);
          }
        }
      }

      // 3. push when the remote is behind
      const current = getState();
      const uploaded = await uploadState(token, stripLocalOnly(current), fileId);

      writeSyncMeta({
        provider: 'google',
        fileId: uploaded.id,
        lastSyncedAt: new Date().toISOString(),
        lastRemoteModifiedTime: uploaded.modifiedTime || null
      });

      dirty = false;
      setStatus('synced', 'All changes saved to your Google Drive.');
      return uploaded;
    } catch (err) {
      const msg = String(err?.message || err);
      if (msg === 'token_expired' || msg === 'popup_closed' || msg === 'popup_failed_to_open') {
        setStatus('pending', 'Sync needs you to reconnect. Open Settings and tap Sync now.', msg);
      } else if (msg === 'rate_limited') {
        setStatus('pending', 'Google is rate-limiting. Will retry shortly.', msg);
      } else {
        console.error('[preptrack] sync failed', err);
        setStatus('error', 'Sync failed. Your data is safe on this device.', msg);
      }
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** syncMeta is device-local bookkeeping and has no business in the shared file. */
function stripLocalOnly(state) {
  const { syncMeta, ...rest } = state;
  return rest;
}

/** First-time connect: called from a click handler after a successful sign-in. */
export async function connect() {
  writeSyncMeta({ provider: 'google' });
  return sync({ interactive: true });
}

export function disconnectSync() {
  writeSyncMeta({ provider: null, fileId: null, lastSyncedAt: null, lastRemoteModifiedTime: null });
  dirty = false;
  setStatus('disconnected', 'Disconnected from Google Drive.');
}

/** Opportunistic hook — safe to call from any user gesture. Never opens a popup. */
export function syncOnGesture() {
  if (!dirty || !isConnected() || !navigator.onLine) return;
  if (hasFreshToken()) sync({ interactive: false });
}

export function initSyncListeners() {
  window.addEventListener('online', () => {
    if (dirty && hasFreshToken()) sync({ interactive: false });
    else if (isConnected()) setStatus('pending', 'Back online — tap anything to sync.');
  });
  window.addEventListener('offline', () => {
    if (isConnected()) setStatus('offline', 'Offline — changes are saved on this device.');
  });
  // Last chance to flush before the tab goes away.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && dirty && hasFreshToken()) {
      sync({ interactive: false });
    }
  });
}
