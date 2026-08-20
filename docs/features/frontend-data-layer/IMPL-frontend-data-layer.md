Frontend Data Layer - IMPL

Date: 2026-08-18
Depends on: docs/features/frontend-data-layer/PRD-TRD-frontend-data-layer.md
Status: implementation plan (TDD: spec first, then implementation)

Order of work (each step ends with vitest green + commit)

Step 1 — environments
- frontend/src/environments/environment.ts
  (dev: apiUrl http://localhost:8080/api/v1, wsUrl ws://localhost:8080/ws,
  stripePublicKey 'pk_test_xxx', useMock true, latencyMs 120)
- frontend/src/environments/environment.prod.ts
  (apiUrl https://api.meridian.com/api/v1, wsUrl wss://api.meridian.com/ws,
  useMock false)
- angular.json: production fileReplacements
  src/environments/environment.ts → environment.prod.ts
- Spec: environments/environment.spec.ts asserts dev defaults + the
  shape contract (useMock boolean, apiUrl string, latencyMs number).

Step 2 — utils (specs first)
- core/utils/money.spec.ts:
  - formatApiMoney('2340.80') → '+$2,340.80' (sign param: always / never / auto)
  - formatApiMoney('-1800.00') → '-$1,800.00'
  - parseApiMoney('5000.00') → 5000 (number); throws on non-cents string
  - isApiMoney('100.00') true / '100' false
- core/utils/money.ts implements.
- core/utils/dates.spec.ts:
  - formatIsoDate('2026-03-13T10:00:00Z') → 'Mar 13' (wireframe style, en-US)
  - relativeLabel('2026-03-13T10:00:00Z') → '2h ago' style (fixed now
    injected for determinism)
- core/utils/dates.ts implements.
- core/utils/errors.spec.ts:
  - errorMessage('INVALID_CREDENTIALS') → 'Email or password is incorrect.'
  - errorMessage('UNKNOWN_XYZ') → generic fallback
  - every code listed in docs/apis/00-api-conventions.md §Error Codes
    has an entry (table-driven test importing the map)
- core/utils/errors.ts implements with the full code list.

Step 3 — models (from the API-doc extraction subagent result)
- core/models/index.ts (barrel)
- core/models/member.ts (Member, MemberProfile, MemberStatus, KycStatus,
  Roles, ContributionType, ReputationTier)
- core/models/pool.ts (BalanceInfo, Transaction, PoolStatus,
  DepositRequest/Response, WithdrawalRequest/Response)
- core/models/opportunity.ts (Opportunity + OpportunityStatus + categories)
- core/models/execution.ts (Execution + ExecutionStatus + stages)
- core/models/payout.ts (Payout + PayoutType + PayoutStatus)
- core/models/community.ts (Community, CommunityMember, Composition)
- core/models/governance.ts (Proposal, Vote, ProposalStatus)
- core/models/notification.ts (Notification, NotificationPrefs)
- Spec: core/models/models.spec.ts — property-level spot checks:
  compile-time field names asserted against the API docs' snake_case
  list (via a const field-name table), money fields typed string,
  enums contain every documented value.
- IMPORTANT: model field names come from the extraction document only;
  any gap listed there goes into the docs/apis issue section of this
  file, not invented in code.

Step 4 — API envelope + error + transport
- core/api/api-response.ts — ApiResponse<T> { success, data, meta },
  ApiError extends Error { code, status?, details?, meta }.
- core/api/api-response.spec.ts — envelope typing + ApiError fields.
- core/api/api-transport.ts — interface:
  request<T>(method, path, body?, opts?: { idempotencyKey?, token? })
  : Promise<ApiResponse<T>>; marker interface for DI.
- core/api/mock-transport.ts — routes to MockGateway; applies
  latencyMs; converts thrown ApiError into a rejected promise; keeps
  a request log (for tests + observability).
- core/api/http-transport.ts — fetch-based; Bearer from token
  provider; X-Request-ID (uuid-ish); X-Idempotency-Key when provided
  & method is mutation; unwraps envelope; maps HTTP status + error
  body to ApiError; DRIFT note re: frontend-overview.md HttpClient.
- core/api/mock-gateway.ts — route map (method+path → handler);
  seed data = ALL wireframe fixture content collected from every
  page (payouts.data.ts rows + opportunities' 24 rows + dashboard
  KPIs + executions table + pool status + communities + governance
  proposals + notifications + members), converted to canonical
  snake_case models. Handlers throw ApiError for unknown routes.
- Specs:
  - api-response.spec.ts
  - mock-gateway.spec.ts — every registered route returns its
    envelope, known routes list locked, unknown route → ApiError
    NOT_FOUND, latency honored via fake timers
  - mock-transport.spec.ts — request log entries, error propagation
  - http-transport.spec.ts — stubbed global fetch: auth header from
    token provider, request-id header present, idempotency header
    only on mutations, envelope unwrap, 401/422 mapping to ApiError
    codes, network failure → ApiError SERVICE_UNAVAILABLE

Step 5 — ApiClient
- core/api/api-client.ts — injectable; constructor(transport, token
  provider callback); typed methods:
  - auth: login(email, password), me(), register(payload)
  - capital: balance(), transactions(params), poolStatus(),
    deposit(request), withdrawal(request)
  - opportunities: list(params), get(ref)   [canonical paths per
    docs/apis/04]
  - executions: list(params), get(ref, id)
  - payouts: list(params)
  - communities: list(), get(id)
  - governance: proposals(communityId), vote(proposalId, decision)
  - members: me() (alias to auth.me), get(communityId, memberId)
  - notifications: list(), updatePrefs(prefs)
- core/api/api-client.spec.ts — real MockGateway behind MockTransport;
  every method returns the canonical model shape it was typed for
  (spot-check field names + envelope unwrap); auth.login sets the
  token provider; 2FA response surfaces requires_2fa.
- app.config.ts — provide ApiTransport via factory:
  environment.useMock ? MockTransport : HttpTransport (token provider
  wired later by the auth pack; stub returns null until then).

Step 6 — reference consumer: payouts page
- payouts.page.ts: inject ApiClient; `readonly payouts = signal<Payout[]>([])`;
  constructor kicks `this.client.payouts.list({}).then(r => payouts.set(r))`;
  template fields mapped from canonical names (ref, type, amount →
  formatApiMoney, status, date) via computed view rows; loading
  signal drives a skeleton row while pending.
- payouts.data.ts DELETED; its 48 rows move into mock-gateway seed,
  converted to canonical Payout shape (amount strings).
- payouts.page.spec.ts updated: mock transport injected; existing
  assertions preserved; new assertions for loading→loaded transition
  and amount formatting.
- e2e payouts.spec.ts unchanged (page output identical).

Step 7 — verification + PR
- vitest full run, build, e2e, pre-commit; commit each step on
  feat/frontend-data-layer; squash-merge PR per git-conventions.

Known gaps found during extraction (filled from the subagent):
- (to be completed from the extraction result — do not invent fields)

Owner: agent-maintained
Last reviewed: 2026-08-18

## Execution status 2026-08-18 — ACTIVE (orchestrator workflow)

Orchestration restarted per user direction (sessions/decisions.md
2026-08-18): jobs delegated to cline-one (deep/long, serialized) and
opencode-action (short); orchestrator sends job → preps while waiting →
reviews → integrates → tests → commits per job. Parallel jobs only when
file-disjoint.

- Step 1 (environments) DONE + committed (`a18ba19`), specs green.
- Step 2 (utils) DONE + committed (`a18ba19`), specs green.
- Step 3 (models) DONE + committed — 9 canonical files + barrel +
  models.spec (17 tests). governance/notification via opencode-action
  (job 1), reviewed + corrected; reference doc pinned
  (api-models-reference.md).
- Step 4 (envelope/transport/gateway) DONE + committed — api-response,
  api-transport, MockGateway (+pattern routes), MockTransport,
  HttpTransport (opencode job 2), MockGateway seed data via cline-one
  (job 4: mock-seed.ts, 29 routes, full wireframe world as canonical
  data). api-client.spec authored by orchestrator at integration
  (job 3 delivered api-client.ts but its wrapper hung; spec completed
  in-session). 60/60 api specs green.
- Step 5 (ApiClient) DONE — 33 typed methods, envelope-unwrapped,
  idempotency wired (opencode job 3).
- Step 6 (payouts rewire) DONE + committed — payouts.page.ts now injects
  ApiClient.payoutsList() (mock client in spec); payouts.data.ts deleted;
  canonical PayoutLedgerRow mapped to the wireframe view
  (viewRow/statusKey/typeKey + 5-member MEMBER_DISPLAY map; formatApiMoney
  for money, formatIsoDate + 'est. ' prefix for pending dates); loading
  skeleton added. 31 page specs + 9 e2e green (byte-identical render).
- Step 7 (app.config wiring + verification + PR) DONE + committed —
  ApiTransport is a type-only interface, so it travels through the new
  API_TRANSPORT InjectionToken; app.config provides API_TRANSPORT
  (MockTransport+seedGateway in dev, HttpTransport in prod) + ApiClient.
  Closure of two latent data-layer bugs found during integration:
  mock-seed.spec imported opportunityDetailFromRow without exporting it,
  and opportunityDetailFromRow hardcoded risk_level 'MEDIUM' instead of
  reading the row's financials.risk_level. Full suite 956/956 green.
- Step 7 (app.config wiring, verification, PR) PENDING — orchestrator.