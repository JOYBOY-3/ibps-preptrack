/**
 * Google authentication via Google Identity Services (GIS) token model.
 *
 * Why this flow and not PKCE: Google's token endpoint rejects an authorization-code
 * exchange from a "Web application" client without a client_secret, and a browser app
 * must never hold a secret. So the auth-code + PKCE route that works with most
 * providers is simply not available here. The GIS token client is Google's
 * documented, supported path for a browser-only app with no backend.
 *
 * Consequences we design around:
 *  - Access tokens live 1 hour. There are NO refresh tokens in this flow.
 *  - GIS deliberately removed silent auto-refresh, and it has no hidden-iframe path.
 *  - requestAccessToken() opens a real popup, so it REQUIRES transient user
 *    activation. Called from a timer or on page load it will be blocked.
 *    Every call site here must sit inside a click/tap handler.
 *  - In practice the popup auto-closes in well under a second when the user is
 *    already signed in and has granted consent — a brief flash, no interaction.
 */

import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES, ALLOWED_USERS } from '../config.js';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const USERINFO = 'https://www.googleapis.com/oauth2/v3/userinfo';
const IDENTITY_KEY = 'preptrack.identity';

let tokenClient = null;
let accessToken = null;
let expiresAt = 0;
let loading = null;

/** Cached identity survives reloads and offline launches. */
export function getIdentity() {
  try { return JSON.parse(localStorage.getItem(IDENTITY_KEY) || 'null'); }
  catch { return null; }
}

function setIdentity(id) {
  if (id) localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
  else localStorage.removeItem(IDENTITY_KEY);
}

/** True once the user has completed a real sign-in on this device, ever. */
export function hasSignedInBefore() {
  return Boolean(getIdentity());
}

/**
 * Load the GIS script. Resolves false when offline or blocked — never throws,
 * because an offline launch must still open the app for a returning user.
 */
export function initAuth() {
  if (tokenClient) return Promise.resolve(true);
  if (loading) return loading;

  loading = new Promise(resolve => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('REPLACE')) {
      console.warn('[preptrack] No Google Client ID configured — sync disabled.');
      return resolve(false);
    }
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    const script = existing || document.createElement('script');

    const ready = () => {
      if (!window.google?.accounts?.oauth2) return resolve(false);
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        prompt: '',            // consent on first grant only — never select_account
        callback: () => {}     // replaced per request
      });
      resolve(true);
    };

    if (existing && window.google?.accounts?.oauth2) return ready();
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = ready;
    script.onerror = () => resolve(false);
    if (!existing) document.head.appendChild(script);
  });

  return loading;
}

export function hasFreshToken() {
  return Boolean(accessToken) && Date.now() < expiresAt - 60_000;
}

export function getToken() {
  return hasFreshToken() ? accessToken : null;
}

/**
 * Acquire an access token.
 *
 * MUST be called synchronously inside a user gesture, or the popup is blocked and
 * this rejects with 'popup_failed_to_open'. Returns the cached token when it is
 * still fresh, so most calls cost nothing.
 */
export function acquireToken() {
  if (hasFreshToken()) return Promise.resolve(accessToken);
  if (!tokenClient) return Promise.reject(new Error('auth_unavailable'));

  return new Promise((resolve, reject) => {
    tokenClient.callback = resp => {
      if (resp.error) return reject(new Error(resp.error));
      accessToken = resp.access_token;
      expiresAt = Date.now() + Number(resp.expires_in || 3600) * 1000;
      resolve(accessToken);
    };
    tokenClient.error_callback = err => reject(new Error(err?.type || 'popup_closed'));
    try {
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
}

/** Fetch and cache the signed-in user's identity. Requires the email/profile scopes. */
export async function fetchIdentity(token) {
  const res = await fetch(USERINFO, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`userinfo_${res.status}`);
  const me = await res.json();
  const identity = {
    email: me.email || null,
    name: me.name || me.given_name || null,
    picture: me.picture || null,
    signedInAt: new Date().toISOString()
  };
  setIdentity(identity);
  return identity;
}

export function isAllowed(email) {
  if (!ALLOWED_USERS.length) return true;
  return ALLOWED_USERS.map(e => e.toLowerCase()).includes(String(email || '').toLowerCase());
}

/**
 * Full interactive sign-in. Call from a click handler.
 * Returns the identity, or throws with a machine-readable message.
 */
export async function signIn() {
  const ok = await initAuth();
  if (!ok) throw new Error('auth_unavailable');

  const token = await acquireToken();
  const identity = await fetchIdentity(token);

  if (!isAllowed(identity.email)) {
    setIdentity(null);
    forgetToken();
    throw new Error('not_allowed');
  }
  return identity;
}

export function forgetToken() {
  accessToken = null;
  expiresAt = 0;
}

/** Revoke the grant with Google and clear the cached identity. */
export function signOut() {
  if (accessToken && window.google?.accounts?.oauth2) {
    try { google.accounts.oauth2.revoke(accessToken, () => {}); } catch { /* best effort */ }
  }
  forgetToken();
  setIdentity(null);
}

/** Human-readable explanation for each failure mode the UI may surface. */
export const AUTH_ERRORS = {
  auth_unavailable: 'Could not reach Google. Check your connection and try again.',
  popup_failed_to_open: 'Your browser blocked the sign-in popup. Allow popups for this site and retry.',
  popup_closed: 'Sign-in was cancelled.',
  access_denied: 'Access was not granted. PrepTrack needs its own hidden Drive folder to sync.',
  not_allowed: 'That Google account is not on the allowed list for this app.',
  idpiframe_initialization_failed: 'Third-party cookies are blocked, which Google sign-in needs.'
};

export function explainAuthError(err) {
  const key = String(err?.message || err || '');
  return AUTH_ERRORS[key] || `Sign-in failed (${key}). Please try again.`;
}
