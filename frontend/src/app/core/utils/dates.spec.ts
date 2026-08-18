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
import { formatIsoDate, relativeLabel } from './dates';

describe('date utils', () => {
  describe('formatIsoDate', () => {
    it('renders the wireframe short month-day style', () => {
      expect(formatIsoDate('2026-03-13T10:00:00Z')).toBe('Mar 13');
      expect(formatIsoDate('2026-02-21T00:00:00Z')).toBe('Feb 21');
      expect(formatIsoDate('2026-01-04T16:00:00Z')).toBe('Jan 4');
    });
  });

  describe('relativeLabel', () => {
    const now = new Date('2026-03-13T12:00:00Z');

    it('labels sub-minute deltas as just now', () => {
      expect(relativeLabel('2026-03-13T11:59:40Z', now)).toBe('just now');
    });

    it('labels minutes, hours, and days', () => {
      expect(relativeLabel('2026-03-13T11:55:00Z', now)).toBe('5m ago');
      expect(relativeLabel('2026-03-13T10:00:00Z', now)).toBe('2h ago');
      expect(relativeLabel('2026-03-10T12:00:00Z', now)).toBe('3d ago');
    });

    it('falls back to the short date beyond 30 days', () => {
      expect(relativeLabel('2026-01-13T12:00:00Z', now)).toBe('Jan 13');
    });
  });
});