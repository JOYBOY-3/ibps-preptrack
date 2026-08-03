/**
 * Mastery content loader.
 *
 * ~1.2 MB of method, tricks, traps and time targets across four subject files.
 * Far too much for the main bundle, so each subject is fetched the first time a
 * topic from it is opened, then held in memory. The service worker caches the
 * response on the way through, so after one online open it works offline too.
 */

const SUBJECT_FILE = {
  reasoning: './data/mastery/reasoning.json',
  quant:     './data/mastery/quant.json',
  english:   './data/mastery/english.json',
  ga:        './data/mastery/ga.json'
};

const cache = {};    // subject -> topics map
const inflight = {}; // subject -> promise, so parallel opens fetch once

export function isLoaded(subject) {
  return Boolean(cache[subject]);
}

export async function loadSubject(subject) {
  if (cache[subject]) return cache[subject];
  if (inflight[subject]) return inflight[subject];

  const url = SUBJECT_FILE[subject];
  if (!url) return {};

  inflight[subject] = fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`mastery_${res.status}`);
      return res.json();
    })
    .then(data => { cache[subject] = data; return data; })
    .catch(err => {
      console.warn('[preptrack] mastery content unavailable for', subject, err);
      cache[subject] = {};          // negative-cache so we don't retry on every tap
      return {};
    })
    .finally(() => { delete inflight[subject]; });

  return inflight[subject];
}

/** Synchronous read — returns null unless the subject is already in memory. */
export function getMasterySync(subject, topicId) {
  return cache[subject]?.[topicId] ?? null;
}

export async function getMastery(subject, topicId) {
  const data = await loadSubject(subject);
  return data[topicId] ?? null;
}

/** Warm a subject in the background without blocking anything. */
export function prefetchSubject(subject) {
  if (cache[subject] || inflight[subject]) return;
  const run = () => loadSubject(subject);
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 1200);
}
