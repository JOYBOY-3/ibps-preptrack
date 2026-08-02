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

async function drive(token, url, opts = {}) {
  const res = await fetch(String(url), {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) }
  });

  if (res.status === 401) {
    throw Object.assign(new Error('token_expired'), { status: 401, retryable: true });
  }
  if (res.status === 403 || res.status === 429) {
    throw Object.assign(new Error('rate_limited'), { status: res.status, retryable: true });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw Object.assign(new Error(`drive_${res.status}`), { status: res.status, body });
  }
  return res;
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
