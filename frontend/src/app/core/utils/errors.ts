/**
 * Error utilities — gateway error codes → human-readable messages.
 *
 * The gateway returns errors as { code, message, details } per
 * docs/apis/00-api-conventions.md §Response Format. The code list is
 * the complete set documented in §Error Codes plus the auth codes from
 * docs/apis/01-auth-api.md. This map is the single place that
 * translates a code for the user; the toast/error surface consumes
 * errorMessage(). Unknown codes get the generic fallback so a new
 * backend code can never crash the UI.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */

/** Gateway error code → user-facing message (sources: 00-api-conventions §Error Codes, 01-auth-api). */
export const ERROR_MESSAGES: Record<string, string> = {
  // Authentication
  AUTH_TOKEN_MISSING: 'Your session is missing. Please sign in again.',
  AUTH_TOKEN_INVALID: 'Your session is invalid. Please sign in again.',
  AUTH_TOKEN_EXPIRED: 'Your session expired. Please sign in again.',
  AUTH_REFRESH_INVALID: 'Your session expired. Please sign in again.',
  AUTH_2FA_REQUIRED: 'Two-factor authentication is required.',
  AUTH_2FA_INVALID: 'That code is incorrect. Please try again.',
  // Authorization
  FORBIDDEN: 'You do not have permission to do that.',
  KYC_REQUIRED: 'KYC verification is required for this action.',
  ROLE_REQUIRED: 'Your reputation tier does not allow this action.',
  ACCOUNT_SUSPENDED: 'This account is suspended. Contact support.',
  ACCOUNT_PENDING: 'Verify your email before signing in.',
  ACCOUNT_BANNED: 'This account has been banned.',
  // Validation
  VALIDATION_ERROR: 'Please check the highlighted fields.',
  INVALID_FORMAT: 'One of the fields has an invalid format.',
  REQUIRED_FIELD: 'Please fill in all required fields.',
  INVALID_ENUM: 'That value is not allowed.',
  // Resource
  NOT_FOUND: 'That item could not be found.',
  ALREADY_EXISTS: 'That already exists.',
  CONFLICT: 'This conflicted with another change. Refresh and try again.',
  STALE_DATA: 'This data changed elsewhere. Refresh and try again.',
  // Business logic
  INSUFFICIENT_BALANCE: 'You do not have enough balance for that.',
  LIMIT_EXCEEDED: 'You have reached the limit for this action.',
  INVALID_STATE: 'This action is not allowed in the current state.',
  COOLDOWN_ACTIVE: 'Please wait before trying this again.',
  // Rate limiting
  RATE_LIMITED: 'Too many requests. Please try again later.',
  // Auth API (docs/apis/01-auth-api.md)
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  TERMS_NOT_ACCEPTED: 'You must accept the terms to continue.',
  INVALID_TOKEN: 'That link or token is invalid or expired.',
  ALREADY_VERIFIED: 'Your email is already verified.',
};

const FALLBACK = 'Something went wrong. Please try again.';

/** Translate a gateway error code into a stable user-facing message. */
export function errorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? FALLBACK;
}