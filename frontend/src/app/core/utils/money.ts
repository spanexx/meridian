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

const API_MONEY_RE = /^-?\d+\.\d{2}$/;

/** True when the string is a valid API money value (two decimals). */
export function isApiMoney(amount: string): boolean {
  return API_MONEY_RE.test(amount);
}

/** Parse an API money string to a JS number. Throws on non-cents input. */
export function parseApiMoney(amount: string): number {
  if (!isApiMoney(amount)) {
    throw new TypeError(`Invalid API money string: "${amount}" (expected two decimals)`);
  }
  return Number(amount);
}

/**
 * Format an API money string for display, e.g. "2340.80" → "$2,340.80".
 *
 * @param sign 'auto' keeps the string's sign, 'always' forces "+" on
 *             positive amounts, 'never' strips the sign.
 */
export function formatApiMoney(amount: string, sign: 'auto' | 'always' | 'never' = 'auto'): string {
  const negative = amount.startsWith('-');
  const digits = negative ? amount.slice(1) : amount;
  const [whole, cents] = digits.split('.');
  const grouped = Number(whole).toLocaleString('en-US');
  let prefix = '$';
  if (sign === 'always' && !negative) prefix = '+$';
  if (negative && sign !== 'never') prefix = '-$';
  return `${prefix}${grouped}.${cents}`;
}
