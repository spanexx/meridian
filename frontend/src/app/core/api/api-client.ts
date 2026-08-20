/**
 * Typed ApiClient — the ONLY consumer of ApiTransport.
 *
 * Pages, stores, and components MUST go through this class; they never
 * see ApiTransport, MockTransport, or HttpTransport directly. All
 * methods return the DATA payload (envelope unwrapped). Paginated lists
 * return the container objects the docs define, e.g.
 * { opportunities, summary? } / { transactions } / { payouts }.
 *
 * RESERVED SURFACE (BRIDGE 2026-08-21): methods still without a page
 * consumer — deposit, withdrawal, transactions, twoFactorSetup/Verify/
 * Disable, opportunitiesMine, vettingQueue, payoutsMine, memberMe,
 * memberSettings — are DOCUMENTED CONTRACT STUBS reserved for Pack D
 * (flows: money movement, 2FA enrollment, vetting queue, member
 * settings). The backend-readiness audits (opencode + cline-one
 * 2026-08-20) flagged them as dead call sites; they are NOT deleted
 * because docs/apis/* declare the contracts and the mock gateway seeds
 * them, so the transport seam stays backend-switch truthful. Pack D
 * wires each consumer; until then they are tested via MockGateway +
 * api-client.spec.ts as contract coverage.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-21
 */
import { Injectable, Inject } from '@angular/core';
import { ApiTransport, API_TRANSPORT, RequestOptions } from './api-transport';
import {
  // Auth
  LoginResponse,
  TwoFactorChallenge,
  TwoFactorLoginResponse,
  RegisterResponse,
  AuthMeMember,
  AuthTokens,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
  // Capital
  BalanceInfo,
  CapitalTransaction,
  PoolStatus,
  DepositRequest,
  DepositResponse,
  WithdrawalRequest,
  WithdrawalResponse,
  // Opportunities
  OpportunityListRow,
  OpportunityMineSummary,
  OpportunityDetail,
  VettingVote,
  Confidence,
  RejectionReason,
  VettingVoteResponse,
  // Executions
  ExecutionDetail,
  // Payouts
  PayoutLedgerRow,
  PayoutListItem,
  PayoutListSummary,
  // Communities
  CommunityListRow,
  CommunityDetail,
  CommunityMemberRow,
  CommunityParameter,
  // Governance
  ProposalListRow,
  ProposalDetail,
  GovernanceVoteValue,
  ProposalVoteResponse,
  GovernanceParameter,
  SafetyRail,
  RecentVoteRow,
  // Members
  Member,
  NotificationPrefs,
  // Notifications
  NotificationItem,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  // DISCOVERY 2026-08-19: constructor injection is INTENTIONAL here, not
  // a prefer-inject violation. Specs construct `new ApiClient(transport)`
  // directly with bespoke transports (see api-client.spec.ts), which is
  // impossible with `inject()` in a field initializer (NG0203 outside an
  // injection context). The dual-construction design — DI for the app,
  // direct for tests — is the documented seam of the transport layer.
  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(@Inject(API_TRANSPORT) private readonly transport: ApiTransport) {}

  // ===== Auth =====

  async login(email: string, password: string): Promise<LoginResponse | TwoFactorChallenge> {
    const response = await this.transport.request<LoginResponse | TwoFactorChallenge>(
      'POST',
      '/auth/login',
      { email, password },
    );
    return response.data;
  }

  async login2fa(temp_token: string, code: string): Promise<TwoFactorLoginResponse> {
    const response = await this.transport.request<TwoFactorLoginResponse>(
      'POST',
      '/auth/login/2fa',
      { temp_token, code },
    );
    return response.data;
  }

  async register(payload: { email: string; password: string; password_confirm: string; terms_accepted: boolean }): Promise<RegisterResponse> {
    const response = await this.transport.request<RegisterResponse>(
      'POST',
      '/auth/register',
      payload,
    );
    return response.data;
  }

  async me(): Promise<{ member: AuthMeMember; session: { created_at: string; expires_at: string } }> {
    const response = await this.transport.request<{ member: AuthMeMember; session: { created_at: string; expires_at: string } }>(
      'GET',
      '/auth/me',
    );
    return response.data;
  }

  /** POST /auth/refresh — rotate to a fresh token pair using the refresh token. */
  async refresh(refresh_token: string): Promise<AuthTokens> {
    const response = await this.transport.request<AuthTokens>('POST', '/auth/refresh', { refresh_token });
    return response.data;
  }

  /** POST /auth/logout — revoke the current session server-side. */
  async logout(): Promise<void> {
    await this.transport.request<{ success: boolean }>('POST', '/auth/logout');
  }

  /** POST /auth/2fa/setup — begin 2FA enrollment (returns the secret + QR). */
  async twoFactorSetup(): Promise<TwoFactorSetupResponse> {
    const response = await this.transport.request<TwoFactorSetupResponse>('POST', '/auth/2fa/setup');
    return response.data;
  }

  /** POST /auth/2fa/verify — confirm a code to enable 2FA. */
  async twoFactorVerify(code: string): Promise<TwoFactorStatusResponse> {
    const response = await this.transport.request<TwoFactorStatusResponse>('POST', '/auth/2fa/verify', { code });
    return response.data;
  }

  /** POST /auth/2fa/disable — disable 2FA with the current code + password. */
  async twoFactorDisable(code: string, password: string): Promise<TwoFactorStatusResponse> {
    const response = await this.transport.request<TwoFactorStatusResponse>(
      'POST',
      '/auth/2fa/disable',
      { code, password },
    );
    return response.data;
  }

  // ===== Capital =====

  async balance(): Promise<BalanceInfo> {
    const response = await this.transport.request<BalanceInfo>('GET', '/capital/balance');
    return response.data;
  }

  async transactions(params?: { page?: number; limit?: number; type?: string; from?: string; to?: string }): Promise<{ transactions: CapitalTransaction[]; meta?: unknown }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.type) query.set('type', params.type);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    const path = `/capital/transactions${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await this.transport.request<{ transactions: CapitalTransaction[]; meta?: unknown }>('GET', path);
    return response.data;
  }

  async poolStatus(): Promise<PoolStatus> {
    const response = await this.transport.request<PoolStatus>('GET', '/capital/pool/status');
    return response.data;
  }

  async deposit(req: DepositRequest): Promise<DepositResponse> {
    const options: RequestOptions = { idempotencyKey: req.idempotency_key };
    const response = await this.transport.request<DepositResponse>('POST', '/capital/deposits', req, options);
    return response.data;
  }

  async withdrawal(req: WithdrawalRequest): Promise<WithdrawalResponse> {
    const options: RequestOptions = { idempotencyKey: req.idempotency_key };
    const response = await this.transport.request<WithdrawalResponse>('POST', '/capital/withdrawals', req, options);
    return response.data;
  }

  // ===== Opportunities =====

  async opportunitiesList(params?: { status?: string; category?: string; page?: number; limit?: number }): Promise<{ opportunities: OpportunityListRow[]; summary?: OpportunityMineSummary }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const path = `/opportunities${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await this.transport.request<{ opportunities: OpportunityListRow[]; summary?: OpportunityMineSummary }>('GET', path);
    return response.data;
  }

  async opportunitiesMine(): Promise<{ opportunities: OpportunityListRow[]; summary: OpportunityMineSummary }> {
    const response = await this.transport.request<{ opportunities: OpportunityListRow[]; summary: OpportunityMineSummary }>('GET', '/opportunities/mine');
    return response.data;
  }

  async vettingQueue(): Promise<{ opportunities: OpportunityListRow[]; queue_stats?: unknown }> {
    const response = await this.transport.request<{ opportunities: OpportunityListRow[]; queue_stats?: unknown }>('GET', '/vetting/queue');
    return response.data;
  }

  async opportunityGet(id: string): Promise<OpportunityDetail> {
    const response = await this.transport.request<OpportunityDetail>('GET', `/opportunities/${id}`);
    return response.data;
  }

  async opportunityVote(
    id: string,
    body: { vote: VettingVote; confidence?: Confidence; comment?: string; rejection_reason?: RejectionReason },
  ): Promise<VettingVoteResponse> {
    const response = await this.transport.request<VettingVoteResponse>('POST', `/opportunities/${id}/vote`, body);
    return response.data;
  }

  // ===== Executions =====

  // Contract: docs/apis/04b-executions-api.md.
  async executionsList(): Promise<{ executions: ExecutionDetail[] }> {
    const response = await this.transport.request<{ executions: ExecutionDetail[] }>('GET', '/executions');
    return response.data;
  }

  async executionGet(id: string): Promise<ExecutionDetail> {
    const response = await this.transport.request<ExecutionDetail>('GET', `/executions/${id}`);
    return response.data;
  }

  // ===== Payouts =====

  // Pool-wide ledger — contract: docs/apis/07-payouts-api.md.
  async payoutsList(): Promise<{ payouts: PayoutLedgerRow[] }> {
    const response = await this.transport.request<{ payouts: PayoutLedgerRow[] }>('GET', '/payouts');
    return response.data;
  }

  async payoutsMine(params?: { page?: number; limit?: number }): Promise<{ payouts: PayoutListItem[]; summary?: PayoutListSummary }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const path = `/members/me/payouts${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await this.transport.request<{ payouts: PayoutListItem[]; summary?: PayoutListSummary }>('GET', path);
    return response.data;
  }

  // ===== Communities =====

  async communitiesList(): Promise<{ communities: CommunityListRow[] }> {
    const response = await this.transport.request<{ communities: CommunityListRow[] }>('GET', '/communities');
    return response.data;
  }

  async communityGet(id: string): Promise<CommunityDetail> {
    const response = await this.transport.request<CommunityDetail>('GET', `/communities/${id}`);
    return response.data;
  }

  async communityMembers(id: string): Promise<{ members: CommunityMemberRow[] }> {
    const response = await this.transport.request<{ members: CommunityMemberRow[] }>('GET', `/communities/${id}/members`);
    return response.data;
  }

  async communityParameters(id: string): Promise<{ parameters: CommunityParameter[] }> {
    const response = await this.transport.request<{ parameters: CommunityParameter[] }>('GET', `/communities/${id}/parameters`);
    return response.data;
  }

  // ===== Governance =====

  async governanceProposals(params?: { status?: string; target_type?: string }): Promise<{ proposals: ProposalListRow[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.target_type) query.set('target_type', params.target_type);
    const path = `/governance/proposals${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await this.transport.request<{ proposals: ProposalListRow[] }>('GET', path);
    return response.data;
  }

  async governanceProposal(id: string): Promise<ProposalDetail> {
    const response = await this.transport.request<ProposalDetail>('GET', `/governance/proposals/${id}`);
    return response.data;
  }

  async governanceVote(
    proposalId: string,
    body: { vote: GovernanceVoteValue; comment?: string },
  ): Promise<ProposalVoteResponse> {
    const response = await this.transport.request<ProposalVoteResponse>('POST', `/governance/proposals/${proposalId}/vote`, body);
    return response.data;
  }

  async governanceParameters(): Promise<{ parameters: GovernanceParameter[] }> {
    const response = await this.transport.request<{ parameters: GovernanceParameter[] }>('GET', '/governance/parameters');
    return response.data;
  }

  async governanceSafetyRails(): Promise<{ rails: SafetyRail[] }> {
    const response = await this.transport.request<{ rails: SafetyRail[] }>('GET', '/governance/safety-rails');
    return response.data;
  }

  async governanceRecentVotes(): Promise<{ votes: RecentVoteRow[] }> {
    const response = await this.transport.request<{ votes: RecentVoteRow[] }>('GET', '/governance/recent-votes');
    return response.data;
  }

  // ===== Members =====

  async memberMe(): Promise<Member> {
    const response = await this.transport.request<Member>('GET', '/members/me');
    return response.data;
  }

  async memberSettings(): Promise<{ settings: NotificationPrefs }> {
    const response = await this.transport.request<{ settings: NotificationPrefs }>('GET', '/members/me/settings');
    return response.data;
  }

  // ===== Notifications =====

  // Shape contract: docs/apis/08-notifications-api.md.
  async notificationsList(): Promise<{ notifications: NotificationItem[] }> {
    const response = await this.transport.request<{ notifications: NotificationItem[] }>('GET', '/notifications');
    return response.data;
  }
}