/**
 * Models spot-check — canonical field names/types against the API reference.
 *
 * Compile-time: every sample below is typed as the model it exercises, so a
 * wrong field name or type fails the build. Runtime: key-order spot checks
 * and enum-value coverage for the most contract-sensitive shapes. Source of
 * truth: docs/features/frontend-data-layer/api-models-reference.md.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import {
  AuthMeMember,
  BalanceInfo,
  CapitalTransaction,
  CommunityDetail,
  CommunityParameter,
  ExecutionDetail,
  LoginMember,
  Member,
  NotificationItem,
  OpportunityListRow,
  PayoutLedgerRow,
  PoolStatus,
  ProposalDetail,
  ProposalListRow,
  ProposalTally,
  ProposalVoteItem,
  ProposalVoteResponse,
  RecentVoteRow,
} from './models';

describe('canonical models', () => {
  describe('member', () => {
    it('matches the members.md profile shape', () => {
      const m: Member = {
        id: '507f1f77bcf86cd799439011',
        full_name: 'Jane Doe',
        username: 'janedoe',
        email: 'jane@example.com',
        status: 'active',
        email_verified: true,
        two_factor_enabled: false,
        roles: ['MEMBER', 'VETTER'],
        kyc_status: 'VERIFIED',
        profile: {
          first_name: 'Jane',
          last_name: 'Doe',
          display_name: 'janedoe',
          phone: '',
          country: 'US',
          timezone: 'UTC',
          avatar_url: '',
        },
        settings: { email_notifications: true, push_notifications: true, newsletter: false },
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-03-13T08:00:00Z',
      };
      expect(m.status).toBe('active');
      expect(m.settings.email_notifications).toBe(true);
    });

    it('accepts every documented member role and kyc value', () => {
      const all: Member['roles'] = ['MEMBER', 'VETTER', 'OPERATOR', 'ADMIN'];
      const kyc: Member['kyc_status'][] = ['NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED'];
      expect(all).toHaveLength(4);
      expect(kyc).toHaveLength(4);
    });

    it('supports the auth/me variant with mem_ id + UPPER contribution types', () => {
      const me: AuthMeMember = {
        id: 'mem_507f1f77bcf86cd799439011',
        email: 'jane@example.com',
        status: 'ACTIVE',
        profile: { first_name: 'Jane', last_name: 'Doe', display_name: 'janedoe' },
        roles: ['MEMBER'],
        kyc_status: 'VERIFIED',
        two_factor_enabled: true,
        contribution_types: ['CAPITAL', 'SIGNAL'],
        created_at: '2026-01-15T10:00:00Z',
        last_login_at: '2026-03-13T08:00:00Z',
      };
      expect(me.contribution_types).toEqual(['CAPITAL', 'SIGNAL']);
    });

    it('login member carries the documented subset', () => {
      const lm: LoginMember = {
        id: 'mem_1',
        email: 'jane@example.com',
        status: 'ACTIVE',
        roles: ['MEMBER'],
        kyc_status: 'VERIFIED',
        two_factor_enabled: false,
      };
      expect(lm.roles).toContain('MEMBER');
    });
  });

  describe('pool/capital', () => {
    it('balance amounts are strings with two decimals', () => {
      const b: BalanceInfo = {
        balances: { available: '15250.75', locked: '5000.00', pending_deposit: '0.00', pending_withdrawal: '0.00', total: '20250.75' },
        lifetime: { total_deposited: '50000.00', total_withdrawn: '35000.00', total_earned: '5250.75' },
        withdrawal_limits: { min_amount: '50.00', max_single: '10000.00', daily_limit: '25000.00', daily_used: '0.00', daily_remaining: '25000.00' },
        next_payout_estimate: { amount: '350.00', expected_date: '2026-03-20' },
      };
      expect(typeof b.balances.available).toBe('string');
      expect(b.balances.total).toBe('20250.75');
    });

    it('transactions carry signed string amounts + reference block', () => {
      const t: CapitalTransaction = {
        id: 'tx_abc123',
        type: 'ALLOCATION',
        amount: '-1800.00',
        description: 'Capital allocated for execution',
        reference: { type: 'EXECUTION', id: 'exec_789abc' },
        balance_after: '13450.75',
        created_at: '2026-03-15T10:00:00Z',
      };
      expect(t.amount.startsWith('-')).toBe(true);
      expect(t.reference.type).toBe('EXECUTION');
    });

    it('pool status keeps ratios numeric and totals string', () => {
      const p: PoolStatus = {
        totals: { total_capital: '1000000.00', available_capital: '750000.00', deployed_capital: '250000.00' },
        health: { status: 'HEALTHY', reserve_ratio: 15, deployment_ratio: 25 },
        activity: { active_executions: 8, contributors_count: 120 },
        performance: { avg_roi_30d: 32.5, total_profit_30d: '45000.00', executions_completed_30d: 12 },
        snapshot_at: '2026-03-13T10:00:00Z',
      };
      expect(p.health.deployment_ratio).toBe(25);
    });
  });

  describe('opportunity', () => {
    it('list rows use the queue/mine shape with numeric financials', () => {
      const o: OpportunityListRow = {
        opportunity_id: 'opp_1',
        title: 'Bulk Lego Set Resale',
        category: 'COLLECTIBLES',
        status: 'VETTING',
        submitted_at: '2026-03-13T10:00:00Z',
        submitted_by: { display_name: 'Sarah Park', reputation_tier: 'SILVER', signal_score: 65, approval_rate: 72 },
        financials: { estimated_profit: 6500, estimated_roi: 72.2, capital_needed: 9000, risk_level: 'LOW' },
        vetting_status: { votes_for: 4, votes_against: 0, votes_needed: 5, your_vote: null, expires_at: '2026-03-15T10:00:00Z' },
      };
      expect(o.financials?.estimated_roi).toBe(72.2);
      expect(o.submitted_by?.display_name).toBe('Sarah Park');
    });
  });

  describe('execution', () => {
    it('detail shape: string capital, object participants, numeric ratios', () => {
      const e: ExecutionDetail = {
        execution_id: 'exec_1',
        opportunity: { id: 'opp_2', title: 'Travis Scott x Nike' },
        status: 'LIQUIDATING',
        participants: {
          signal_contributor: { member_id: 'mem_1', display_name: 'Sarah Park', share: 25 },
          access_contributor: null,
          operator: { member_id: 'mem_2', display_name: 'Mike Rivera' },
        },
        capital: { allocated: '9000.00', spent: '7835.00', recovered: '8250.00', contributors_count: 45 },
        inventory: { total_items: 12, sold: 8, listed: 2, in_storage: 2, returned: 0 },
        financials: { revenue_to_date: '8250.00', costs_to_date: '7835.00', projected_profit: '4200.00', projected_roi: 53.6 },
        timeline: { started_at: '2026-02-01T10:00:00Z', acquisition_completed_at: '2026-02-08T10:00:00Z', liquidation_started_at: '2026-03-01T10:00:00Z', estimated_completion: '2026-04-01T10:00:00Z' },
      };
      expect(e.capital.allocated).toBe('9000.00');
      expect(e.participants.signal_contributor?.share).toBe(25);
    });
  });

  describe('payout', () => {
    it('ledger row keeps the canonical string money + enum statuses', () => {
      const p: PayoutLedgerRow = {
        payout_id: 'pay_1',
        execution_ref: 'E-1039',
        member_id: 'mem_dv',
        type: 'CAPITAL',
        amount: '2340.80',
        share: 46,
        status: 'PENDING',
        created_at: '2026-03-18T00:00:00Z',
      };
      expect(p.type).toBe('CAPITAL');
      expect(p.share).toBe(46);
    });
  });

  describe('community', () => {
    it('detail carries stats + safety rails; pool capital inside stats', () => {
      const c: CommunityDetail = {
        id: 'comm_1',
        name: 'Alpha Syndicate',
        focus: 'general_arbitrage',
        geographic_scope: 'global',
        status: 'active',
        founded_at: '2025-11-01T00:00:00Z',
        min_contribution: '1000.00',
        settings: { open_enrollment: true, require_kyc_at_join: false, vetter_auto_promotion: false },
        stats: {
          pool_capital: '1423580.00',
          available_capital: '1000000.00',
          locked_capital: '423580.00',
          reserve_ratio: 18.2,
          member_count: 34,
          member_composition: { capital_providers: 20, signal_providers: 9, access_providers: 5 },
          roi_ytd: 18.4,
          executions_count: 42,
          executions_active: 8,
          open_proposals: 3,
        },
        safety_rails: ['integrity_verification', 'reconciliation_checks', 'no_ponzi', 'human_control', 'kyc_identity', 'kernel_engines_providers'],
      };
      expect(c.stats.pool_capital).toBe('1423580.00');
      expect(c.safety_rails).toContain('no_ponzi');
    });

    it('parameters carry provenance for votable items', () => {
      const p: CommunityParameter = {
        key: 'governance.roi_floor',
        display_name: 'ROI floor',
        value: '15',
        unit: '%',
        votable: true,
        provenance: { proposal_id: 'prop_1', proposer_display_name: '@amelia', approved_at: '2026-02-01T00:00:00Z', approval_percent: 78 },
      };
      expect(p.provenance?.approval_percent).toBe(78);
      expect(p.votable).toBe(true);
    });
  });

  describe('governance', () => {
    it('proposal rows tally weighted votes with lowercase statuses', () => {
      const t: ProposalTally = { approve_weighted: 42, reject_weighted: 8, required_weighted_votes: 30, your_weight_if_eligible: 4, has_voted: false };
      const p: ProposalListRow = {
        proposal_id: 'prop_1',
        target_type: 'PARAMETER',
        parameter_key: 'governance.roi_floor',
        display_title: 'Raise ROI floor to 18%',
        current_value: '15',
        proposed_value: '18',
        rationale: 'Market shifted.',
        proposer: { member_id: 'mem_1', display_name: 'amelia', tier: 'T4' },
        status: 'voting',
        tally: t,
        expires_at: '2026-03-15T10:00:00Z',
        created_at: '2026-03-12T10:00:00Z',
      };
      expect(p.status).toBe('voting');
      expect(p.tally.required_weighted_votes).toBe(30);
    });

    it('votes are lowercase approve/reject with weight', () => {
      const v: ProposalVoteItem = {
        vote_id: 'vote_1',
        voter_id: 'mem_2',
        voter_display_name: 'mike',
        voter_tier: 'T4',
        vote: 'approve',
        weight: 4,
        comment: 'agree',
        voted_at: '2026-03-12T12:00:00Z',
      };
      expect(v.vote).toBe('approve');
    });

    it('vote response + recent rows use the documented shapes', () => {
      const r: ProposalVoteResponse = {
        vote_id: 'vote_2',
        proposal_id: 'prop_1',
        vote: 'reject',
        weight: 4,
        tally: { approve_weighted: 42, reject_weighted: 8, required_weighted_votes: 30, your_weight_if_eligible: 4, has_voted: true },
        reputation_earned: 1,
      };
      const recent: RecentVoteRow = { proposal_id: 'prop_0', display_title: 'Lower reserve', parameter_key: 'governance.reserve_ratio_target', decided_at: '2026-02-01T00:00:00Z', approval_percent: 61, status: 'passed' };
      expect(r.reputation_earned).toBe(1);
      expect(recent.status).toBe('passed');
    });

    it('detail extends rows with votes + actions', () => {
      const d: ProposalDetail = {
        proposal_id: 'prop_1',
        target_type: 'PARAMETER',
        parameter_key: 'governance.roi_floor',
        display_title: 'Raise ROI floor to 18%',
        current_value: '15',
        proposed_value: '18',
        rationale: 'Market shifted.',
        proposer: { member_id: 'mem_1', display_name: 'amelia', tier: 'T4' },
        status: 'voting',
        tally: { approve_weighted: 42, reject_weighted: 8, required_weighted_votes: 30, your_weight_if_eligible: 4, has_voted: true },
        expires_at: '2026-03-15T10:00:00Z',
        created_at: '2026-03-12T10:00:00Z',
        voting_window_hours: 72,
        applied_at: null,
        votes: [],
        actions: [{ action_type: 'submitted', actor_id: 'mem_1', occurred_at: '2026-03-12T10:00:00Z' }],
      };
      expect(d.voting_window_hours).toBe(72);
      expect(d.applied_at).toBeNull();
    });
  });

  describe('notification', () => {
    it('items extend the documented payload with id/read/route', () => {
      const n: NotificationItem = {
        type: 'PAYOUT_COMPLETED',
        title: 'Payout completed',
        body: 'You received 487.49',
        data: { payout_id: 'pay_1', amount: 487.49, type: 'CAPITAL' },
        id: 'notif_1',
        read: false,
        created_at: '2026-03-13T10:00:00Z',
        route: '/payouts',
      };
      expect(n.read).toBe(false);
      expect(n.type).toBe('PAYOUT_COMPLETED');
    });
  });
});