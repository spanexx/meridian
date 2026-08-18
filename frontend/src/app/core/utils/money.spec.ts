/**
 * Money utilities — the display edge for API money strings.
 *
 * The gateway sends every monetary value as a string with exactly two
 * decimals ("5000.00", "-1800.00") per docs/apis/00-api-conventions.md
 * §Field Conventions. Models keep that string form end-to-end; this
 * module is the ONLY place that formats it for display or parses it.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { formatApiMoney, isApiMoney, parseApiMoney } from './money';

describe('money utils', () => {
  describe('isApiMoney', () => {
    it('accepts a two-decimal string, optionally negative', () => {
      expect(isApiMoney('2340.80')).toBe(true);
      expect(isApiMoney('-1800.00')).toBe(true);
      expect(isApiMoney('0.00')).toBe(true);
    });

    it('rejects missing decimals, extra decimals, and non-numeric input', () => {
      expect(isApiMoney('2340.8')).toBe(false);
      expect(isApiMoney('2340')).toBe(false);
      expect(isApiMoney('2340.808')).toBe(false);
      expect(isApiMoney('abc')).toBe(false);
      expect(isApiMoney('')).toBe(false);
    });
  });

  describe('parseApiMoney', () => {
    it('parses two-decimal strings to numbers', () => {
      expect(parseApiMoney('2340.80')).toBe(2340.8);
      expect(parseApiMoney('-1800.00')).toBe(-1800);
      expect(parseApiMoney('0.00')).toBe(0);
      expect(parseApiMoney('15250.75')).toBe(15250.75);
    });

    it('throws on non-cents strings instead of silently mis-formatting', () => {
      expect(() => parseApiMoney('100')).toThrow();
      expect(() => parseApiMoney('1,000.00')).toThrow();
      expect(() => parseApiMoney('abc')).toThrow();
    });
  });

  describe('formatApiMoney', () => {
    it('formats with thousands separators and two decimals', () => {
      expect(formatApiMoney('2340.80')).toBe('$2,340.80');
      expect(formatApiMoney('15250.75')).toBe('$15,250.75');
      expect(formatApiMoney('0.00')).toBe('$0.00');
    });

    it('keeps the sign from the string in auto mode', () => {
      expect(formatApiMoney('-1800.00')).toBe('-$1,800.00');
    });

    it('can force an explicit plus for positive deltas', () => {
      expect(formatApiMoney('2340.80', 'always')).toBe('+$2,340.80');
    });

    it('can suppress the sign entirely', () => {
      expect(formatApiMoney('-1800.00', 'never')).toBe('$1,800.00');
    });
  });
});
