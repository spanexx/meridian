/**
 * MockGateway — in-memory backend for development and tests.
 *
 * Registered routes keyed by "METHOD path"; handlers return raw data
 * (the envelope is built by MockTransport) or throw ApiError with a
 * conventions-documented code. The route list is locked by the spec so
 * an accidental route rename fails CI — the list is the contract for
 * the real gateway swap. See docs/features/frontend-data-layer/.
 *
 * Pattern routes (registerPattern) match ':name' path segments and
 * expose ctx.params; exact routes always win over patterns. The seeded
 * route list + per-domain shapes are locked here so the wireframe world
 * served by mock-seed.ts cannot drift silently.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { ApiError } from './api-response';
import { MockGateway } from './mock-gateway';
import { seedGateway } from './mock-seed';
import type {
  CommunityMemberRow,
  ExecutionDetail,
  OpportunityDetail,
  OpportunityListRow,
  PayoutLedgerRow,
  ProposalListRow,
} from '../models';

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

describe('mock gateway pattern routes', () => {
  let gateway: MockGateway;

  beforeEach(() => {
    gateway = new MockGateway();
  });

  it('captures :id params from pattern routes', async () => {
    gateway.registerPattern('GET', '/items/:id', (ctx) => ({ id: ctx.params?.id }));
    await expect(gateway.handle('GET', '/items/42')).resolves.toEqual({ id: '42' });
  });

  it('captures multiple params and decodes URI segments', async () => {
    gateway.registerPattern('GET', '/communities/:id/members/:memberId', (ctx) => ({
      id: ctx.params?.id,
      memberId: ctx.params?.memberId,
    }));
    await expect(gateway.handle('GET', '/communities/alpha/members/sarah%20park')).resolves.toEqual({
      id: 'alpha',
      memberId: 'sarah park',
    });
  });

  it('accepts the combined "GET /path/:id" pattern form', async () => {
    gateway.registerPattern('GET /items/:id', (ctx) => ({ id: ctx.params?.id }));
    await expect(gateway.handle('GET', '/items/7')).resolves.toEqual({ id: '7' });
  });

  it('prefers exact routes over patterns', async () => {
    gateway.register('GET', '/items/mine', () => ({ source: 'exact' }));
    gateway.registerPattern('GET', '/items/:id', () => ({ source: 'pattern' }));
    await expect(gateway.handle('GET', '/items/mine')).resolves.toEqual({ source: 'exact' });
    await expect(gateway.handle('GET', '/items/42')).resolves.toEqual({ source: 'pattern' });
  });

  it('throws NOT_FOUND when no pattern matches the request', async () => {
    gateway.registerPattern('GET', '/items/:id', () => ({}));
    await expect(gateway.handle('GET', '/items/a/b')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(gateway.handle('POST', '/items/42')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(gateway.handle('GET', '/nope/42')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('includes pattern routes in the locked route list', () => {
    gateway.register('GET', '/items', () => ({}));
    gateway.registerPattern('GET', '/items/:id', () => ({}));
    expect(gateway.routesList).toEqual(['GET /items', 'GET /items/:id']);
  });
});

describe('seeded gateway', () => {
  let gateway: MockGateway;

  beforeEach(() => {
    gateway = new MockGateway();
    seedGateway(gateway);
  });

  it('locks the full seeded route list — the seeded gateway route contract', () => {
    expect(gateway.routesList).toEqual([
      // Auth
      'POST /auth/login',
      'GET /auth/me',
      // Capital
      'GET /capital/balance',
      'GET /capital/transactions',
      'GET /capital/pool/status',
      'POST /capital/deposits',
      'POST /capital/withdrawals',
      // Opportunities
      'GET /opportunities',
      'GET /opportunities/mine',
      'GET /vetting/queue',
      // Executions
      'GET /executions',
      // Payouts
      'GET /payouts',
      'GET /members/me/payouts',
      // Communities
      'GET /communities',
      // Governance
      'GET /governance/proposals',
      'GET /governance/parameters',
      'GET /governance/safety-rails',
      'GET /governance/recent-votes',
      // Members + notifications
      'GET /members/me',
      'GET /members/me/settings',
      'GET /notifications',
      // Patterns (exact-over-pattern precedence is asserted above)
      'GET /opportunities/:id',
      'POST /opportunities/:id/vote',
      'GET /executions/:id',
      'GET /communities/:id',
      'GET /communities/:id/members',
      'GET /communities/:id/parameters',
      'GET /governance/proposals/:id',
      'POST /governance/proposals/:id/vote',
    ]);
  });

  it('serves canonical opportunity rows from the wireframe dataset', async () => {
    const data = (await gateway.handle('GET', '/opportunities')) as { opportunities: OpportunityListRow[] };
    expect(data.opportunities).toHaveLength(24);
    expect(data.opportunities[0]).toMatchObject({ opportunity_id: 'O-2051', title: 'Bulk Lego Set Resale' });
    expect(data.opportunities[0].category).toMatch(/^[A-Z_]+$/);
    expect(typeof data.opportunities[0].financials?.estimated_roi).toBe('number');
    expect(typeof data.opportunities[0].financials?.estimated_profit).toBe('number');
  });

  it('serves canonical payout rows (string amounts, UPPER types)', async () => {
    const data = (await gateway.handle('GET', '/payouts')) as { payouts: PayoutLedgerRow[] };
    expect(data.payouts).toHaveLength(48);
    expect(data.payouts[0]).toMatchObject({ execution_ref: 'E-1039', member_id: 'mem_dv', share: 46, status: 'PENDING' });
    expect(typeof data.payouts[0].amount).toBe('string');
    expect(data.payouts[0].amount).toBe('2340.80');
    expect(data.payouts[0].type).toMatch(/^[A-Z_]+$/);
  });

  it('serves lowercase proposal statuses', async () => {
    const data = (await gateway.handle('GET', '/governance/proposals')) as { proposals: ProposalListRow[] };
    expect(data.proposals.length).toBeGreaterThan(0);
    for (const p of data.proposals) {
      expect(p.status).toMatch(/^(voting|passed|rejected|expired|withdrawn)$/);
    }
  });

  it('serves lowercase community member contribution types', async () => {
    const data = (await gateway.handle('GET', '/communities/alpha/members')) as { members: CommunityMemberRow[] };
    expect(data.members.length).toBeGreaterThan(0);
    for (const m of data.members) {
      expect(m.contribution_type).toMatch(/^(capital|signal|access|operator|admin)$/);
    }
  });

  it('serves pattern-route detail endpoints', async () => {
    const detail = (await gateway.handle('GET', '/opportunities/O-2051')) as OpportunityDetail;
    expect(detail.opportunity_id).toBe('O-2051');
    expect(detail.title).toBe('Bulk Lego Set Resale');
    const execution = (await gateway.handle('GET', '/executions/E-1042')) as ExecutionDetail;
    expect(execution.execution_id).toBe('E-1042');
    expect(execution.capital.allocated).toBe('18500.00');
    expect(execution.status).toBe('HOLDING');
  });
});
