/**
 * Minimal observable store. The entire "state management library" is this file.
 *
 * Views subscribe; actions dispatch a mutator. Every mutation persists (debounced)
 * and notifies subscribers. Data flows one way: state → views → actions → state.
 */

import { load, save } from './persist.js';

let state = load();
const subscribers = new Set();

export function getState() {
  return state;
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function notify() {
  for (const fn of subscribers) {
    try { fn(state); }
    catch (err) { console.error('[preptrack] subscriber threw', err); }
  }
}

/**
 * Apply a mutation. `mutator` receives a draft (a shallow-cloned state) and may
 * mutate it freely; whatever it returns — or the draft itself — becomes the new state.
 */
export function update(mutator) {
  const draft = structuredClone(state);
  const next = mutator(draft) ?? draft;
  state = next;
  save(state);
  notify();
  return state;
}

/** Replace state wholesale — used by import and reset. */
export function replaceState(next) {
  state = next;
  save(state);
  notify();
  return state;
}
