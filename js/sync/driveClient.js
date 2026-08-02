/**
 * Google Drive appDataFolder client.
 *
 * appDataFolder is a hidden per-app folder inside the user's own Drive. This app
 * can only ever see files it created there; it cannot list, read or touch anything
 * else the user owns. The folder is invisible in the Drive UI.
 *
 * Three gotchas that cost people hours, all handled below:
 *  1. files.list returns NOTHING without `spaces=appDataFolder` — the appdata space
 *     is not searched by default, so a missing file looks like a vanished file.
 *  2. `parents: ['appDataFolder']` is settable ONLY at creation. Sending it on a
 *     PATCH is an error.
 *  3. Files in appDataFolder cannot be trashed. Use a hard DELETE.
 */

import { SYNC_FILENAME } from '../config.js';

const DRIVE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Drive returns 403 for several completely unrelated problems, so the `reason`
 * field must be read rather than assumed. Reporting "rate limited" when the real
 * cause is a disabled API sends you debugging in exactly the wrong direction.
 */
const REASON_MESSAGE = {
  accessNotConfigured:
    'The Google Drive API is not enabled for this project. Enable it in Google Cloud Console → APIs & Services → Library → Google Drive API.',
  SERVICE_DISABLED:
    'The Google Drive API is not enabled for this project. Enable it in Google Cloud Console → APIs & Services → Library → Google Drive API.',
  insufficientPermissions:
    'This app was not granted the drive.appdata permission. Sign out and sign in again, and accept the Drive permission.',
  forbidden:
    'Google refused the request. Check that the drive.appdata scope is listed under Data Access.',
  rateLimitExceeded: 'Google is rate-limiting requests. It will retry shortly.',
  userRateLimitExceeded: 'Google is rate-limiting requests. It will retry shortly.',
  dailyLimitExceeded: 'The daily Drive API quota for this project is exhausted.',
  storageQuotaExceeded: 'Your Google Drive is full, so PrepTrack cannot save.',
  appNotAuthorizedToFile: 'PrepTrack cannot access that file — it was created by a different app.'
};

const RETRYABLE = new Set(['rateLimitExceeded', 'userRateLimitExceeded', 'backendError', 'internalError']);

async function drive(token, url, opts = {}) {
  const res = await fetch(String(url), {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) }
  });

  if (res.ok) return res;

  if (res.status === 401) {
    throw Object.assign(new Error('token_expired'), { status: 401, retryable: true });
  }

  // Read the real reason out of the body before deciding what happened.
  let reason = null;
  let detail = '';
  try {
    const body = await res.json();
    const first = body?.error?.errors?.[0];
    reason = first?.reason || body?.error?.status || null;
    detail = first?.message || body?.error?.message || '';
  } catch {
    detail = await res.text().catch(() => '');
  }

  const err = new Error(reason || `drive_${res.status}`);
  err.status = res.status;
  err.reason = reason;
  err.detail = detail;
  err.userMessage = REASON_MESSAGE[reason] || `Drive request failed (HTTP ${res.status}). ${detail}`.trim();
  err.retryable = RETRYABLE.has(reason) || res.status === 429 || res.status >= 500;

  console.error('[preptrack] Drive error', { status: res.status, reason, detail });
  throw err;
}

/** Returns { id, modifiedTime, size } or null when no state file exists yet. */
export async function findStateFile(token) {
  const url = new URL(`${DRIVE}/files`);
  url.searchParams.set('spaces', 'appDataFolder');
  url.searchParams.set('q', `name = '${SYNC_FILENAME}' and trashed = false`);
  url.searchParams.set('fields', 'files(id,name,modifiedTime,size)');
  url.searchParams.set('pageSize', '10');
  const { files } = await (await drive(token, url)).json();
  return files?.[0] ?? null;
}

export async function downloadState(token, fileId) {
  const res = await drive(token, `${DRIVE}/files/${fileId}?alt=media`);
  return res.json();
}

export async function readModifiedTime(token, fileId) {
  const res = await drive(token, `${DRIVE}/files/${fileId}?fields=modifiedTime`);
  return (await res.json()).modifiedTime;
}

function multipartBody(metadata, jsonText, boundary) {
  return [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    jsonText,
    `--${boundary}--`,
    ''
  ].join('\r\n');
}

/** Create when fileId is null, otherwise update in place. Returns { id, modifiedTime }. */
export async function uploadState(token, state, fileId = null) {
  const boundary = '----preptrack' + Math.random().toString(36).slice(2);
  const jsonText = JSON.stringify(state);

  const metadata = fileId
    ? { name: SYNC_FILENAME }
    : { name: SYNC_FILENAME, parents: ['appDataFolder'], mimeType: 'application/json' };

  const url = fileId
    ? `${UPLOAD}/files/${fileId}?uploadType=multipart&fields=id,modifiedTime`
    : `${UPLOAD}/files?uploadType=multipart&fields=id,modifiedTime`;

  const res = await drive(token, url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipartBody(metadata, jsonText, boundary)
  });
  return res.json();
}

/** Hard delete — appDataFolder files cannot be trashed. */
export async function deleteStateFile(token, fileId) {
  await drive(token, `${DRIVE}/files/${fileId}`, { method: 'DELETE' });
}
