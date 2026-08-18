/**
 * API envelope + error types — the gateway wire format.
 *
 * Every gateway response is { success, data, meta } and every error is
 * { success:false, error:{ code, message, details }, meta } per
 * docs/apis/00-api-conventions.md §Response Format. ApiError carries
 * the code + status so the UI can map codes via utils/errors.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { ApiError, ApiMeta, ApiResponse, PaginationMeta, isApiEnvelope } from './api-response';

describe('api response types', () => {
  it('isApiEnvelope accepts a well-formed success envelope', () => {
    const envelope = { success: true, data: { items: [] }, meta: { request_id: 'req_1' } };
    expect(isApiEnvelope(envelope)).toBe(true);
  });

  it('isApiEnvelope rejects error envelopes and missing data', () => {
    expect(isApiEnvelope({ success: false, error: { code: 'X', message: 'm' } })).toBe(false);
    expect(isApiEnvelope({ success: true })).toBe(false);
    expect(isApiEnvelope({ data: 1 })).toBe(false);
  });

  it('ApiError carries code, status, and details for the error surface', () => {
    const err = new ApiError('KYC_REQUIRED', 'KYC verification is required.', {
      status: 403,
      details: { kyc: 'unverified' },
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('KYC_REQUIRED');
    expect(err.status).toBe(403);
    expect(err.details).toEqual({ kyc: 'unverified' });
    expect(err.name).toBe('ApiError');
  });
});

// Type-level spot checks: the shapes below must compile with the
// declared generics (runtime asserts are the tests above).
const _metaShape: ApiMeta = { request_id: 'req_1', timestamp: '2026-03-13T10:00:00Z', pagination: undefined };
const _pagShape: PaginationMeta = {
  page: 1, limit: 20, total: 156, total_pages: 8, has_next: true, has_prev: false,
};
const _respShape: ApiResponse<{ items: string[] }> = { success: true, data: { items: [] }, meta: undefined };