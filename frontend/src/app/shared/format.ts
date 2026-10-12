const DAY = 86_400_000;

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** 10. Oktober 2026 */
export function longDate(value: string | Date): string {
  return toDate(value).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** 12. Okt. 2026 */
export function shortDate(value: string | Date): string {
  return toDate(value).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** 11. Okt. 2026, 14:01 */
export function dateTime(value: string | Date): string {
  return toDate(value).toLocaleString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** heute, gestern, 5 T., 3 Wo., or a short date. */
export function ago(value: string | Date, now = new Date()): string {
  const days = Math.round((startOfDay(now) - startOfDay(toDate(value))) / DAY);
  if (days <= 0) return 'heute';
  if (days === 1) return 'gestern';
  if (days < 14) return `${days} T.`;
  if (days < 60) return `${Math.floor(days / 7)} Wo.`;
  return shortDate(value);
}

/** heute, 09:12 / gestern, 21:40 / 11.10. 14:01 */
export function agoTime(value: string | Date, now = new Date()): string {
  const d = toDate(value);
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const days = Math.round((startOfDay(now) - startOfDay(d)) / DAY);
  if (days <= 0) return `heute, ${time}`;
  if (days === 1) return `gestern, ${time}`;
  return `${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} ${time}`;
}

/** Whole days until `value`, at least 0. */
export function daysLeft(value: string | Date | null, now = new Date()): number | null {
  if (!value) return null;
  return Math.max(0, Math.ceil((toDate(value).getTime() - now.getTime()) / DAY));
}

/** True when `value` is in the last 7 days ("Diese Woche"). */
export function isThisWeek(value: string | Date, now = new Date()): boolean {
  return startOfDay(now) - startOfDay(toDate(value)) < 7 * DAY;
}

/** "1 Meldung" / "3 Meldungen" */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
