/**
 * Date utilities — the display edge for ISO-8601 timestamps.
 *
 * The API sends dates as ISO 8601 strings ("2026-03-13T10:00:00Z") per
 * docs/apis/00-api-conventions.md §Field Conventions. The wireframes
 * display short month-day labels ("Mar 4", "Feb 21") and relative
 * labels for activity. This module is the single place that renders
 * them.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Render an ISO timestamp as the wireframe's short label, e.g. "Mar 13". */
export function formatIsoDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/**
 * Relative time label ("5m ago") with the wireframe date as the fallback
 * beyond 30 days. `now` is injectable for deterministic tests.
 */
export function relativeLabel(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diffMs = now.getTime() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days <= 30) return `${days}d ago`;
  return formatIsoDate(iso);
}