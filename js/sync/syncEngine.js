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

let watchdog = null;

function setStatus(state, message = '', error = null) {
  status = { state, message, at: new Date().toISOString(), error };

  // Nothing may leave the indicator reading "Saving…" forever. If a sync has not
  // resolved in 30s, say so honestly rather than spinning at the user.
  clearTimeout(watchdog);
  if (state === 'syncing') {
    watchdog = setTimeout(() => {
      if (status.state === 'syncing') {
        inFlight = null;
        setStatus('pending', 'Taking longer than expected. Your work is safe on this device — tap Sync now to retry.');
      }
    }, 30_000);
  }
  for (const fn of listeners) {
    try { fn(status); } catch (err) { console.error('[preptrack] sync listener threw', err); }
  }
}

export function getSyncStatus() { return status; }

export function isConnected() {
  return Boolean(getState().syncMeta?.provider === 'google' && hasSignedInBefore());
}

/**
 * True while sync is writing its own bookkeeping or applying a merged remote.
 *
 * Without this guard the engine chases its own tail: writeSyncMeta() calls
 * replaceState() -> notify() -> markDirty() -> schedules another sync 1.5s later
 * -> which calls writeSyncMeta() again, forever. That perpetual loop is why the
 * app appeared to sync (and, on the old build, re-render) without end.
 */
let applyingRemote = false;

export function markDirty() {
  if (!isConnected() || applyingRemote) return;
  dirty = true;
  clearTimeout(pushTimer);
  // We cannot open a popup from a timer, so this only fires when a token is
  // already fresh. Otherwise the flag simply waits for the user's next tap.
  pushTimer = setTimeout(() => { if (hasFreshToken()) sync({ interactive: false }); }, SYNC_DEBOUNCE_MS);
}

function writeSyncMeta(patch) {
  const next = { ...getState() };
  next.syncMeta = { ...next.syncMeta, ...patch };
  applyingRemote = true;
  try { replaceState(next); } finally { applyingRemote = false; }
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
    setStatus('offline', 'Offline — saved on this device, will sync when you reconnect');
    return null;
  }
  if (!isConnected()) {
    setStatus('disconnected', 'Not connected to Google Drive.');
    return null;
  }

  inFlightSince = Date.now();

  /**
   * The body is a named function and the in-flight slot is cleared by a .finally()
   * attached AFTER assignment, guarded by identity.
   *
   * Doing the clearing inside the body is subtly broken: an async function runs
   * synchronously until its first await, so any early return (no token, for
   * instance) executes its finally BEFORE `inFlight = ...` has been assigned —
   * which then re-wedges the slot with an already-resolved promise, and every
   * later call gets that corpse instead of a real sync.
   */
  const run = async () => {
    try {
      setStatus('syncing', 'Saving…');

      const token = interactive ? await acquireToken() : getToken();
      if (!token) {
        setStatus('pending', 'Saved here — will reach Drive on your next tap');
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
            // Applying a merge is not a local edit — it must not schedule a push.
            applyingRemote = true;
            try { replaceState(merged); saveNow(merged); } finally { applyingRemote = false; }
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
      setStatus('synced', 'All changes saved to Drive');
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
    }
  };

  const attempt = run();
  inFlight = attempt;
  attempt.finally(() => { if (inFlight === attempt) inFlight = null; });

  return attempt;
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
/**
 * Piggy-back a sync on the user's next tap — but NEVER open a popup from here.
 *
 * This used to call sync({ interactive: true }) when the token had lapsed, which
 * meant: change the theme, and the very same click's pointerup opened a Google
 * sign-in dialog. The user asked for a colour and got an auth prompt. Any tap
 * after any edit could do it, on every screen.
 *
 * An auth popup the user did not ask for is hostile, and it is the kind of thing
 * that makes people distrust an app with their Drive. So the gesture path is now
 * strictly non-interactive: if the token is fresh we push quietly, and if it has
 * lapsed we say so in the status pip and wait for the user to press Sync now.
 * Their work is already safe on the device either way.
 */
export function syncOnGesture() {
  if (!isConnected() || !navigator.onLine) return;
  if (!dirty) return;

  if (hasFreshToken()) {
    sync({ interactive: false });
    return;
  }

  // Lapsed. Tell them once, quietly, and stop — do not summon a popup.
  if (status.state !== 'pending') {
    setStatus('pending', 'Saved on this device. Open Settings and tap Sync now to reach Drive.');
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
    if (isConnected()) setStatus('offline', 'Offline — saved on this device, will sync when you reconnect');
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
