/** Tiny DOM helpers. Deliberately minimal — this is the whole "framework". */

/**
 * el('div.card', { onclick }, [children])
 * Tag string supports .class and #id shorthand: 'button.block-card.is-done'
 */
export function el(spec, props = {}, children = []) {
  const [tagAndId, ...classes] = spec.split('.');
  const [tag, id] = tagAndId.split('#');
  const node = document.createElement(tag || 'div');
  if (id) node.id = id;
  if (classes.length) node.className = classes.join(' ');

  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = [node.className, v].filter(Boolean).join(' ');
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k in node && k !== 'list' && typeof v !== 'object') node[k] = v;
    else node.setAttribute(k, v === true ? '' : v);
  }

  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function mount(container, ...nodes) {
  container.replaceChildren(...nodes.filter(Boolean));
  return container;
}

/** Event delegation: one listener on a container handles many children. */
export function delegate(root, eventName, selector, handler) {
  root.addEventListener(eventName, e => {
    const match = e.target.closest(selector);
    if (match && root.contains(match)) handler(e, match);
  });
}

/** Announce to screen readers without moving focus. */
export function announce(message) {
  let live = document.getElementById('live-region');
  if (!live) {
    live = el('div#live-region', { 'aria-live': 'polite', 'aria-atomic': 'true', class: 'sr-only' });
    document.body.append(live);
  }
  live.textContent = '';
  setTimeout(() => { live.textContent = message; }, 50);
}
