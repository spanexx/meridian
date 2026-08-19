/**
 * Unit tests for the money utilities — the display edge for API money
 * strings (gateway sends two-decimal strings, per
 * docs/apis/00-api-conventions.md §Field Conventions).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { describe, expect, it } from 'vitest';
import { formatApiMoney, isApiMoney, parseApiMoney } from './money';

describe('money utilities', () => {
  it('formatApiMoney() groups thousands and keeps two decimals', () => {
    expect(formatApiMoney('2340.80')).toBe('$2,340.80');
    expect(formatApiMoney('1423580.00')).toBe('$1,423,580.00');
    expect(formatApiMoney('0.00')).toBe('$0.00');
  });

  it('formatApiMoney() preserves the negative sign by default', () => {
    expect(formatApiMoney('-1800.00')).toBe('-$1,800.00');
  });

  it('formatApiMoney() sign=always forces a "+" on positive amounts', () => {
    expect(formatApiMoney('1847.23', 'always')).toBe('+$1,847.23');
  });

  it('formatApiMoney() sign=never strips the negative sign', () => {
    expect(formatApiMoney('-1800.00', 'never')).toBe('$1,800.00');
  });

  it('isApiMoney() accepts two-decimal strings and rejects others', () => {
    expect(isApiMoney('5000.00')).toBe(true);
    expect(isApiMoney('-1800.00')).toBe(true);
    expect(isApiMoney('5000')).toBe(false);
    expect(isApiMoney('50.0')).toBe(false);
    expect(isApiMoney('50.000')).toBe(false);
    expect(isApiMoney('abc')).toBe(false);
  });

  it('parseApiMoney() parses to a number and throws on malformed input', () => {
    expect(parseApiMoney('5000.00')).toBe(5000);
    expect(parseApiMoney('-1800.00')).toBe(-1800);
    expect(() => parseApiMoney('50.0')).toThrow(TypeError);
  });
});
