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
import { currentDayNumber } from './state/selectors.js';
import { KEY_DATES } from './data/phases.js';
import { todayView, setViewedDay } from './views/today.js';
import { planView } from './views/plan.js';
import { progressView } from './views/progress.js';
import { settingsView } from './views/settings.js';
import { weekView } from './views/week.js';
import { mocksView } from './views/mocks.js';
import { gateView } from './views/gate.js';
import { guideView } from './views/guide.js';
import { syllabusView } from './views/syllabus.js';
import { hasSignedInBefore, initAuth } from './sync/googleAuth.js';
import { initSyncListeners, markDirty, syncOnGesture, onSyncStatus } from './sync/syncEngine.js';
import { advanceStaleRevisions, scheduleExamSweep } from './state/actions.js';

export const BUILD = 'v20';

const ROUTES = [
  { id: 'today',    path: '#/today',    label: 'Today',    icon: 'today',    render: todayView },
  { id: 'week',     path: '#/week',     label: 'Week',     icon: 'week',     render: weekView },
  { id: 'plan',     path: '#/plan',     label: 'Plan',     icon: 'plan',     render: planView },
  { id: 'mocks',    path: '#/mocks',    label: 'Mocks',    icon: 'trophy',   render: mocksView },
  { id: 'progress', path: '#/progress', label: 'Progress', icon: 'progress', render: progressView },
  { id: 'settings', path: '#/settings', label: 'Settings', icon: 'settings', render: settingsView }
];

/**
 * Routes that are NOT in the bottom bar.
 *
 * That bar is a six-column grid of the places you go daily. The guide is read
 * once or twice, and cramping six daily destinations to make room for it would be
 * a bad trade. It is reachable from the header, from Settings and from the gate.
 */
const EXTRA_ROUTES = [
  { id: 'syllabus', path: '#/syllabus', label: 'Syllabus', icon: 'checklist', render: syllabusView },
  { id: 'guide',    path: '#/guide',    label: 'How to use this', icon: 'book', render: guideView }
];

const ALL_ROUTES = [...ROUTES, ...EXTRA_ROUTES];

// ---------------------------------------------------------------- router
function parseHash() {
  const hash = location.hash || '#/today';
  const [, section, param] = hash.split('/');
  const route = ALL_ROUTES.find(r => r.id === section) || ROUTES[0];
  return { route, param: param ? Number(param) : null };
}

function renderNav(activeId) {
  return el('nav.app-nav', { 'aria-label': 'Main' },
    ROUTES.map(r => el('a.nav-item', {
      href: r.path,
      title: r.label,
      'aria-current': r.id === activeId ? 'page' : null
    }, [icon(r.icon), el('span.nav-label', { text: r.label })])));
}

/* Sidebar collapse. Desktop only — phones keep the bottom bar. The choice is
   remembered, because a layout preference that resets every launch is noise. */
const NAV_KEY = 'preptrack.navMode';

function applyNavMode(mode) {
  const app = document.querySelector('.app');
  if (app) app.dataset.nav = mode;
  const btn = document.querySelector('.nav-toggle');
  if (btn) {
    btn.setAttribute('aria-expanded', mode === 'full' ? 'true' : 'false');
    btn.setAttribute('aria-label', mode === 'full' ? 'Collapse sidebar' : 'Expand sidebar');
  }
}

function toggleNavMode() {
  const next = (localStorage.getItem(NAV_KEY) || 'full') === 'full' ? 'mini' : 'full';
  localStorage.setItem(NAV_KEY, next);
  applyNavMode(next);
}

let currentRouteId = null;

function render() {
  const { route, param } = parseHash();
  currentRouteId = route.id;

  if (route.id === 'today') setViewedDay(param && param >= 1 && param <= 147 ? param : null);
  const renderArgs = route.id === 'week' ? [param] : [];

  const main = $('#main');
  const scrollTop = main.scrollTop;
  mount(main, route.render(...renderArgs));

  // Refresh nav highlighting
  const nav = $('.app-nav');
  if (nav) nav.replaceWith(renderNav(route.id));

  /**
   * Auto-scroll to the first incomplete block — but ONLY when you are mid-day.
   *
   * Scrolling unconditionally meant that opening the app fresh, with nothing
   * ticked, jumped ~410px and pushed the day header, the Prelims countdown and
   * the revision queue off-screen. You would open PrepTrack and not be able to
   * see what day it was. If nothing is done yet, the top of the page IS where
   * you should be.
   */
  if (route.id === 'today') {
    requestAnimationFrame(() => {
      const cards = [...main.querySelectorAll('.block-card')];
      const next = main.querySelector('.block-card.is-next');
      const midDay = next && cards.indexOf(next) > 0;
      if (midDay && window.scrollY < 40) {
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
      el('button.nav-toggle', {
        type: 'button',
        'aria-controls': 'app-nav',
        'aria-expanded': 'true',
        'aria-label': 'Collapse sidebar',
        onclick: toggleNavMode
      }, [icon('menu')]),
      el('a.app-brand', { href: '#/today' }, [
        el('span.app-brand__mark', { text: 'PT' }),
        el('span', {}, [
          el('span', { text: 'PrepTrack' }),
          el('span.app-brand__sub', { text: `IBPS Clerk 2026 · ${BUILD}` })
        ])
      ]),
      el('div.header-actions', {}, [
        el('span#sync-pip.sync-pip', { title: 'Sync status', 'aria-hidden': 'true' }),
        el('a.icon-btn', { href: '#/syllabus', 'aria-label': 'Syllabus and coverage', title: 'Syllabus — what you have covered' },
          [icon('checklist')]),
        el('a.icon-btn', { href: '#/guide', 'aria-label': 'How to use this app', title: 'How to use this app' },
          [icon('book')]),
        el('a.icon-btn', { href: '#/settings', 'aria-label': 'Settings' }, [icon('settings')])
      ])
    ]),
    renderNav('today'),
    el('main#main.app-main', { tabindex: '-1' })
  ]);

  document.body.prepend(el('a.skip-link', { href: '#main', text: 'Skip to content' }));
  document.body.append(app);

  applyNavMode(localStorage.getItem(NAV_KEY) || 'full');

  // Live sync indicator in the header — quiet, always visible, never a popup.
  onSyncStatus(s => {
    const pip = $('#sync-pip');
    if (!pip) return;
    pip.dataset.state = s.state;
    pip.title = s.message || s.state;
  });

  render();
  window.addEventListener('hashchange', render);

  /**
   * Views are rendered on ROUTE CHANGE only.
   *
   * Previously every state change called render(), which replaces the entire
   * <main>. One block tap rebuilt the day header, the banners, the revision
   * queue, all six cards and the footer — replaying the entry animation,
   * jumping the scroll position and destroying focus in any open input. That is
   * what "the page reloads too much" was.
   *
   * State changes now only mark the data dirty for sync. Views that need to
   * reflect a change patch their own DOM in place.
   */
  subscribe(() => markDirty());

  // Sync opportunistically on real taps. The Google popup requires transient user
  // activation, so a gesture is the only moment we can legally mint a fresh token.
  document.addEventListener('pointerup', syncOnGesture, { passive: true });
  initSyncListeners();
  initAuth();

  // Anything more than a week overdue is advanced past, once per launch. Without
  // this, three missed days in November leave 40 items permanently "due" and the
  // queue becomes a guilt meter instead of a study tool.
  advanceStaleRevisions();

  // Anchored to YOUR Mains date if you have set one, else the plan's assumed date.
  const mainsDate = getState().settings?.examDates?.mains
    || KEY_DATES.find(k => k.id === 'mains')?.date;
  scheduleExamSweep(mainsDate);

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

  console.info(`[PrepTrack] build ${BUILD} · Day ${currentDayNumber()} of 147`);
}

boot();
