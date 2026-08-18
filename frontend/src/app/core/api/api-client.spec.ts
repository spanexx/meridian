/**
 * ApiClient spec — typed client over a REAL seeded MockGateway.
 *
 * The mock IS the test double by design (see PRD step 5): a fresh
 * gateway is seeded via seedGateway in beforeEach, so these tests
 * exercise the actual route contract the pages will consume — the same
 * tests stay meaningful when the transport points at the real gateway.
 * Spot assertions match the canonical shapes in
 * docs/features/frontend-data-layer/api-models-reference.md.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { ApiClient } from './api-client';
import { ApiTransport } from './api-transport';
import { MockGateway } from './mock-gateway';
import { MockTransport } from './mock-transport';
import { seedGateway } from './mock-seed';

describe('api client (seeded gateway)', () => {
  let gateway: MockGateway;
  let transport: MockTransport;
  let client: ApiClient;

  beforeEach(() => {
    gateway = new MockGateway();
    seedGateway(gateway);
    transport = new MockTransport(gateway, 0);
    client = new ApiClient(transport);
  });

  describe('auth', () => {
    it('login returns the token envelope + member for the seeded account', async () => {
      const result = await client.login('jane@example.com', 'pw');
      expect('access_token' in result).toBe(true);
      if ('access_token' in result) {
        expect(result.access_token).toBeTruthy();
        expect(result.member.email).toBe('jane@example.com');
        expect(result.member.roles).toContain('MEMBER');
      }
    });

    it('login surfaces the 2FA challenge variant', async () => {
      const g = new MockGateway();
      g.register('POST', '/auth/login', () => ({
        requires_2fa: true,
        temp_token: 'temp-1',
        message: 'Enter your 2FA code',
      }));
      const c = new ApiClient(new MockTransport(g, 0));
      const result = await c.login('jane@example.com', 'pw');
      expect('requires_2fa' in result).toBe(true);
      if ('requires_2fa' in result) {
        expect(result.temp_token).toBe('temp-1');
      }
    });

    it('me() returns the auth/me member + session block', async () => {
      const result = await client.me();
      expect(result.member.id).toBeTruthy();
      expect(result.session.expires_at).toBeTruthy();
    });
  });

  describe('capital', () => {
    it('poolStatus() returns string totals and numeric ratios', async () => {
      const status = await client.poolStatus();
      expect(typeof status.totals.total_capital).toBe('string');
      expect(typeof status.health.reserve_ratio).toBe('number');
    });

    it('transactions() forwards page/limit as query params', async () => {
      await client.transactions({ page: 2, limit: 10 });
      const request = transport.requests.find((r) => r.path.includes('/capital/transactions'));
      expect(request?.path).toContain('page=2');
      expect(request?.path).toContain('limit=10');
    });

    it('deposit() passes the idempotency key through the transport', async () => {
      await client.deposit({
        amount: '5000.00',
        payment_method: 'CARD',
        idempotency_key: 'dep_test_1',
      });
      const request = transport.requests.find((r) => r.path === '/capital/deposits');
      expect(request?.idempotencyKey).toBe('dep_test_1');
    });
  });

  describe('opportunities', () => {
    it('list returns canonical rows from the wireframe dataset', async () => {
      const { opportunities } = await client.opportunitiesList();
      expect(opportunities.length).toBe(24);
      const first = opportunities[0];
      expect(first.opportunity_id).toMatch(/^O-\d{4}$/);
      expect(first.category).toMatch(/^[A-Z_]+$/);
      expect(typeof first.financials?.estimated_roi).toBe('number');
    });

    it('get() resolves a pattern route to the opportunity detail', async () => {
      const list = await client.opportunitiesList();
      const detail = await client.opportunityGet(list.opportunities[0].opportunity_id);
      expect(detail.opportunity_id).toBe(list.opportunities[0].opportunity_id);
      expect(detail.category).toBeTruthy();
    });
  });

  describe('payouts', () => {
    it('the pool-wide ledger returns canonical string-money rows', async () => {
      const { payouts } = await client.payoutsList();
      expect(payouts.length).toBe(48);
      const first = payouts[0];
      expect(first.amount).toMatch(/^\d+\.\d{2}$/);
      expect(typeof first.share).toBe('number');
      expect(['PENDING', 'COMPLETED']).toContain(first.status);
      expect(first.execution_ref).toMatch(/^E-\d{4}$/);
    });
  });

  describe('communities', () => {
    it('get() hits the /communities/:id pattern with the slug id', async () => {
      const result = await client.communityGet('alpha');
      expect(result.id).toBe('alpha');
      expect(typeof result.stats.pool_capital).toBe('string');
      const request = transport.requests.find((r) => r.path === '/communities/alpha');
      expect(request).toBeDefined();
    });

    it('members() rows use lowercase contribution types', async () => {
      const { members } = await client.communityMembers('alpha');
      expect(members.length).toBeGreaterThan(0);
      expect(members[0].display_name).toBeTruthy();
      expect(members[0].contribution_type).toMatch(/^(capital|signal|access|operator|admin)$/);
    });
  });

  describe('governance', () => {
    it('proposals use lowercase lifecycle statuses', async () => {
      const { proposals } = await client.governanceProposals();
      expect(proposals.length).toBeGreaterThan(0);
      expect(proposals[0].status).toMatch(/^(voting|passed|rejected|expired|withdrawn)$/);
    });

    it('vote() posts to the proposal pattern route and returns the tally', async () => {
      const result = await client.governanceVote('prop_001', { vote: 'approve' });
      expect(result.vote).toBe('approve');
      expect(typeof result.tally.approve_weighted).toBe('number');
      const request = transport.requests.find((r) => r.path === '/governance/proposals/prop_001/vote');
      expect(request).toBeDefined();
    });
  });

  describe('members + notifications', () => {
    it('memberMe() returns the profile-page member', async () => {
      const member = await client.memberMe();
      expect(member.full_name).toBeTruthy();
      expect(member.status).toMatch(/^(pending|active|inactive|suspended)$/);
    });

    it('notificationsList() returns the mock extension items', async () => {
      const { notifications } = await client.notificationsList();
      expect(notifications.length).toBeGreaterThan(0);
      for (const item of notifications) {
        expect(item.id).toBeTruthy();
        expect(typeof item.read).toBe('boolean');
        expect('route' in item).toBe(true);
        expect(item.type).toMatch(/^[A-Z_]+$/);
      }
    });
  });
});

// Type-level: the client implements the typed surface over ApiTransport.
const _transport: ApiTransport = new MockTransport(new MockGateway(), 0);
const _client = new ApiClient(_transport);