/** Date helpers. All dates are handled as local-midnight Date objects or ISO 'YYYY-MM-DD'. */

export function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function iso(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(base, n) {
  const d = typeof base === 'string' ? parseISO(base) : new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

export function today() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function todayISO() {
  return iso(today());
}

export function daysBetween(a, b) {
  const A = typeof a === 'string' ? parseISO(a) : a;
  const B = typeof b === 'string' ? parseISO(b) : b;
  return Math.round((B - A) / 86400000);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatShort(d) {
  const D = typeof d === 'string' ? parseISO(d) : d;
  return `${D.getDate()} ${MONTHS[D.getMonth()]}`;
}

export function formatLong(d) {
  const D = typeof d === 'string' ? parseISO(d) : d;
  return `${WEEKDAYS[D.getDay()]} ${D.getDate()} ${MONTHS[D.getMonth()]} ${D.getFullYear()}`;
}

export function weekdayShort(d) {
  const D = typeof d === 'string' ? parseISO(d) : d;
  return WEEKDAYS[D.getDay()];
}

/** Human phrase for a day offset: "today", "tomorrow", "in 5 days", "3 days ago". */
export function relative(isoDate) {
  const n = daysBetween(todayISO(), isoDate);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}
