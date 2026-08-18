/**
 * MockGateway — in-memory backend for development and tests.
 *
 * Registered routes keyed by "METHOD path"; handlers return raw data
 * (the envelope is built by MockTransport) or throw ApiError with a
 * conventions-documented code. The route list is locked by the spec so
 * an accidental route rename fails CI — the list is the contract for
 * the real gateway swap. See docs/features/frontend-data-layer/.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { ApiError } from './api-response';
import { MockGateway } from './mock-gateway';

describe('mock gateway', () => {
  let gateway: MockGateway;

  beforeEach(() => {
    gateway = new MockGateway();
  });

  it('routes exact method+path pairs to their handlers', async () => {
    gateway.register('GET', '/health', () => ({ ok: true }));
    const result = gateway.handle('GET', '/health');
    await expect(result).resolves.toEqual({ ok: true });
  });

  it('parses query strings into the handler context', async () => {
    gateway.register('GET', '/items', ({ query }) => ({ page: Number(query.page), cat: query.cat }));
    const result = gateway.handle('GET', '/items?page=2&cat=electronics');
    await expect(result).resolves.toEqual({ page: 2, cat: 'electronics' });
  });

  it('passes the request body to the handler', async () => {
    gateway.register('POST', '/items', ({ body }) => ({ echoed: (body as { name: string }).name }));
    const result = gateway.handle('POST', '/items', { name: 'x' });
    await expect(result).resolves.toEqual({ echoed: 'x' });
  });

  it('supports async handlers', async () => {
    gateway.register('GET', '/slow', async () => {
      await Promise.resolve();
      return { done: true };
    });
    await expect(gateway.handle('GET', '/slow')).resolves.toEqual({ done: true });
  });

  it('throws ApiError NOT_FOUND for unregistered routes', async () => {
    const promise = gateway.handle('GET', '/nope');
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('treats method mismatches as unknown routes', async () => {
    gateway.register('GET', '/items', () => ({}));
    await expect(gateway.handle('POST', '/items')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('exposes the locked route list for contract CI', () => {
    gateway.register('GET', '/items', () => ({}));
    gateway.register('POST', '/items', () => ({}));
    expect(gateway.routesList).toEqual(['GET /items', 'POST /items']);
  });
});