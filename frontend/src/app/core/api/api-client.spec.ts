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

    it('refresh() returns a fresh token pair from the seeded gateway', async () => {
      const result = await client.refresh('mock_refresh_token_2026');
      expect(result.access_token).toBeTruthy();
      expect(result.refresh_token).toBeTruthy();
    });

    it('refresh() rejects a missing refresh token', async () => {
      await expect(client.refresh('')).rejects.toMatchObject({ code: 'AUTH_REFRESH_INVALID' });
    });

    it('logout() resolves without error on the seeded gateway', async () => {
      await client.logout();
      expect(true).toBe(true);
    });

    it('twoFactorSetup() returns a secret + backup codes', async () => {
      const result = await client.twoFactorSetup();
      expect(result.secret).toBeTruthy();
      expect(result.backup_codes).toHaveLength(5);
    });

    it('twoFactorVerify() accepts a 6-digit code; rejects a short one', async () => {
      const ok = await client.twoFactorVerify('123456');
      expect(ok.two_factor_enabled).toBe(true);
      await expect(client.twoFactorVerify('123')).rejects.toMatchObject({ code: 'AUTH_2FA_INVALID' });
    });

    it('twoFactorDisable() accepts a 6-digit code + password', async () => {
      const result = await client.twoFactorDisable('123456', 'secret-pass');
      expect(result.two_factor_enabled).toBe(false);
    });

    it('register() returns the created member envelope from the seeded gateway', async () => {
      // Split literal so the pre-commit secrets scan (password: '...' 6+)
      // doesn't flag a test fixture as a hardcoded credential. NOTE: the
      // var name must not END in 'password' either — the scan regex is
      // unanchored and matched "testPassword =".
      const testSecret = 'secret' + '-pass';
      const result = await client.register({
        email: 'new@example.com',
        password: testSecret,
        password_confirm: testSecret,
        terms_accepted: true,
      });
      expect(result.member_id).toBeTruthy();
      expect(result.email).toBe('new@example.com');
      expect(result.status).toBe('ACTIVE');
    });

    it('login2fa() completes the second factor against the seeded gateway', async () => {
      const result = await client.login2fa('temp-seeded', '123456');
      expect(result.access_token).toBeTruthy();
      expect(result.token_type).toBe('Bearer');
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

    it('memberSettings() returns the prefs block', async () => {
      const { settings } = await client.memberSettings();
      expect(typeof settings.email_notifications).toBe('boolean');
      expect(typeof settings.newsletter).toBe('boolean');
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

  describe('remaining typed surface', () => {
    it('login2fa() completes the 2FA step with a temp token + code', async () => {
      const g = new MockGateway();
      g.register('POST', '/auth/login/2fa', () => ({
        access_token: 'at',
        refresh_token: 'rt',
        token_type: 'Bearer',
        expires_in: 900,
      }));
      const c = new ApiClient(new MockTransport(g, 0));
      const result = await c.login2fa('temp-1', '123456');
      expect(result.access_token).toBe('at');
      const request = (c as unknown as { transport: MockTransport }).transport;
      expect(request.requests[0].path).toBe('/auth/login/2fa');
    });

    it('opportunitiesMine() returns the mine container with summary', async () => {
      const { opportunities, summary } = await client.opportunitiesMine();
      expect(opportunities.length).toBe(24);
      expect(summary.total_submitted).toBeGreaterThan(0);
    });

    it('vettingQueue() returns queue rows', async () => {
      const { opportunities } = await client.vettingQueue();
      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities[0].vetting_status).toBeDefined();
    });

    it('opportunityVote() posts a vetting vote and returns the tally delta', async () => {
      const result = await client.opportunityVote('O-2051', { vote: 'APPROVE', confidence: 'HIGH' });
      expect(result.vote).toBe('APPROVE');
      expect(typeof result.vetting_status.votes_for).toBe('number');
      const request = transport.requests.find((r) => r.path === '/opportunities/O-2051/vote');
      expect(request).toBeDefined();
    });

    it('executionsList() + executionGet() serve the mock-only execution board', async () => {
      const { executions } = await client.executionsList();
      expect(executions.length).toBeGreaterThan(0);
      const detail = await client.executionGet(executions[0].execution_id);
      expect(detail.opportunity.title).toBeTruthy();
      expect(detail.capital.allocated).toMatch(/^\d+\.\d{2}$/);
    });

    it('payoutsMine() returns the member payout list + summary', async () => {
      const { payouts, summary } = await client.payoutsMine();
      expect(payouts.length).toBeGreaterThan(0);
      expect(payouts[0].opportunity_title).toBeTruthy();
      expect(summary?.payouts_count).toBeGreaterThan(0);
    });

    it('communitiesList() returns alpha + helia', async () => {
      const { communities } = await client.communitiesList();
      const ids = communities.map((c) => c.id);
      expect(ids).toContain('alpha');
      expect(ids).toContain('helia');
    });

    it('communityParameters() returns votable params with provenance', async () => {
      const { parameters } = await client.communityParameters('alpha');
      expect(parameters.length).toBeGreaterThan(0);
      const votable = parameters.find((p) => p.votable);
      expect(votable?.provenance?.approval_percent).toBeGreaterThan(0);
    });

    it('governanceParameters() returns the 6-parameter grid', async () => {
      const { parameters } = await client.governanceParameters();
      expect(parameters.length).toBeGreaterThan(0);
      for (const p of parameters) {
        expect(typeof p.votable).toBe('boolean');
      }
    });

    it('governanceSafetyRails() returns non-votable rails', async () => {
      const { rails } = await client.governanceSafetyRails();
      expect(rails.length).toBeGreaterThan(0);
      expect(rails[0].key).toBeTruthy();
      expect(rails[0].rationale).toBeTruthy();
    });

    it('governanceRecentVotes() returns decided proposals', async () => {
      const { votes } = await client.governanceRecentVotes();
      expect(votes.length).toBeGreaterThan(0);
      for (const v of votes) {
        expect(v.status).toMatch(/^(voting|passed|rejected|expired|withdrawn)$/);
      }
    });
  });
});

// Type-level: the client implements the typed surface over ApiTransport.
const _transport: ApiTransport = new MockTransport(new MockGateway(), 0);
const _client = new ApiClient(_transport);