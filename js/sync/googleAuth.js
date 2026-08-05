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
 *  - GIS's requestAccessToken() ALWAYS opens a popup, whatever `prompt` is set to,
 *    so it REQUIRES transient user activation. From a timer or at page load it is
 *    blocked; from a tap it opens a real Google dialog. Either way it is unusable
 *    for automatic renewal, and pretending otherwise is what made this app appear
 *    to demand a fresh sign-in on every launch.
 *
 * So the module has two clearly separated paths, and the separation is the point:
 *
 *   silentToken()   automatic. A hidden iframe against Google's auth endpoint with
 *                   prompt=none. Draws nothing, needs no gesture, cannot surprise
 *                   anyone. Used at startup, on a timer, on tab focus.
 *   acquireToken()  interactive. The GIS popup. Reachable ONLY from a button the
 *                   user pressed on purpose.
 *
 * Nothing automatic may ever call acquireToken(). That rule is enforced by a test.
 */

import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES, ALLOWED_USERS } from '../config.js';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const USERINFO = 'https://www.googleapis.com/oauth2/v3/userinfo';
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const IDENTITY_KEY = 'preptrack.identity';
const TOKEN_KEY = 'preptrack.token';

let tokenClient = null;
let accessToken = null;
let expiresAt = 0;
let loading = null;

/**
 * Where Google sends the silent-renewal iframe back to.
 *
 * Derived from the current path so it is correct on GitHub Pages
 * (/ibps-preptrack/), at a domain root, and from file:// alike. Whatever this
 * resolves to must be listed under "Authorised redirect URIs" on the OAuth
 * client, or Google refuses the request with redirect_uri_mismatch.
 */
export function redirectUri() {
  // Tolerates being imported outside a browser, and partial location shims.
  const origin = (typeof location !== 'undefined' && location?.origin) || '';
  const path = (typeof location !== 'undefined' && location?.pathname) || '/';
  if (!origin) return '';
  return origin + path.replace(/[^/]*$/, '') + 'oauth-callback.html';
}

/**
 * Convenience alias. Stable for the life of the page: hash routing never changes
 * location.pathname, so this cannot drift out from under an in-flight renewal.
 */
export const REDIRECT_URI = redirectUri();

/**
 * The access token is persisted, deliberately.
 *
 * Google issues a one-hour access token and NO refresh token to browser apps, and
 * the token used to live only in the module variable above — so it died on every
 * reload. Closing the tab and reopening it thirty seconds later left the app
 * unauthenticated, which is what made it feel as though it had signed you out.
 *
 * The trade-off is deliberate and small: the token grants drive.appdata (a hidden
 * folder only this app can see) plus the user's own name and email. It cannot
 * touch a single real file in their Drive. The app renders no untrusted HTML
 * anywhere — utils/dom.js has no innerHTML path — so there is no script-injection
 * route to read it back out, and the study data sitting beside it in localStorage
 * is the more valuable thing regardless.
 */
function persistToken() {
  try {
    if (accessToken) localStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken, expiresAt }));
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* private mode, storage full — sync simply falls back to renewing */ }
}

(function restoreToken() {
  try {
    const t = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    // Only adopt it with real life left, so we never present a token that is
    // about to expire mid-upload.
    if (t?.accessToken && Date.now() < Number(t.expiresAt) - 60_000) {
      accessToken = t.accessToken;
      expiresAt = Number(t.expiresAt);
    }
  } catch { /* ignore a corrupt entry */ }
})();

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

const TOKEN_TIMEOUT_MS = 60_000;

/**
 * Renew the token with NO interface at all, via a hidden iframe.
 *
 * WHY NOT tokenClient.requestAccessToken({ prompt: '' }) — this used to do exactly
 * that, on the belief that an empty prompt means "no UI". It does not. GIS's
 * requestAccessToken ALWAYS opens a popup window; prompt only controls whether the
 * account chooser and consent screen are drawn inside it. Two things followed, and
 * together they are the whole "it asks me to sign in every time" complaint:
 *
 *   - At startup there is no transient user activation (measured: isActive false,
 *     window.open blocked), so the popup was blocked outright and the app settled
 *     into a status telling the user to go and sync manually.
 *   - On their first tap there IS activation, so the very same call succeeded in
 *     opening a real Google popup — an auth prompt nobody asked for, on every
 *     reopen, triggered by tapping anything at all.
 *
 * This is the standard OIDC silent-renew instead. We point a hidden iframe at
 * Google's authorisation endpoint with prompt=none. If the user's Google session
 * is alive and the grant already exists, Google 302s straight to our callback page
 * with a token in the fragment and never draws a pixel. If it cannot, it redirects
 * with an error. Nothing is ever displayed, and no user gesture is required.
 *
 * Resolves to a token, or null. It never rejects and never shows anything, so it
 * is safe to call at startup, on a timer, or from any gesture.
 */
let renewing = null;

export function silentToken({ timeoutMs = 12_000 } = {}) {
  if (hasFreshToken()) return Promise.resolve(accessToken);
  if (!hasSignedInBefore()) return Promise.resolve(null);
  // Startup, the visibility handler and the auto-sync timer can all ask at once.
  // One iframe, one answer, shared by every caller.
  if (renewing) return renewing;

  renewing = new Promise(resolve => {
    const nonce = `pt${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('tabindex', '-1');
    frame.setAttribute('title', 'Google silent sign-in');
    frame.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;border:0;visibility:hidden';

    let settled = false;
    const done = value => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove();
      renewing = null;
      resolve(value);
    };

    const timer = setTimeout(() => {
      // The commonest cause by far is the redirect URI not being registered, and
      // that is invisible from here because the error page is cross-origin.
      console.warn(
        '[preptrack] silent token renewal timed out. If this is persistent, add\n  ' +
        REDIRECT_URI + '\nto "Authorised redirect URIs" on the OAuth client in Google Cloud Console.'
      );
      done(null);
    }, timeoutMs);

    function onMessage(e) {
      if (e.origin !== location.origin) return;
      if (e.source !== frame.contentWindow) return;
      const d = e.data;
      if (!d || d.source !== 'preptrack-oauth' || d.state !== nonce) return;
      if (!d.access_token) return done(null);
      accessToken = d.access_token;
      expiresAt = Date.now() + Number(d.expires_in || 3600) * 1000;
      persistToken();
      done(accessToken);
    }
    window.addEventListener('message', onMessage);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'token',
      scope: GOOGLE_SCOPES,
      prompt: 'none',
      state: nonce,
      include_granted_scopes: 'true'
    });
    // Naming the account stops Google having to choose between several signed-in
    // sessions — which it refuses to do under prompt=none.
    const email = getIdentity()?.email;
    if (email) params.set('login_hint', email);

    frame.src = `${AUTH_ENDPOINT}?${params.toString()}`;
    document.body.appendChild(frame);
  });

  return renewing;
}

/**
 * Acquire an access token INTERACTIVELY. This is the only function in the app that
 * can open a Google popup, and it must only ever be reached from a button the user
 * deliberately pressed — "Continue with Google" or "Sync now".
 *
 * MUST be called synchronously inside a user gesture, or the popup is blocked and
 * this rejects with 'popup_failed_to_open'. Returns the cached token when it is
 * still fresh, so most calls cost nothing.
 */
export function acquireToken() {
  if (hasFreshToken()) return Promise.resolve(accessToken);
  if (!tokenClient) return Promise.reject(new Error('auth_unavailable'));

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = fn => (...args) => { if (!settled) { settled = true; clearTimeout(timer); fn(...args); } };
    const ok = finish(resolve);
    const bad = finish(reject);

    /**
     * Hard timeout. Chrome's Cross-Origin-Opener-Policy can stop GIS from ever
     * observing that its popup closed, in which case neither callback fires and
     * this promise hangs forever — which used to wedge the whole sync engine at
     * "Syncing…" permanently, because the in-flight promise never settled.
     */
    const timer = setTimeout(() => bad(new Error('auth_timeout')), TOKEN_TIMEOUT_MS);

    tokenClient.callback = resp => {
      if (resp.error) return bad(new Error(resp.error));
      accessToken = resp.access_token;
      expiresAt = Date.now() + Number(resp.expires_in || 3600) * 1000;
      persistToken();
      ok(accessToken);
    };
    tokenClient.error_callback = err => bad(new Error(err?.type || 'popup_closed'));

    try {
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      bad(err);
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
  persistToken();   // writes through to localStorage, clearing the stored copy
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
