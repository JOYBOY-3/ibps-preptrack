/**
 * Settings — iOS-style grouped inset lists.
 *
 * Google Drive is the story. localStorage still exists underneath as the offline
 * cache (without it the app could not open on a train), but the user is never asked
 * to manage it and is never nagged about backups. Export/import survive under
 * Advanced as an escape hatch, not as a chore.
 */

import { el } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { getState, replaceState } from '../state/store.js';
import { setTheme } from '../state/actions.js';
import { exportJSON, importJSON, clearAll, freshState, storageBytes } from '../state/persist.js';
import { completedDayCount, totalQuestions } from '../state/selectors.js';
import { applyTheme, toast } from '../utils/ui.js';
import { getIdentity, signOut, signIn, explainAuthError } from '../sync/googleAuth.js';
import { sync, getSyncStatus, isConnected, connect, disconnectSync } from '../sync/syncEngine.js';

function group(title, rows, footnote) {
  return el('section.ios-section', {}, [
    title ? el('h2.ios-section__title', { text: title }) : null,
    el('div.ios-group', {}, rows.filter(Boolean)),
    footnote ? el('p.ios-section__note', { text: footnote }) : null
  ]);
}

function row(label, desc, control, mod = '') {
  return el(`div.ios-row${mod}`, {}, [
    el('div.ios-row__text', {}, [
      el('div.ios-row__label', { text: label }),
      desc ? el('div.ios-row__desc', { text: desc }) : null
    ]),
    control ? el('div.ios-row__control', {}, [control]) : null
  ]);
}

const STATUS_META = {
  synced:       ['good',   'Up to date'],
  syncing:      ['accent', 'Syncing…'],
  offline:      ['warn',   'Offline'],
  pending:      ['warn',   'Waiting'],
  error:        ['danger', 'Problem'],
  disconnected: ['',       'Not connected'],
  idle:         ['',       'Idle']
};

export function settingsView() {
  const state = getState();
  const identity = getIdentity();
  const st = getSyncStatus();
  const connected = isConnected();
  const [tone, label] = STATUS_META[st.state] || STATUS_META.idle;

  // ---------------------------------------------------------------- sync
  const syncHero = el('div.sync-hero', {}, [
    el('div.sync-hero__top', {}, [
      el('div.sync-hero__avatar', {}, [
        identity?.picture
          ? el('img', { src: identity.picture, alt: '', referrerpolicy: 'no-referrer' })
          : el('span', { text: (identity?.name || identity?.email || '?').slice(0, 1).toUpperCase() })
      ]),
      el('div.sync-hero__who', {}, [
        el('div.sync-hero__name', { text: identity?.name || 'Signed in' }),
        identity?.email ? el('div.sync-hero__mail', { text: identity.email }) : null
      ]),
      el(`span.status-pill${tone ? '.status-pill--' + tone : ''}`, {}, [
        el('span.status-pill__dot'),
        el('span', { text: label })
      ])
    ]),
    el('p.sync-hero__msg', {
      text: st.message ||
        'Everything you tick is saved to a private folder in your Google Drive and follows you to every device.'
    }),
    el('div.sync-hero__actions', {}, [
      connected
        ? el('button.btn.btn--primary', {
            type: 'button',
            onclick: async () => {
              const r = await sync({ interactive: true });
              toast(r ? 'Synced' : (getSyncStatus().message || 'Sync did not complete'), r ? '' : 'danger');
            }
          }, [icon('refresh'), 'Sync now'])
        : el('button.btn.btn--primary', {
            type: 'button',
            onclick: async () => {
              try { await signIn(); await connect(); toast('Connected to Google Drive'); }
              catch (err) { toast(explainAuthError(err), 'danger'); }
            }
          }, [icon('upload'), 'Connect Google Drive'])
    ])
  ]);

  // ---------------------------------------------------------------- theme
  const themeSeg = el('div.seg', { role: 'group', 'aria-label': 'Theme' },
    ['auto', 'light', 'dark'].map(t => el('button', {
      type: 'button',
      'aria-pressed': state.settings.theme === t ? 'true' : 'false',
      onclick: () => { setTheme(t); applyTheme(t); },
      text: t[0].toUpperCase() + t.slice(1)
    })));

  // ---------------------------------------------------------------- advanced
  const fileInput = el('input', {
    type: 'file', accept: 'application/json', class: 'sr-only', id: 'import-file',
    onchange: async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const next = await importJSON(file);
        if (!confirm('Replace all current progress with this file? This cannot be undone.')) return;
        replaceState(next);
        toast('Progress restored');
      } catch (err) { toast(err.message, 'danger'); }
      finally { e.target.value = ''; }
    }
  });

  const advanced = el('details.ios-advanced', {}, [
    el('summary', {}, [el('span', { text: 'Advanced' }), icon('plan')]),
    el('div.ios-group', {}, [
      row('Download a copy', 'A JSON file of everything, in case you ever want it outside Drive.',
        el('button.btn.btn--sm', { type: 'button', onclick: () => { exportJSON(getState()); toast('Downloaded'); } },
          [icon('download'), 'Export'])),
      row('Restore from a file', 'Replaces everything currently on this device.',
        el('div', {}, [fileInput,
          el('button.btn.btn--sm', { type: 'button', onclick: () => document.getElementById('import-file').click() },
            [icon('upload'), 'Import'])])),
      row('Reset this device', 'Clears local progress. Drive is untouched until the next sync.',
        el('button.btn.btn--sm.btn--danger', {
          type: 'button',
          onclick: () => {
            if (!confirm('Clear all progress on this device?')) return;
            if (!confirm('Really sure? This cannot be undone.')) return;
            clearAll(); replaceState(freshState()); toast('Cleared');
          }
        }, ['Reset']))
    ])
  ]);

  // ---------------------------------------------------------------- account
  const accountRows = [
    connected
      ? row('Stop syncing', 'Keeps everything on this device, stops writing to Drive.',
          el('button.btn.btn--sm', {
            type: 'button',
            onclick: () => {
              if (!confirm('Stop syncing to Google Drive?')) return;
              disconnectSync(); toast('Sync stopped');
            }
          }, ['Disconnect']))
      : null,
    identity
      ? row('Sign out', 'You will need to sign in again to use PrepTrack here.',
          el('button.btn.btn--sm.btn--danger', {
            type: 'button',
            onclick: () => {
              if (!confirm('Sign out of PrepTrack?')) return;
              disconnectSync(); signOut(); location.reload();
            }
          }, ['Sign out']))
      : null
  ];

  return el('div.view', {}, [
    el('div.section-head', {}, [el('h1', { text: 'Settings' })]),

    el('section.ios-section', {}, [
      el('h2.ios-section__title', { text: 'Google Drive' }),
      el('div.ios-group.ios-group--hero', {}, [syncHero])
    ]),

    group('Appearance', [
      row('Theme', 'Auto follows your device.', themeSeg)
    ]),

    group('This device', [
      row('Days completed', null, el('span.ios-value', { text: String(completedDayCount(state)) })),
      row('Questions solved', null, el('span.ios-value', { text: String(totalQuestions(state)) })),
      row('Cached offline', null, el('span.ios-value', { text: `${(storageBytes() / 1024).toFixed(0)} KB` }))
    ], 'A copy is kept on this device so PrepTrack opens instantly and works with no signal.'),

    accountRows.some(Boolean) ? group('Account', accountRows) : null,

    advanced
  ]);
}
