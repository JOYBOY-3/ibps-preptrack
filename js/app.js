/**
 * PrepTrack — bootstrap, hash router, view mounting.
 *
 * Hash routing (not history API) so it works from file://, from any static host,
 * and from GitHub Pages sub-paths with no server configuration.
 */

import { el, mount, $ } from './utils/dom.js';
import { applyTheme, toast } from './utils/ui.js';
import { icon } from './components/icons.js';
import { getState, subscribe } from './state/store.js';
import { requestPersistence } from './state/persist.js';
import { currentDayNumber, needsBackupWarning } from './state/selectors.js';
import { todayView, setViewedDay } from './views/today.js';
import { planView } from './views/plan.js';
import { progressView } from './views/progress.js';
import { settingsView } from './views/settings.js';
import { gateView } from './views/gate.js';
import { hasSignedInBefore, initAuth } from './sync/googleAuth.js';
import { initSyncListeners, markDirty, syncOnGesture, isConnected } from './sync/syncEngine.js';

const ROUTES = [
  { id: 'today',    path: '#/today',    label: 'Today',    icon: 'today',    render: todayView },
  { id: 'week',     path: '#/week',     label: 'Week',     icon: 'week',     render: weekPlaceholder },
  { id: 'plan',     path: '#/plan',     label: 'Plan',     icon: 'plan',     render: planView },
  { id: 'progress', path: '#/progress', label: 'Progress', icon: 'progress', render: progressView },
  { id: 'settings', path: '#/settings', label: 'Settings', icon: 'settings', render: settingsView }
];

function weekPlaceholder() {
  return el('div.view', {}, [
    el('div.section-head', {}, [el('h1', { text: 'Week' })]),
    el('div.placeholder', {}, [
      icon('week'),
      el('div', {}, [
        el('strong', { text: 'The week table arrives in M2.' }),
        el('div.muted', { style: 'margin-top:4px',
          text: 'Seven days across four subjects — a table on desktop, stacked cards on phones. ' +
                'Use Plan in the meantime; every day is already there.' })
      ]),
      el('a.btn.btn--primary', { href: '#/plan' }, ['Open the full plan'])
    ])
  ]);
}

// ---------------------------------------------------------------- router
function parseHash() {
  const hash = location.hash || '#/today';
  const [, section, param] = hash.split('/');
  const route = ROUTES.find(r => r.id === section) || ROUTES[0];
  return { route, param: param ? Number(param) : null };
}

function renderNav(activeId) {
  return el('nav.app-nav', { 'aria-label': 'Main' },
    ROUTES.map(r => el('a.nav-item', {
      href: r.path,
      'aria-current': r.id === activeId ? 'page' : null
    }, [icon(r.icon), el('span', { text: r.label })])));
}

let currentRouteId = null;

function render() {
  const { route, param } = parseHash();
  currentRouteId = route.id;

  if (route.id === 'today') setViewedDay(param && param >= 1 && param <= 147 ? param : null);

  const main = $('#main');
  const scrollTop = main.scrollTop;
  mount(main, route.render());

  // Refresh nav highlighting
  const nav = $('.app-nav');
  if (nav) nav.replaceWith(renderNav(route.id));

  // Auto-scroll to the first incomplete block — starting costs zero taps.
  if (route.id === 'today') {
    requestAnimationFrame(() => {
      const next = main.querySelector('.block-card.is-next');
      if (next && window.scrollY < 40) {
        const top = next.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    });
  } else {
    main.scrollTop = scrollTop;
  }
}

// ---------------------------------------------------------------- boot
function boot() {
  const state = getState();
  applyTheme(state.settings.theme || 'auto');

  // Gate on FIRST use only. After one successful sign-in the identity is cached,
  // so every later launch opens instantly — with or without a network.
  if (!hasSignedInBefore()) {
    mount(document.body, gateView(() => {
      document.body.replaceChildren();
      bootApp();
    }));
    return;
  }
  bootApp();
}

function bootApp() {
  const state = getState();
  const app = el('div.app', {}, [
    el('header.app-header', {}, [
      el('a.app-brand', { href: '#/today', style: 'text-decoration:none;color:inherit' }, [
        el('span.app-brand__mark', { text: 'PT' }),
        el('span', {}, [
          'PrepTrack',
          el('span.app-brand__sub', { text: '  IBPS Clerk 2026' })
        ])
      ]),
      el('div.header-actions', {}, [
        el('a.icon-btn', { href: '#/settings', 'aria-label': 'Settings' }, [icon('settings')])
      ])
    ]),
    renderNav('today'),
    el('main#main.app-main', { tabindex: '-1' })
  ]);

  document.body.prepend(el('a.skip-link', { href: '#main', text: 'Skip to content' }));
  document.body.append(app);

  render();
  window.addEventListener('hashchange', render);
  subscribe(() => { render(); markDirty(); });

  // Sync opportunistically on real taps. The Google popup requires transient user
  // activation, so a gesture is the only moment we can legally mint a fresh token.
  document.addEventListener('pointerup', syncOnGesture, { passive: true });
  initSyncListeners();
  initAuth();

  // Backup nudge — only when sync is NOT carrying the safety net.
  if (!isConnected() && needsBackupWarning(state)) {
    setTimeout(() => toast('No recent backup — export from Settings', 'danger'), 1500);
  }

  requestPersistence();

  window.addEventListener('preptrack:save-failed', () => {
    toast('Could not save — storage may be full or blocked', 'danger');
  });

  // Re-render at midnight so "today" stays correct in a long-lived tab.
  const msToMidnight = new Date().setHours(24, 0, 5, 0) - Date.now();
  setTimeout(() => { if (currentRouteId === 'today') render(); }, msToMidnight);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline support is optional */ });
  }

  console.info(`[PrepTrack] Day ${currentDayNumber()} of 147`);
}

boot();
