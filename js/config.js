/**
 * App configuration.
 *
 * The Google OAuth Client ID is PUBLIC by design — it ships inside the JavaScript
 * of every site that offers Google sign-in. It is an identifier, not a credential.
 * The client SECRET is a credential; it must never appear in this file or any other
 * file served to a browser. A browser app does not need one and cannot use one safely.
 */

export const GOOGLE_CLIENT_ID =
  '498764040979-tdv4kmabcfda966t9fg1mh6sstbmquei.apps.googleusercontent.com';

/**
 * Scopes requested at sign-in. All three are classified NON-SENSITIVE by Google,
 * so this app needs no verification review, shows no "unverified app" warning,
 * and has no user cap.
 *
 * drive.appdata — a hidden folder in the user's own Drive that ONLY this app can
 *   see. It cannot read, list or touch any real file in their Drive. Widening this
 *   to `drive` or `drive.readonly` would make the app RESTRICTED and require a paid
 *   third-party security assessment. Never do that.
 * email, profile — used only to show who is signed in and to enforce ALLOWED_USERS.
 */
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  // Fully-qualified rather than the `email` / `profile` aliases — the aliases are
  // accepted in most flows but the canonical URLs are unambiguous everywhere.
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

/**
 * Optional allowlist. Leave EMPTY to let any Google account sign in.
 *
 * Honest note on what this does and does not do: every user's data lives in their
 * OWN Drive appDataFolder, so there is no shared store and nothing to leak between
 * users. This list is a front-door courtesy, not a security boundary — it runs in
 * the browser and a determined person could bypass it. It exists so the app stays
 * a small private tool, which is all it needs to be.
 */
export const ALLOWED_USERS = [
  // 'raveeshr503@gmail.com',
];

/** Name of the single JSON file kept in the user's appDataFolder. */
export const SYNC_FILENAME = 'preptrack-state.json';

/** Debounce before a change is pushed to Drive, in milliseconds. */
export const SYNC_DEBOUNCE_MS = 4000;
