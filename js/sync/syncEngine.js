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
let inFlightSince = 0;

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
const SYNC_TIMEOUT_MS = 90_000;

export async function sync({ interactive = false } = {}) {
  // If a previous attempt has been in flight implausibly long, abandon it rather
  // than returning the same wedged promise to every later caller.
  if (inFlight) {
    if (Date.now() - inFlightSince < SYNC_TIMEOUT_MS) return inFlight;
    inFlight = null;
  }

  if (!navigator.onLine) {
    setStatus('offline', 'Offline — changes are saved on this device and will sync later.');
    return null;
  }
  if (!isConnected()) {
    setStatus('disconnected', 'Not connected to Google Drive.');
    return null;
  }

  inFlightSince = Date.now();
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
          // The cached id is stale — clear it now, or every future sync repeats
          // this same 404 against a file that no longer exists.
          fileId = null;
          writeSyncMeta({ fileId: null });
          const found = await findStateFile(token).catch(() => null);
          if (found?.id) {
            fileId = found.id;
            remote = await downloadState(token, fileId).catch(() => null);
          }
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
      if (msg === 'auth_timeout') {
        setStatus('pending', 'Google sign-in did not respond. Tap Sync now to retry.', msg);
      } else if (msg === 'token_expired' || msg === 'popup_closed' || msg === 'popup_failed_to_open') {
        setStatus('pending', 'Sync needs you to reconnect. Open Settings and tap Sync now.', msg);
      } else if (err?.retryable) {
        setStatus('pending', err.userMessage || 'Temporary Google error. Will retry shortly.', msg);
      } else {
        console.error('[preptrack] sync failed', err);
        // Surface the ACTUAL reason — a vague message costs hours of wrong debugging.
        setStatus('error',
          err?.userMessage || 'Sync failed. Your data is safe on this device.', msg);
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

/**
 * Opportunistic hook — safe from any user gesture.
 *
 * A gesture is also the ONLY moment a fresh token can be minted, because the GIS
 * popup requires transient user activation. So if the token has lapsed, we quietly
 * renew it here: the user taps a block complete, and that same tap silently mints a
 * token and pushes the change. In practice this makes sync feel fully automatic.
 */
export function syncOnGesture() {
  if (!isConnected() || !navigator.onLine) return;

  if (hasFreshToken()) {
    if (dirty) sync({ interactive: false });
    return;
  }
  // Token lapsed and there is work to push — renew inside this gesture.
  if (dirty && Date.now() - lastInteractiveAttempt > 30_000) {
    lastInteractiveAttempt = Date.now();
    sync({ interactive: true }).catch(() => { /* status already set */ });
  }
}

let lastInteractiveAttempt = 0;
let autoTimer = null;

/**
 * Background auto-sync. Runs on a timer while the token is still valid, so for the
 * hour after any sign-in the app syncs entirely on its own with no interaction.
 * It never opens a popup from here — that would be blocked, and would be rude.
 */
const AUTO_SYNC_INTERVAL_MS = 60_000;

function startAutoSync() {
  clearInterval(autoTimer);
  autoTimer = setInterval(() => {
    if (!isConnected() || !navigator.onLine) return;
    if (document.visibilityState !== 'visible') return;
    if (!dirty) return;
    if (!hasFreshToken()) return;       // wait for a gesture to renew
    sync({ interactive: false });
  }, AUTO_SYNC_INTERVAL_MS);
}

export function initSyncListeners() {
  startAutoSync();

  window.addEventListener('online', () => {
    if (!isConnected()) return;
    if (dirty && hasFreshToken()) sync({ interactive: false });
    else setStatus('pending', 'Back online — syncing shortly.');
  });

  window.addEventListener('offline', () => {
    if (isConnected()) setStatus('offline', 'Offline — changes are saved on this device.');
  });

  document.addEventListener('visibilitychange', () => {
    if (!isConnected()) return;
    if (document.visibilityState === 'visible') {
      // Returning to the tab: pull anything another device pushed.
      if (hasFreshToken()) sync({ interactive: false });
    } else if (dirty && hasFreshToken()) {
      // Last chance to flush before the tab is backgrounded or closed.
      sync({ interactive: false });
    }
  });

  // Pull once on load so a device that has been closed catches up immediately.
  setTimeout(() => {
    if (isConnected() && navigator.onLine && hasFreshToken()) sync({ interactive: false });
  }, 2500);
}
