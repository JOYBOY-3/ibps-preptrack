/** Inline SVG icons. Stroke-based, currentColor, no icon font. */

const svg = (paths, viewBox = '0 0 24 24') =>
  `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const ICONS = {
  menu:     svg('<path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17"/>'),
  today:    svg('<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18"/><path d="M8.5 14.5l2.2 2.2 4.3-4.4"/>'),
  week:     svg('<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M9 9.5v11M15 9.5v11"/>'),
  plan:     svg('<path d="M4 5.5h16M4 12h16M4 18.5h10"/><circle cx="19" cy="18.5" r="2"/>'),
  progress: svg('<path d="M4 19V9M10 19V5M16 19v-6M22 19H2"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>'),
  check:    svg('<path d="M4.5 12.5l5 5 10-11"/>'),
  circle:   svg('<circle cx="12" cy="12" r="8.5"/>'),
  book:     svg('<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v18H5.5A1.5 1.5 0 0 1 4 19.5z"/><path d="M4 16.5h15"/>'),
  video:    svg('<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M10 9.2l5.5 2.8-5.5 2.8z"/>'),
  globe:    svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>'),
  tool:     svg('<path d="M14.5 6a3.5 3.5 0 0 0 4.6 4.6L21 12.5 12.5 21 4 12.5 6 10.9A3.5 3.5 0 0 0 10.6 6.3L12.5 4z"/>'),
  clock:    svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 1.9"/>'),
  alert:    svg('<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.2M12 17.4h.01"/>'),
  refresh:  svg('<path d="M3.5 12a8.5 8.5 0 0 1 14.6-5.9L21 9"/><path d="M21 3.5V9h-5.5"/><path d="M20.5 12a8.5 8.5 0 0 1-14.6 5.9L3 15"/><path d="M3 20.5V15h5.5"/>'),
  download: svg('<path d="M12 3.5v12M7.5 11l4.5 4.5 4.5-4.5"/><path d="M4 20h16"/>'),
  upload:   svg('<path d="M12 20.5v-12M7.5 13 12 8.5l4.5 4.5"/><path d="M4 4h16"/>'),
  trophy:   svg('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 5.5H4V7a3 3 0 0 0 3 3M17 5.5h3V7a3 3 0 0 1-3 3"/><path d="M9.5 20h5M12 14v6"/>'),
  flame:    svg('<path d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-1.6.7-3 1.5-4 .2 1.2 1 2 2 2 1.6 0 2.5-2.4 1.5-7z"/>')
};

/**
 * Build an icon element.
 *
 * The class must be applied to the SVG we return, not to the temporary wrapper —
 * putting it on the wrapper silently discards it, leaving a viewBox-only SVG with
 * no intrinsic size, which then expands to fill whatever contains it.
 */
export function icon(name, className = '') {
  const wrap = document.createElement('span');
  wrap.innerHTML = ICONS[name] || ICONS.circle;
  const svg = wrap.firstElementChild;
  svg.classList.add('icon');
  if (className) svg.classList.add(...className.split(/\s+/).filter(Boolean));
  svg.setAttribute('focusable', 'false');
  return svg;
}
