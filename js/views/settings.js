/** Settings — theme, backup, restore, reset. Backup is a v1 feature by design. */

import { el } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { getState, replaceState } from '../state/store.js';
import { setTheme, markBackedUp } from '../state/actions.js';
import { exportJSON, importJSON, clearAll, freshState, storageBytes } from '../state/persist.js';
import { daysSinceBackup, completedDayCount, totalQuestions } from '../state/selectors.js';
import { applyTheme, toast } from '../utils/ui.js';
import { getIdentity, signOut, signIn, explainAuthError } from '../sync/googleAuth.js';
import { sync, getSyncStatus, isConnected, connect, disconnectSync } from '../sync/syncEngine.js';

function row(title, desc, control) {
  return el('div.setting-row', {}, [
    el('div.setting-row__text', {}, [
      el('div.setting-row__title', { text: title }),
      el('div.setting-row__desc', { text: desc })
    ]),
    control
  ]);
}

export function settingsView() {
  const state = getState();
  const since = daysSinceBackup(state);
  const kb = (storageBytes() / 1024).toFixed(1);

  const themeSeg = el('div.seg', { role: 'group', 'aria-label': 'Theme' },
    ['auto', 'light', 'dark'].map(t => el('button', {
      type: 'button',
      'aria-pressed': state.settings.theme === t ? 'true' : 'false',
      onclick: () => { setTheme(t); applyTheme(t); },
      text: t[0].toUpperCase() + t.slice(1)
    })));

  const fileInput = el('input', {
    type: 'file', accept: 'application/json', class: 'sr-only', id: 'import-file',
    onchange: async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const next = await importJSON(file);
        if (!confirm('Replace all current progress with this backup? This cannot be undone.')) return;
        replaceState(next);
        toast('Backup restored');
      } catch (err) {
        toast(err.message, 'danger');
      } finally {
        e.target.value = '';
      }
    }
  });

  const backupBanner = (since === null || since >= 7)
    ? el('div.banner.banner--warn', {}, [icon('alert', 'banner__icon'), el('div', {}, [
        el('strong', { text: since === null ? 'You have never backed up. ' : `Last backup ${since} days ago. ` }),
        'localStorage is wiped by clearing browsing data. Export now — it takes one tap.'
      ])])
    : null;

  // ---------------------------------------------------------------- sync card
  const identity = getIdentity();
  const st = getSyncStatus();
  const connected = isConnected();

  const STATUS_CHIP = {
    synced: ['chip--good', 'Synced'],
    syncing: ['chip--accent', 'Syncing…'],
    offline: ['chip--warn', 'Offline'],
    pending: ['chip--warn', 'Pending'],
    error: ['chip--danger', 'Error'],
    disconnected: ['chip', 'Not connected'],
    idle: ['chip', 'Idle']
  };
  const [chipClass, chipText] = STATUS_CHIP[st.state] || STATUS_CHIP.idle;

  const syncCard = el('section.card', {}, [
    el('div.card__body', {}, [
      el('div.section-head', {}, [
        el('span.eyebrow', { text: 'Google Drive sync' }),
        el(`span.${chipClass.startsWith('chip') ? chipClass : 'chip'}`, { text: chipText })
      ]),
      identity
        ? el('div.identity', { style: 'margin-top:var(--sp-3)' }, [
            el('div', {}, [
              el('div.setting-row__title', { text: identity.name || identity.email || 'Signed in' }),
              identity.email && identity.name
                ? el('div.setting-row__desc', { text: identity.email })
                : null
            ])
          ])
        : null,
      el('p.setting-row__desc', { style: 'margin-top:var(--sp-2)', text: st.message ||
          'Your progress is stored in a hidden folder in your own Google Drive that only this app can see.' }),
      el('div', { style: 'display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-top:var(--sp-4)' }, [
        connected
          ? el('button.btn.btn--primary', {
              type: 'button',
              onclick: async () => {
                const r = await sync({ interactive: true });
                toast(r ? 'Synced to Google Drive' : (getSyncStatus().message || 'Sync did not complete'),
                      r ? '' : 'danger');
              }
            }, [icon('refresh'), 'Sync now'])
          : el('button.btn.btn--primary', {
              type: 'button',
              onclick: async () => {
                try { await signIn(); await connect(); toast('Connected to Google Drive'); }
                catch (err) { toast(explainAuthError(err), 'danger'); }
              }
            }, [icon('upload'), 'Connect Google Drive']),
        connected
          ? el('button.btn', {
              type: 'button',
              onclick: () => {
                if (!confirm('Stop syncing to Google Drive? Your data stays on this device.')) return;
                disconnectSync();
                toast('Sync disconnected');
              }
            }, ['Disconnect'])
          : null,
        identity
          ? el('button.btn.btn--danger', {
              type: 'button',
              onclick: () => {
                if (!confirm('Sign out? You will need to sign in again to use PrepTrack on this device.')) return;
                disconnectSync();
                signOut();
                location.reload();
              }
            }, ['Sign out'])
          : null
      ])
    ])
  ]);

  return el('div.view', {}, [
    el('div.section-head', {}, [el('h1', { text: 'Settings' })]),
    backupBanner,
    syncCard,

    el('section.card', {}, [
      row('Theme', 'Auto follows your device. Manual overrides it in both directions.', themeSeg),

      row('Export backup',
        'Downloads a JSON file with every day, topic, mock and error. Keep it somewhere safe.',
        el('button.btn.btn--primary', {
          type: 'button',
          onclick: () => { exportJSON(getState()); markBackedUp(); toast('Backup downloaded'); }
        }, [icon('download'), 'Export'])),

      row('Restore from backup',
        'Replaces all current progress with the contents of a backup file.',
        el('div', {}, [
          fileInput,
          el('button.btn', {
            type: 'button',
            onclick: () => document.getElementById('import-file').click()
          }, [icon('upload'), 'Import'])
        ])),

      row('Reset everything',
        'Deletes all progress permanently. The curriculum itself is untouched.',
        el('button.btn.btn--danger', {
          type: 'button',
          onclick: () => {
            if (!confirm('Delete ALL progress? This cannot be undone.')) return;
            if (!confirm('Really sure? Export a backup first if you have any doubt.')) return;
            clearAll();
            replaceState(freshState());
            toast('All progress cleared');
          }
        }, [icon('refresh'), 'Reset']))
    ]),

    el('section.card', {}, [
      el('div.card__body', {}, [
        el('span.eyebrow', { text: 'Storage' }),
        el('div.stat-grid', { style: 'margin-top:var(--sp-3)' }, [
          el('div.stat', {}, [
            el('span.stat-value', { text: `${kb} KB` }),
            el('span.stat-label', { text: 'used of ~5 MB' })
          ]),
          el('div.stat', {}, [
            el('span.stat-value', { text: String(completedDayCount(state)) }),
            el('span.stat-label', { text: 'days complete' })
          ]),
          el('div.stat', {}, [
            el('span.stat-value', { text: String(totalQuestions(state)) }),
            el('span.stat-label', { text: 'questions solved' })
          ]),
          el('div.stat', {}, [
            el('span.stat-value', { text: since === null ? '—' : `${since}d` }),
            el('span.stat-label', { text: 'since backup' })
          ])
        ])
      ])
    ]),

    el('p.muted', { style: 'font-size:var(--step--1);line-height:1.6',
      text: 'PrepTrack stores everything in this browser only. Nothing is uploaded anywhere. ' +
            'That means it works offline — and it also means an export is your only safety net.' })
  ]);
}
