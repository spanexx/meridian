/**
 * Error utilities — gateway error codes → human-readable messages.
 *
 * The gateway returns errors as { code, message, details } per
 * docs/apis/00-api-conventions.md §Response Format. The code list below
 * is the complete set documented in §Error Codes plus the auth codes
 * from docs/apis/01-auth-api.md. This map is the single place that
 * translates a code for the user; the toast/error surface consumes
 * errorMessage(). Unknown codes get the generic fallback so a new
 * backend code can never crash the UI.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { ERROR_MESSAGES, errorMessage } from './errors';

describe('error utils', () => {
  describe('errorMessage', () => {
    it('maps known codes to human messages', () => {
      expect(errorMessage('INVALID_CREDENTIALS')).toBe('Email or password is incorrect.');
      expect(errorMessage('RATE_LIMITED')).toBe('Too many requests. Please try again later.');
      expect(errorMessage('KYC_REQUIRED')).toBe('KYC verification is required for this action.');
      expect(errorMessage('AUTH_2FA_REQUIRED')).toBe('Two-factor authentication is required.');
    });

    it('falls back for unknown codes', () => {
      expect(errorMessage('NO_SUCH_CODE')).toBe('Something went wrong. Please try again.');
    });
  });

  describe('ERROR_MESSAGES coverage', () => {
    it('covers every documented code from the API conventions', () => {
      const documented: string[] = [
        // Authentication (00-api-conventions §Authentication Errors)
        'AUTH_TOKEN_MISSING', 'AUTH_TOKEN_INVALID', 'AUTH_TOKEN_EXPIRED',
        'AUTH_REFRESH_INVALID', 'AUTH_2FA_REQUIRED', 'AUTH_2FA_INVALID',
        // Authorization
        'FORBIDDEN', 'KYC_REQUIRED', 'ROLE_REQUIRED', 'ACCOUNT_SUSPENDED',
        // Validation
        'VALIDATION_ERROR', 'INVALID_FORMAT', 'REQUIRED_FIELD', 'INVALID_ENUM',
        // Resource
        'NOT_FOUND', 'ALREADY_EXISTS', 'CONFLICT', 'STALE_DATA',
        // Business logic
        'INSUFFICIENT_BALANCE', 'LIMIT_EXCEEDED', 'INVALID_STATE', 'COOLDOWN_ACTIVE',
        // Rate limiting
        'RATE_LIMITED',
        // Auth API (docs/apis/01-auth-api.md error tables)
        'INVALID_CREDENTIALS', 'ACCOUNT_PENDING', 'ACCOUNT_BANNED',
        'TERMS_NOT_ACCEPTED', 'INVALID_TOKEN', 'ALREADY_VERIFIED',
      ];
      for (const code of documented) {
        expect(ERROR_MESSAGES[code], `missing message for ${code}`).toBeTruthy();
      }
    });

    it('has no empty or placeholder messages', () => {
      for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
        expect(message.trim(), `empty message for ${code}`).not.toBe('');
        expect(message, `placeholder message for ${code}`).not.toContain('TODO');
      }
    });
  });
});