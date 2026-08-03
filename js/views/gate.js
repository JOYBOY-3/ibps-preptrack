/**
 * Sign-in gate.
 *
 * Shown only when this device has never completed a sign-in. Once signed in, the
 * identity is cached and the app opens instantly on every later launch — including
 * with no network at all. Requiring a live auth check at 6 a.m. on a train would
 * turn the app into a brick exactly when it is needed, so we don't.
 */

import { el } from '../utils/dom.js';
import { PLAN_LABEL } from '../data/phases.js';
import { icon } from '../components/icons.js';
import { signIn, explainAuthError, initAuth } from '../sync/googleAuth.js';
import { connect } from '../sync/syncEngine.js';

const GOOGLE_G = `<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
<path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
<path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
<path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
</svg>`;

function googleButton(label, onclick) {
  const btn = el('button.btn.btn--google', { type: 'button', onclick });
  const g = el('span.btn__g');
  g.innerHTML = GOOGLE_G;
  btn.append(g, document.createTextNode(label));
  return btn;
}

export function gateView(onSignedIn) {
  const statusLine = el('p.gate__status', { role: 'status' });
  let busy = false;

  const button = googleButton('Continue with Google', async () => {
    if (busy) return;
    busy = true;
    button.disabled = true;
    statusLine.className = 'gate__status';
    statusLine.textContent = 'Opening Google sign-in…';

    try {
      const identity = await signIn();
      statusLine.textContent = 'Connecting your Drive…';
      // connect() runs inside this same gesture, so the token is still valid.
      await connect();
      onSignedIn(identity);
    } catch (err) {
      statusLine.className = 'gate__status is-error';
      statusLine.textContent = explainAuthError(err);
      button.disabled = false;
      busy = false;
    }
  });

  initAuth();  // warm the GIS script while the user reads

  return el('div.gate', {}, [
    el('div.gate__card', {}, [
      el('div.gate__mark', { text: 'PT' }),
      el('h1.gate__title', { text: 'PrepTrack' }),
      el('p.gate__sub', { text: `IBPS Clerk 2026 · ${PLAN_LABEL}` }),

      el('div.gate__points', {}, [
        el('div.gate__point', {}, [
          icon('check'),
          el('span', { text: 'Your progress syncs across every device you sign into' })
        ]),
        el('div.gate__point', {}, [
          icon('check'),
          el('span', { text: 'Stored in a hidden folder in your own Google Drive' })
        ]),
        el('div.gate__point', {}, [
          icon('check'),
          el('span', { text: 'Works fully offline after this first sign-in' })
        ])
      ]),

      button,
      statusLine,

      el('p.gate__fine', {
        text: 'PrepTrack can only see the private folder it creates for itself. ' +
              'It cannot read, list or touch any other file in your Drive. ' +
              'There is no server — nothing is sent anywhere except your own Drive.'
      })
    ])
  ]);
}
