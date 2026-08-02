/**
 * Shared UI primitives — theme application and toasts.
 *
 * These live outside app.js so that views can use them without importing the
 * entry module (which would create a circular dependency and re-trigger boot).
 */

import { el, $ } from './dom.js';

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const dark = theme === 'dark' ||
      (theme === 'auto' && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);
    meta.content = dark ? '#0f161b' : '#ffffff';
  }
}

let toastTimer = null;

export function toast(message, variant = '') {
  let node = $('#toast');
  if (!node) {
    node = el('div#toast.toast', { role: 'status' });
    document.body.append(node);
  }
  node.className = `toast${variant ? ` toast--${variant}` : ''}`;
  node.textContent = message;
  requestAnimationFrame(() => node.classList.add('is-visible'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-visible'), 2600);
}
