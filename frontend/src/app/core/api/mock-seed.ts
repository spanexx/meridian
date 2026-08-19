/**
 * mock-seed.ts — the wireframe world as canonical API seed data.
 *
 * seedGateway(gateway) registers every route the frontend data layer
 * needs against a fresh MockGateway. Raw seed arrays (SEED_*) are also
 * exported so specs and pages can inspect canonical shapes without
 * going through the gateway.
 *
 * Display values (titles, names, refs, amounts, dates) come verbatim
 * from the wireframe fixture pages under frontend/src/app/pages/* and
 * are converted to canonical model shapes — money strings ('2340.80'),
 * ISO dates, UPPER_SNAKE / lowercase enums — per
 * docs/features/frontend-data-layer/api-models-reference.md (the single
 * source of truth for shapes).
 *
 * DISCOVERY 2026-08-18 (vocabulary gaps, all tracked in the reference):
 * See docs/features/frontend-data-layer/api-models-reference.md (gaps §4.5-§4.8).
 * - The wireframe opportunity categories (apparel / collectibles /
 *   electronics / equipment / furniture) are NOT members of the
 *   canonical OpportunityCategory enum (RETAIL_ARBITRAGE / LIQUIDATION /
 *   VEHICLE / REAL_ESTATE / DIGITAL / COMMODITY / EVENT). Every row maps
 *   to RETAIL_ARBITRAGE here; the real category taxonomy is a backend
 *   pack decision (the docs do not enumerate a retail vocabulary).
 * - Community ids are the wireframe slugs 'alpha' + 'helia' per the
 *   locked route contract (reference gap §4.5: no documented slug
 *   field). The communities page's second row ('Tech Arbitrage') is
 *   seeded under the id 'helia' with its display values unchanged.
 * - The signed-in persona diverges across the wireframes: POST
 *   /auth/login is pinned to jane@example.com while /members/me and
 *   /auth/me serve the profile-page member Alex Chen. Kept as the
 *   wireframes render them; identity consistency is an auth-pack item.
 * - Wireframe notification kinds (vote reminder, reserve ratio,
 *   proposal, reconciliation, reputation, snapshot) are NOT members of
 *   the canonical NotificationType enum (execution/payout events only,
 *   gap §4.3). Each row maps to the closest event type.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { MockGateway } from './mock-gateway';
import { ApiError } from './api-response';
import type {
  AuthMeMember,
  AuthTokens,
  BalanceInfo,
  CapitalTransaction,
  CommunityDetail,
  CommunityListRow,
  CommunityMemberRow,
  CommunityParameter,
  DepositResponse,
  ExecutionDetail,
  GovernanceParameter,
  LoginMember,
  Member,
  NotificationItem,
  NotificationPrefs,
  OpportunityCategory,
  OpportunityDetail,
  OpportunityListRow,
  OpportunityMineSummary,
  OpportunityStatus,
  PayoutListItem,
  PayoutListSummary,
  PayoutLedgerRow,
  PoolStatus,
  ProposalDetail,
  ProposalListRow,
  ProposalVoteResponse,
  RecentVoteRow,
  RegisterResponse,
  SafetyRail,
  TwoFactorLoginResponse,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
  VettingVoteResponse,
  WithdrawalResponse,
} from '../models';

// ─── shared helpers ────────────────────────────────────────────────────

const MONTH_INDEX: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

/** 'Mar 4' / 'est. Mar 18' → ISO. December dates roll to 2025 (wireframe year). */
function isoFromDisplayDate(display: string): string {
  const cleaned = display.replace(/^est\.\s*/, '');
  const [mon, day] = cleaned.split(' ');
  const year = mon === 'Dec' ? '2025' : '2026';
  return `${year}-${MONTH_INDEX[mon]}-${String(Number(day)).padStart(2, '0')}T00:00:00Z`;
}

/** '2m ago' / '1h ago' / 'Yesterday' / '3 days ago' → ISO (relative to now). */
function isoFromRelative(rel: string): string {
  const ms =
    rel === 'Yesterday'
      ? 86_400_000
      : rel.endsWith('m ago')
        ? Number.parseInt(rel, 10) * 60_000
        : rel.endsWith('h ago')
          ? Number.parseInt(rel, 10) * 3_600_000
          : rel.endsWith('days ago')
            ? Number.parseInt(rel, 10) * 86_400_000
            : 0;
  return new Date(Date.now() - ms).toISOString();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function money(n: number): string {
  return n.toFixed(2);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const VOTES_NEEDED = 5;
const VETTING_EXPIRES = '2026-03-20T00:00:00Z';

/** Submitter reputation profiles for the opportunity page members. */
const SUBMITTER_PROFILES: Record<string, { tier: string; signal_score: number; approval_rate: number }> = {
  'Sarah Park':    { tier: 'T3', signal_score: 81, approval_rate: 88 },
  'Marcus Rivera': { tier: 'T3', signal_score: 78, approval_rate: 90 },
  'Mike Rivera':   { tier: 'T3', signal_score: 78, approval_rate: 90 },
  'Jules Tan':     { tier: 'T3', signal_score: 74, approval_rate: 82 },
  'Kenji Honda':   { tier: 'T2', signal_score: 55, approval_rate: 71 },
  'Alex Chen':     { tier: 'T3', signal_score: 78, approval_rate: 85 },
  'Kenji Tanaka':  { tier: 'T2', signal_score: 52, approval_rate: 68 },
  'Lucia Bianchi': { tier: 'T3', signal_score: 70, approval_rate: 80 },
  'Daria Olsen':   { tier: 'T2', signal_score: 60, approval_rate: 75 },
  'Pavel Afolabi': { tier: 'T2', signal_score: 62, approval_rate: 76 },
  'Ivan Kovalev':  { tier: 'T3', signal_score: 66, approval_rate: 78 },
  'Mai Nguyen':    { tier: 'T2', signal_score: 58, approval_rate: 72 },
  'Rolf Müller':   { tier: 'T3', signal_score: 64, approval_rate: 77 },
  'Ana Fernandez': { tier: 'T2', signal_score: 57, approval_rate: 74 },
  'Jay Adekunle':  { tier: 'T3', signal_score: 69, approval_rate: 79 },
};

function submitterOf(name: string): { display_name: string; reputation_tier: string; signal_score: number; approval_rate: number } {
  const p = SUBMITTER_PROFILES[name] ?? { tier: 'T3', signal_score: 60, approval_rate: 75 };
  return { display_name: name, reputation_tier: p.tier, signal_score: p.signal_score, approval_rate: p.approval_rate };
}

// ─── opportunities ─────────────────────────────────────────────────────

/** Raw wireframe rows (opportunities.page.ts dataset). status: pending/vetting/approved/executing/rejected. */
interface OpportunitySeedRow {
  ref: string;
  title: string;
  category: string;
  submitter: string;
  estRoi: number;
  capital: number;
  votesUp: number | null;
  votesDown: number | null;
  status: 'pending' | 'vetting' | 'approved' | 'executing' | 'rejected';
}

const OPPORTUNITY_SEED_ROWS: OpportunitySeedRow[] = [
  { ref: 'O-2051', title: 'Bulk Lego Set Resale', category: 'collectibles', submitter: 'Sarah Park', estRoi: 34.2, capital: 8200, votesUp: 4, votesDown: 0, status: 'vetting' },
  { ref: 'O-2050', title: 'Restaurant Equipment Resale', category: 'equipment', submitter: 'Marcus Rivera', estRoi: 22.8, capital: 4500, votesUp: 2, votesDown: 1, status: 'vetting' },
  { ref: 'O-2049', title: 'Travis Scott × Nike Sneakers', category: 'apparel', submitter: 'Mike Rivera', estRoi: 51.4, capital: 14200, votesUp: 3, votesDown: 1, status: 'vetting' },
  { ref: 'O-2048', title: 'Designer Furniture Resale', category: 'furniture', submitter: 'Jules Tan', estRoi: 18.5, capital: 7800, votesUp: null, votesDown: null, status: 'pending' },
  { ref: 'O-2047', title: 'Vintage Camera Lot', category: 'collectibles', submitter: 'Kenji Honda', estRoi: 41.0, capital: 5400, votesUp: null, votesDown: null, status: 'pending' },
  { ref: 'O-2045', title: 'Vinyl Record Collection', category: 'collectibles', submitter: 'Alex Chen', estRoi: 28.6, capital: 3200, votesUp: 5, votesDown: 0, status: 'approved' },
  { ref: 'O-2043', title: 'PS5 Bundle Bulk', category: 'electronics', submitter: 'Sarah Park', estRoi: 15.2, capital: 22000, votesUp: 4, votesDown: 1, status: 'approved' },
  { ref: 'O-2037', title: 'Travis Scott × Nike (E-1042)', category: 'apparel', submitter: 'Mike Rivera', estRoi: 51.4, capital: 18500, votesUp: 3, votesDown: 0, status: 'executing' },
  { ref: 'O-2031', title: 'Eames Lounge Replica (no-auth)', category: 'furniture', submitter: 'Kenji Tanaka', estRoi: 6.0, capital: 1400, votesUp: 1, votesDown: 6, status: 'rejected' },
  { ref: 'O-2028', title: 'Pokemon Base Set Booster Box', category: 'collectibles', submitter: 'Lucia Bianchi', estRoi: 31.0, capital: 9500, votesUp: 6, votesDown: 7, status: 'executing' },
  { ref: 'O-2025', title: 'Gibson Les Paul Studio', category: 'electronics', submitter: 'Daria Olsen', estRoi: 11.0, capital: 2200, votesUp: 3, votesDown: 3, status: 'vetting' },
  { ref: 'O-2022', title: 'Herman Miller Aeron (size B)', category: 'furniture', submitter: 'Pavel Afolabi', estRoi: 4.0, capital: 1800, votesUp: 2, votesDown: 6, status: 'pending' },
  { ref: 'O-2019', title: 'Stone Island Shadow Project', category: 'apparel', submitter: 'Ivan Kovalev', estRoi: 19.0, capital: 1100, votesUp: 4, votesDown: 4, status: 'approved' },
  { ref: 'O-2014', title: 'Yeezy Boost 350 V2 (Bone)', category: 'apparel', submitter: 'Sarah Park', estRoi: 22.0, capital: 7600, votesUp: 5, votesDown: 5, status: 'rejected' },
  { ref: 'O-2011', title: 'Topps 1986 Fleer Jordan #57', category: 'collectibles', submitter: 'Mai Nguyen', estRoi: 14.0, capital: 12000, votesUp: 7, votesDown: 9, status: 'pending' },
  { ref: 'O-2008', title: 'Wüsthof Classic 8" chef knife', category: 'equipment', submitter: 'Rolf Müller', estRoi: 12.0, capital: 240, votesUp: 4, votesDown: 4, status: 'pending' },
  { ref: 'O-2005', title: 'Vintage Sony Walkman D-250', category: 'electronics', submitter: 'Ana Fernandez', estRoi: 9.0, capital: 900, votesUp: 2, votesDown: 5, status: 'rejected' },
  { ref: 'O-2002', title: 'Nike Air Max 1 × 5 lots', category: 'apparel', submitter: 'Jay Adekunle', estRoi: 18.0, capital: 4200, votesUp: 3, votesDown: 4, status: 'pending' },
  { ref: 'O-1996', title: 'Antique Pocket Watch', category: 'collectibles', submitter: 'Kenji Honda', estRoi: 8.0, capital: 320, votesUp: 1, votesDown: 1, status: 'rejected' },
  { ref: 'O-1991', title: 'Herman Miller Embody', category: 'furniture', submitter: 'Pavel Afolabi', estRoi: 5.0, capital: 1500, votesUp: 2, votesDown: 3, status: 'rejected' },
  { ref: 'O-1984', title: 'Roland TR-08 Rhythm Composer', category: 'electronics', submitter: 'Daria Olsen', estRoi: 7.0, capital: 480, votesUp: 3, votesDown: 2, status: 'pending' },
  { ref: 'O-1977', title: 'Bottega Veneta Cassette Bag', category: 'apparel', submitter: 'Lucia Bianchi', estRoi: 16.0, capital: 2400, votesUp: 4, votesDown: 2, status: 'approved' },
  { ref: 'O-1970', title: "Kaws 'OriginalFake' Companion", category: 'collectibles', submitter: 'Ivan Kovalev', estRoi: 13.0, capital: 1800, votesUp: 5, votesDown: 4, status: 'rejected' },
  { ref: 'O-1963', title: 'Professional Espresso Machine', category: 'equipment', submitter: 'Rolf Müller', estRoi: 25.0, capital: 6800, votesUp: 6, votesDown: 1, status: 'approved' },
];

const CATEGORY: Record<string, OpportunityCategory> = {
  apparel: 'RETAIL_ARBITRAGE',
  collectibles: 'RETAIL_ARBITRAGE',
  electronics: 'RETAIL_ARBITRAGE',
  equipment: 'RETAIL_ARBITRAGE',
  furniture: 'RETAIL_ARBITRAGE',
};

const STATUS: Record<OpportunitySeedRow['status'], OpportunityStatus> = {
  pending: 'SUBMITTED',
  vetting: 'VETTING',
  approved: 'APPROVED',
  executing: 'EXECUTED',
  rejected: 'REJECTED',
};

/** O-2051 → Mar 16, O-1963 → Mar 1 (submission dates are not displayed on the wireframe). */
function submittedAt(ref: string): string {
  const n = Number(ref.slice(2));
  const day = Math.max(1, 16 - Math.floor((2051 - n) / 3));
  return `2026-03-${String(day).padStart(2, '0')}T10:00:00Z`;
}

function opportunityRowFromSeed(r: OpportunitySeedRow): OpportunityListRow {
  return {
    opportunity_id: r.ref,
    title: r.title,
    category: CATEGORY[r.category],
    status: STATUS[r.status],
    submitted_at: submittedAt(r.ref),
    submitted_by: submitterOf(r.submitter),
    financials: {
      estimated_profit: round2(r.capital * (r.estRoi / 100)),
      estimated_roi: r.estRoi,
      capital_needed: r.capital,
    },
    ...(r.votesUp !== null
      ? {
          vetting_status: {
            votes_for: r.votesUp,
            votes_against: r.votesDown ?? 0,
            votes_needed: VOTES_NEEDED,
            your_vote: null,
            expires_at: VETTING_EXPIRES,
          },
        }
      : {}),
  };
}

/** 24 canonical rows — the wireframe opportunities dataset. */
export const SEED_OPPORTUNITIES: OpportunityListRow[] = OPPORTUNITY_SEED_ROWS.map(opportunityRowFromSeed);

/** Mine summary from the profile page (Alex Chen: 8 of 14 approved, lifetime $1,847.23, avg ROI +24.6%). */
export const SEED_OPPORTUNITY_SUMMARY: OpportunityMineSummary = {
  total_submitted: 14,
  approved: 8,
  rejected: 3,
  pending: 3,
  total_profit_generated: 1847.23,
  avg_roi: 24.6,
};

/** Vetting queue = submitted + in-vetting rows, each with a vetting_status block. */
export const SEED_VETTING_QUEUE: OpportunityListRow[] = SEED_OPPORTUNITIES.filter(
  (r) => r.status === 'SUBMITTED' || r.status === 'VETTING',
).map((r) => ({
  ...r,
  vetting_status: r.vetting_status ?? {
    votes_for: 0,
    votes_against: 0,
    votes_needed: VOTES_NEEDED,
    your_vote: null,
    expires_at: VETTING_EXPIRES,
  },
}));

/** Detail composite — GET /opportunities/{id} is table-only in the docs (gap §4.4). */
export function opportunityDetailFromRow(r: OpportunityListRow): OpportunityDetail {
  return {
    opportunity_id: r.opportunity_id,
    status: r.status ?? 'SUBMITTED',
    title: r.title,
    category: r.category,
    calculated: {
      estimated_profit: r.financials?.estimated_profit ?? 0,
      estimated_roi: r.financials?.estimated_roi ?? 0,
      risk_level: r.financials?.risk_level ?? 'MEDIUM',
      confidence_required: 'HIGH',
    },
    validation: { is_complete: true, missing_fields: [], warnings: [] },
    vetting: {
      status: r.status === 'VETTING' || r.status === 'SUBMITTED' ? 'IN_PROGRESS' : 'PENDING',
      auto_checks: {
        duplicate_check: 'PASSED',
        fraud_check: 'PASSED',
        math_validation: 'PASSED',
      },
      estimated_review_time: '24h',
    },
    submitted_at: r.submitted_at,
    created_at: r.submitted_at,
  };
}

// ─── executions ────────────────────────────────────────────────────────

/** Raw wireframe rows (executions.page.ts 16-row dataset). */
interface ExecutionSeedRow {
  ref: string;
  title: string;
  opp: string;
  oppTitle: string;
  status: 'active' | 'completed' | 'failed';
  badge: string;
  deployed: number;
  recovered: number;
  roi: number;
  statusLine: string;
}

const EXECUTION_SEED_ROWS: ExecutionSeedRow[] = [
  { ref: 'E-1042', title: 'Limited Edition Sneaker Resale', opp: 'O-2037', oppTitle: 'Travis Scott × Nike', status: 'active', badge: 'Listed', deployed: 18500, recovered: 4280, roi: 12.4, statusLine: '3 of 8 sold' },
  { ref: 'E-1039', title: 'Vintage Watch Liquidation', opp: 'O-2021', oppTitle: 'Estate lot', status: 'active', badge: 'All Sold', deployed: 32000, recovered: 37985, roi: 18.7, statusLine: '5 of 5 sold' },
  { ref: 'E-1036', title: 'Wholesale Electronics', opp: 'O-2018', oppTitle: 'Shenzhen bulk', status: 'active', badge: 'Acquiring', deployed: 45000, recovered: 0, roi: 0, statusLine: '0 of 12 units' },
  { ref: 'E-1033', title: 'Designer Furniture Resale', opp: 'O-2014', oppTitle: 'Herman Miller · 12 chairs', status: 'completed', badge: 'Settled', deployed: 7800, recovered: 9240, roi: 18.5, statusLine: '12 of 12 sold' },
  { ref: 'E-1031', title: 'Vintage Camera Lot', opp: 'O-2011', oppTitle: 'Leica M3 · 2 units', status: 'completed', badge: 'Settled', deployed: 5400, recovered: 7620, roi: 41.0, statusLine: '2 of 2 sold' },
  { ref: 'E-1028', title: 'Vinyl Record Collection', opp: 'O-2008', oppTitle: '320 records', status: 'completed', badge: 'Settled', deployed: 3200, recovered: 4115, roi: 28.6, statusLine: '320 of 320 sold' },
  { ref: 'E-1025', title: 'PS5 Bundle Bulk', opp: 'O-2005', oppTitle: '8 bundles', status: 'completed', badge: 'Settled', deployed: 22000, recovered: 25340, roi: 15.2, statusLine: '8 of 8 bundles sold' },
  { ref: 'E-1022', title: 'Bulk Lego Set Resale', opp: 'O-2002', oppTitle: 'Retired Star Wars sets', status: 'completed', badge: 'Settled', deployed: 8200, recovered: 11004, roi: 34.2, statusLine: '6 of 6 lots sold' },
  { ref: 'E-1019', title: 'Restaurant Equipment Resale', opp: 'O-1998', oppTitle: 'Espresso machine', status: 'completed', badge: 'Settled', deployed: 4500, recovered: 5526, roi: 22.8, statusLine: '1 of 1 sold' },
  { ref: 'E-1016', title: 'Yeezy Boost 350 V2 (Bone)', opp: 'O-1995', oppTitle: 'Deadstock · size 10', status: 'completed', badge: 'Settled', deployed: 7600, recovered: 9272, roi: 22.0, statusLine: '1 of 1 sold' },
  { ref: 'E-1013', title: 'Topps 1986 Fleer Jordan #57', opp: 'O-1992', oppTitle: 'PSA 9 graded', status: 'completed', badge: 'Settled', deployed: 12000, recovered: 13680, roi: 14.0, statusLine: '1 of 1 sold' },
  { ref: 'E-1010', title: 'Wüsthof Classic 8" chef knife', opp: 'O-1989', oppTitle: '3-piece set', status: 'completed', badge: 'Settled', deployed: 240, recovered: 269, roi: 12.0, statusLine: '3 of 3 sets sold' },
  { ref: 'E-1007', title: 'Gibson Les Paul Studio', opp: 'O-1986', oppTitle: '2018 sunburst', status: 'completed', badge: 'Settled', deployed: 2200, recovered: 2442, roi: 11.0, statusLine: '1 of 1 sold' },
  { ref: 'E-1004', title: 'Stone Island Shadow Project', opp: 'O-1983', oppTitle: 'FW23 jacket', status: 'completed', badge: 'Settled', deployed: 1100, recovered: 1309, roi: 19.0, statusLine: '1 of 1 sold' },
  { ref: 'E-1001', title: 'Herman Miller Aeron (size B)', opp: 'O-1980', oppTitle: 'Refurbished', status: 'completed', badge: 'Settled', deployed: 1800, recovered: 1872, roi: 4.0, statusLine: '1 of 1 sold' },
  { ref: 'E-0998', title: 'Eames Lounge Replica (no-auth)', opp: 'O-1977', oppTitle: 'No certificate', status: 'failed', badge: 'Defaulted', deployed: 1400, recovered: 280, roi: -80.0, statusLine: '2 of 5 buyers refunded' },
];

/** Participants shared by every execution (execution-detail.page.ts side card). */
const E1042_PARTICIPANTS: ExecutionDetail['participants'] = {
  signal_contributor: { member_id: 'mem_mike-rivera', display_name: 'Mike Rivera', share: 30 },
  access_contributor: { member_id: 'mem_sarah-park', display_name: 'Sarah Park', share: 12 },
  operator: { member_id: 'mem_alexchen', display_name: 'Alex Chen' },
};

interface SoldCounts {
  sold: number;
  total: number;
  returned: number;
}

function parseStatusLine(line: string): SoldCounts {
  const m = line.match(/^(\d+) of (\d+)/);
  const returned = line.match(/(\d+) of (\d+) buyers refunded/);
  if (!m) return { sold: 0, total: 0, returned: 0 };
  return {
    sold: Number(m[1]),
    total: Number(m[2]),
    returned: returned ? Number(returned[1]) : 0,
  };
}

function executionStatusOf(r: ExecutionSeedRow): ExecutionDetail['status'] {
  if (r.status === 'completed') return 'COMPLETED';
  if (r.status === 'failed') return 'FAILED';
  if (r.badge === 'Acquiring') return 'ACQUIRING';
  if (r.badge === 'All Sold') return 'LIQUIDATING';
  return 'HOLDING';
}

function executionTimelineOf(r: ExecutionSeedRow): ExecutionDetail['timeline'] {
  if (r.ref === 'E-1042') {
    return {
      started_at: '2026-03-05T17:32:00Z',
      acquisition_completed_at: '2026-03-08T10:15:00Z',
      liquidation_started_at: '2026-03-09T09:14:00Z',
      estimated_completion: '2026-03-19T00:00:00Z',
    };
  }
  if (r.ref === 'E-1039') {
    return {
      started_at: '2026-02-20T00:00:00Z',
      acquisition_completed_at: '2026-02-24T00:00:00Z',
      liquidation_started_at: '2026-03-10T00:00:00Z',
      estimated_completion: '2026-03-18T00:00:00Z',
    };
  }
  if (r.ref === 'E-1036') {
    return {
      started_at: '2026-03-14T00:00:00Z',
      acquisition_completed_at: '2026-03-18T00:00:00Z',
      liquidation_started_at: '2026-03-22T00:00:00Z',
      // DISCOVERY 2026-08-19: dashboard renders "ETA n days" from
      // estimated_completion vs Date.now(); static dates decayed to
      // "ETA 1 days". Relative-to-now keeps the wireframe "ETA 4 days"
      // stable for dev + e2e (dashboard.spec.ts pins it).
      estimated_completion: new Date(Date.now() + 4 * 86_400_000).toISOString(),
    };
  }
  const day = (Number(r.ref.slice(2)) % 27) + 1;
  const shift = (add: number): string => new Date(Date.UTC(2026, 1, day + add)).toISOString();
  return {
    started_at: `2026-02-${String(day).padStart(2, '0')}T00:00:00Z`,
    acquisition_completed_at: shift(3),
    liquidation_started_at: shift(5),
    estimated_completion: shift(14),
  };
}

function executionFromRow(r: ExecutionSeedRow): ExecutionDetail {
  const counts = parseStatusLine(r.statusLine);
  const spent = r.ref === 'E-1042' ? 18200 : r.deployed;
  const projected =
    r.status === 'completed' || r.status === 'failed'
      ? r.recovered - r.deployed
      : r.ref === 'E-1042'
        ? 4061
        : 0;
  return {
    execution_id: r.ref,
    opportunity: { id: r.opp, title: r.oppTitle },
    status: executionStatusOf(r),
    participants: E1042_PARTICIPANTS,
    capital: {
      allocated: money(r.deployed),
      spent: money(spent),
      recovered: money(r.recovered),
      contributors_count: 42,
    },
    inventory: {
      total_items: counts.total,
      sold: counts.sold,
      listed: r.status === 'active' ? Math.max(0, counts.total - counts.sold - counts.returned) : 0,
      in_storage: 0,
      returned: counts.returned,
    },
    financials: {
      revenue_to_date: money(r.recovered),
      costs_to_date: money(spent),
      projected_profit: money(projected),
      projected_roi: r.roi,
    },
    timeline: executionTimelineOf(r),
  };
}

/** 16 canonical executions. GET /executions is mock-only (no list endpoint in the API docs, gap §4.1). */
export const SEED_EXECUTIONS: ExecutionDetail[] = EXECUTION_SEED_ROWS.map(executionFromRow);

// ─── payouts ───────────────────────────────────────────────────────────

/** Raw wireframe rows (payouts.data.ts 48-row dataset). initials + type + share stay verbatim. */
interface PayoutSeedRow {
  ref: string;
  initials: 'DV' | 'MR' | 'JT' | 'RK' | 'SP';
  type: 'capital' | 'signal' | 'access';
  amount: number;
  share: number;
  status: 'pending' | 'paid';
  date: string;
}

const MEMBER_ID_BY_INITIALS: Record<PayoutSeedRow['initials'], string> = {
  DV: 'mem_dv',
  MR: 'mem_mr',
  JT: 'mem_jt',
  RK: 'mem_rk',
  SP: 'mem_sp',
};

const PAYOUT_TYPE: Record<PayoutSeedRow['type'], PayoutLedgerRow['type']> = {
  capital: 'CAPITAL',
  signal: 'SIGNAL',
  access: 'ACCESS',
};

const PAYOUT_SEED_ROWS: PayoutSeedRow[] = [
  { ref: 'E-1039', initials: 'DV', type: 'capital', amount: 2340.8, share: 46, status: 'pending', date: 'est. Mar 18' },
  { ref: 'E-1039', initials: 'MR', type: 'signal', amount: 1526.61, share: 30, status: 'pending', date: 'est. Mar 18' },
  { ref: 'E-1039', initials: 'JT', type: 'access', amount: 610.64, share: 12, status: 'pending', date: 'est. Mar 18' },
  { ref: 'E-1030', initials: 'DV', type: 'capital', amount: 1890.2, share: 46, status: 'paid', date: 'Mar 4' },
  { ref: 'E-1030', initials: 'MR', type: 'signal', amount: 1232.74, share: 30, status: 'paid', date: 'Mar 4' },
  { ref: 'E-1030', initials: 'JT', type: 'access', amount: 493.1, share: 12, status: 'paid', date: 'Mar 4' },
  { ref: 'E-1028', initials: 'RK', type: 'capital', amount: 1204.55, share: 46, status: 'paid', date: 'Feb 21' },
  { ref: 'E-1028', initials: 'SP', type: 'signal', amount: 785.58, share: 30, status: 'paid', date: 'Feb 21' },
  { ref: 'E-1026', initials: 'DV', type: 'capital', amount: 2098.34, share: 46, status: 'paid', date: 'Feb 18' },
  { ref: 'E-1026', initials: 'MR', type: 'signal', amount: 1368.05, share: 30, status: 'paid', date: 'Feb 18' },
  { ref: 'E-1026', initials: 'JT', type: 'access', amount: 547.22, share: 12, status: 'paid', date: 'Feb 18' },
  { ref: 'E-1024', initials: 'RK', type: 'capital', amount: 2215.6, share: 46, status: 'paid', date: 'Feb 14' },
  { ref: 'E-1024', initials: 'SP', type: 'signal', amount: 1444.3, share: 30, status: 'paid', date: 'Feb 14' },
  { ref: 'E-1024', initials: 'JT', type: 'access', amount: 578.0, share: 12, status: 'paid', date: 'Feb 14' },
  { ref: 'E-1022', initials: 'DV', type: 'capital', amount: 1854.12, share: 46, status: 'paid', date: 'Feb 11' },
  { ref: 'E-1022', initials: 'SP', type: 'signal', amount: 1210.72, share: 30, status: 'paid', date: 'Feb 11' },
  { ref: 'E-1022', initials: 'JT', type: 'access', amount: 484.29, share: 12, status: 'paid', date: 'Feb 11' },
  { ref: 'E-1020', initials: 'RK', type: 'capital', amount: 2543.98, share: 46, status: 'paid', date: 'Feb 7' },
  { ref: 'E-1020', initials: 'MR', type: 'signal', amount: 1658.68, share: 30, status: 'paid', date: 'Feb 7' },
  { ref: 'E-1020', initials: 'JT', type: 'access', amount: 663.47, share: 12, status: 'paid', date: 'Feb 7' },
  { ref: 'E-1018', initials: 'DV', type: 'capital', amount: 1722.45, share: 46, status: 'paid', date: 'Feb 4' },
  { ref: 'E-1018', initials: 'MR', type: 'signal', amount: 1122.98, share: 30, status: 'paid', date: 'Feb 4' },
  { ref: 'E-1018', initials: 'JT', type: 'access', amount: 449.19, share: 12, status: 'paid', date: 'Feb 4' },
  { ref: 'E-1016', initials: 'RK', type: 'capital', amount: 1997.23, share: 46, status: 'paid', date: 'Jan 31' },
  { ref: 'E-1016', initials: 'SP', type: 'signal', amount: 1302.54, share: 30, status: 'paid', date: 'Jan 31' },
  { ref: 'E-1016', initials: 'JT', type: 'access', amount: 521.01, share: 12, status: 'paid', date: 'Jan 31' },
  { ref: 'E-1014', initials: 'DV', type: 'capital', amount: 1567.8, share: 46, status: 'paid', date: 'Jan 28' },
  { ref: 'E-1014', initials: 'MR', type: 'signal', amount: 1022.48, share: 30, status: 'paid', date: 'Jan 28' },
  { ref: 'E-1012', initials: 'RK', type: 'capital', amount: 2320.15, share: 46, status: 'paid', date: 'Jan 25' },
  { ref: 'E-1012', initials: 'SP', type: 'signal', amount: 1510.52, share: 30, status: 'paid', date: 'Jan 25' },
  { ref: 'E-1012', initials: 'JT', type: 'access', amount: 604.2, share: 12, status: 'paid', date: 'Jan 25' },
  { ref: 'E-1010', initials: 'DV', type: 'capital', amount: 1888.42, share: 46, status: 'paid', date: 'Jan 21' },
  { ref: 'E-1010', initials: 'MR', type: 'signal', amount: 1221.38, share: 30, status: 'paid', date: 'Jan 21' },
  { ref: 'E-1010', initials: 'JT', type: 'access', amount: 488.55, share: 12, status: 'paid', date: 'Jan 21' },
  { ref: 'E-1008', initials: 'RK', type: 'capital', amount: 1764.9, share: 46, status: 'paid', date: 'Jan 18' },
  { ref: 'E-1008', initials: 'SP', type: 'signal', amount: 1148.51, share: 30, status: 'paid', date: 'Jan 18' },
  { ref: 'E-1008', initials: 'JT', type: 'access', amount: 459.4, share: 12, status: 'paid', date: 'Jan 18' },
  { ref: 'E-1006', initials: 'DV', type: 'capital', amount: 2410.77, share: 46, status: 'paid', date: 'Jan 15' },
  { ref: 'E-1006', initials: 'SP', type: 'signal', amount: 1571.87, share: 30, status: 'paid', date: 'Jan 15' },
  { ref: 'E-1004', initials: 'RK', type: 'capital', amount: 1981.36, share: 46, status: 'paid', date: 'Jan 11' },
  { ref: 'E-1004', initials: 'MR', type: 'signal', amount: 1290.18, share: 30, status: 'paid', date: 'Jan 11' },
  { ref: 'E-1004', initials: 'JT', type: 'access', amount: 516.07, share: 12, status: 'paid', date: 'Jan 11' },
  { ref: 'E-1002', initials: 'DV', type: 'capital', amount: 2156.09, share: 46, status: 'paid', date: 'Jan 8' },
  { ref: 'E-1002', initials: 'MR', type: 'signal', amount: 1402.18, share: 30, status: 'paid', date: 'Jan 8' },
  { ref: 'E-1002', initials: 'JT', type: 'access', amount: 560.87, share: 12, status: 'paid', date: 'Jan 8' },
  { ref: 'E-1000', initials: 'RK', type: 'capital', amount: 1640.55, share: 46, status: 'paid', date: 'Jan 4' },
  { ref: 'E-1000', initials: 'SP', type: 'signal', amount: 1068.74, share: 30, status: 'paid', date: 'Jan 4' },
  { ref: 'E-1000', initials: 'JT', type: 'access', amount: 427.5, share: 12, status: 'paid', date: 'Jan 4' },
];

/**
 * 48 canonical ledger rows. The pool-wide GET /payouts ledger is a
 * draft contract (reference gap §4.2) — backend pack adds
 * docs/apis/07-payouts-api.md. payout_id sequential, member_id from the
 * wireframe member initials, created_at = the wireframe display date.
 */
export const SEED_PAYOUTS: PayoutLedgerRow[] = PAYOUT_SEED_ROWS.map((r, i) => ({
  payout_id: `pay_${String(i + 1).padStart(4, '0')}`,
  execution_ref: r.ref,
  member_id: MEMBER_ID_BY_INITIALS[r.initials],
  type: PAYOUT_TYPE[r.type],
  amount: money(r.amount),
  share: r.share,
  status: r.status === 'paid' ? 'COMPLETED' : 'PENDING',
  created_at: isoFromDisplayDate(r.date),
}));

/** Execution titles for the mine-payouts rows (known from the executions dataset). */
const EXECUTION_TITLE_BY_REF: Record<string, string> = Object.fromEntries(
  SEED_EXECUTIONS.map((e) => [e.execution_id, e.opportunity.title]),
);

/** Mine payouts subset (first 9 ledger rows: E-1039 + E-1030 + E-1028). */
export const SEED_PAYOUT_LIST: PayoutListItem[] = SEED_PAYOUTS.slice(0, 9).map((p) => ({
  payout_id: p.payout_id,
  opportunity_title: EXECUTION_TITLE_BY_REF[p.execution_ref] ?? `Execution ${p.execution_ref}`,
  type: p.type,
  amount: p.amount,
  status: p.status,
  completed_at: p.created_at,
}));

/** Mine payout summary from the profile page payouts card (1847.23 = 1162.40 + 482.10 + 202.73). */
export const SEED_PAYOUT_SUMMARY: PayoutListSummary = {
  total_earned: '1847.23',
  from_capital: '1162.40',
  from_signals: '482.10',
  from_access: '202.73',
  payouts_count: SEED_PAYOUT_LIST.length,
};

// ─── communities ───────────────────────────────────────────────────────

/**
 * Community ids are the wireframe slugs 'alpha' + 'helia' (gap §4.5:
 * no documented slug field; the v1 mock uses wireframe slugs as ids).
 * 'helia' carries the communities page's second row (Tech Arbitrage)
 * display values unchanged.
 */
export const SEED_COMMUNITIES: CommunityListRow[] = [
  { id: 'alpha', name: 'MERIDIAN Alpha', focus: 'General arbitrage', geographic_scope: 'Global', status: 'active', founded_at: '2024-03-01T00:00:00Z', min_contribution: '1000.00', settings: { open_enrollment: true, require_kyc_at_join: true, vetter_auto_promotion: false }, pool_capital: '1423580.00', member_count: 124, roi_ytd: 18.4, executions_count: 47, open_proposals: 2 },
  { id: 'helia', name: 'Tech Arbitrage', focus: 'Electronics focus', geographic_scope: 'Asia-Pacific', status: 'proposed', founded_at: '2026-02-01T00:00:00Z', min_contribution: '0.00', settings: { open_enrollment: false, require_kyc_at_join: true, vetter_auto_promotion: false }, pool_capital: '0.00', member_count: 23, roi_ytd: 0, executions_count: 0, open_proposals: 0 },
];

/** Detail views — pool figures from the pool/dashboard pages (pool_capital inside stats, gap §4.5). */
export const SEED_COMMUNITY_DETAILS: CommunityDetail[] = [
  { id: 'alpha', name: 'MERIDIAN Alpha', focus: 'General arbitrage', geographic_scope: 'Global', status: 'active', founded_at: '2024-03-01T00:00:00Z', min_contribution: '1000.00', settings: { open_enrollment: true, require_kyc_at_join: true, vetter_auto_promotion: false }, stats: { pool_capital: '1423580.00', available_capital: '936350.00', locked_capital: '487230.00', reserve_ratio: 18.2, member_count: 124, member_composition: { capital_providers: 42, signal_providers: 67, access_providers: 15 }, roi_ytd: 18.4, executions_count: 47, executions_active: 3, open_proposals: 2 }, safety_rails: ['Integrity verification', 'Reconciliation checks', 'No-ponzi mechanics', 'Human control override', 'KYC & identity rules'] },
  { id: 'helia', name: 'Tech Arbitrage', focus: 'Electronics focus', geographic_scope: 'Asia-Pacific', status: 'proposed', founded_at: '2026-02-01T00:00:00Z', min_contribution: '0.00', settings: { open_enrollment: false, require_kyc_at_join: true, vetter_auto_promotion: false }, stats: { pool_capital: '0.00', available_capital: '0.00', locked_capital: '0.00', reserve_ratio: 0, member_count: 23, member_composition: { capital_providers: 0, signal_providers: 0, access_providers: 0 }, roi_ytd: 0, executions_count: 0, executions_active: 0, open_proposals: 0 }, safety_rails: ['Integrity verification', 'Reconciliation checks', 'No-ponzi mechanics', 'Human control override', 'KYC & identity rules'] },
];

const COMMUNITY_MEMBER_SEED_ROWS: { name: string; role: 'capital' | 'signal' | 'access'; tier: string; reputation: number; joined: string }[] = [
  { name: 'Dana Voss', role: 'capital', tier: 'T4', reputation: 92, joined: '2024-03-01T00:00:00Z' },
  { name: 'Ravi Kumar', role: 'capital', tier: 'T4', reputation: 88, joined: '2024-05-12T00:00:00Z' },
  { name: 'Mike Rivera', role: 'signal', tier: 'T3', reputation: 78, joined: '2024-06-03T00:00:00Z' },
  { name: 'Sarah Park', role: 'signal', tier: 'T3', reputation: 81, joined: '2024-04-22T00:00:00Z' },
  { name: 'Jules Tan', role: 'access', tier: 'T3', reputation: 74, joined: '2024-08-14T00:00:00Z' },
  { name: 'Lena Moreau', role: 'capital', tier: 'T3', reputation: 69, joined: '2024-11-30T00:00:00Z' },
  { name: 'Kenji Honda', role: 'signal', tier: 'T2', reputation: 55, joined: '2025-01-18T00:00:00Z' },
  { name: 'Tomás Alves', role: 'capital', tier: 'T3', reputation: 64, joined: '2025-02-09T00:00:00Z' },
  { name: 'Yuki Nakamura', role: 'access', tier: 'T2', reputation: 48, joined: '2025-04-26T00:00:00Z' },
  { name: 'Omar Nasser', role: 'signal', tier: 'T1', reputation: 22, joined: '2025-09-07T00:00:00Z' },
];

/** 10 members from community-members.page.ts — display_name, lowercase contribution_type, wireframe tier, reputation_score. */
export const SEED_COMMUNITY_MEMBERS: CommunityMemberRow[] = COMMUNITY_MEMBER_SEED_ROWS.map((m) => ({
  member_id: `mem_${slugify(m.name)}`,
  display_name: m.name,
  contribution_type: m.role,
  joined_at: m.joined,
  tier: m.tier,
  reputation_score: m.reputation,
}));

/**
 * Community parameters from the community-settings page Governance
 * Parameters card. NOTE: the settings page values (12% APY etc.) differ
 * from the governance page values — the wireframes disagree (gap §4.9).
 */
export const SEED_COMMUNITY_PARAMETERS: CommunityParameter[] = [
  { key: 'roi_floor', display_name: 'ROI floor', value: '12% APY', unit: '% APY', votable: true, provenance: { proposal_id: 'prop_roi_floor', proposer_display_name: 'Dana Voss', approved_at: '2026-02-14T00:00:00Z', approval_percent: 87 } },
  { key: 'win_rate_target', display_name: 'Win-rate target', value: '85%', unit: '%', votable: true, provenance: { proposal_id: 'prop_win_rate', proposer_display_name: 'Ravi Kumar', approved_at: '2026-01-08T00:00:00Z', approval_percent: 81 } },
  { key: 'capital_share', display_name: 'Capital share', value: '40%', unit: '%', votable: true, provenance: null },
  { key: 'signal_share', display_name: 'Signal share', value: '35%', unit: '%', votable: true, provenance: null },
  { key: 'reserve_ratio', display_name: 'Reserve ratio', value: '25%', unit: '%', votable: true, provenance: { proposal_id: 'prop_reserve', proposer_display_name: 'Dana Voss', approved_at: '2025-12-12T00:00:00Z', approval_percent: 90 } },
  { key: 'single_execution_cap', display_name: 'Single-execution cap', value: '8% of pool', unit: '% of pool', votable: true, provenance: { proposal_id: 'prop_cap', proposer_display_name: 'Ravi Kumar', approved_at: '2025-11-30T00:00:00Z', approval_percent: 84 } },
];

// ─── governance ────────────────────────────────────────────────────────

/** Two active proposals from governance.page.ts (tally numbers verbatim). */
export const SEED_PROPOSALS: ProposalListRow[] = [
  { proposal_id: 'prop_001', target_type: 'PARAMETER', parameter_key: 'roi_floor', display_title: 'Raise ROI floor to 18%', current_value: '15%', proposed_value: '18%', rationale: 'Market conditions support a higher floor.', proposer: { member_id: 'mem_dana-voss', display_name: 'Dana Voss', tier: 'T4' }, status: 'voting', tally: { approve_weighted: 7, reject_weighted: 2, required_weighted_votes: 5, approvals_remaining: 0, your_weight_if_eligible: 1, has_voted: false }, expires_at: '2026-03-19T07:00:00Z', created_at: '2026-03-17T09:00:00Z' },
  { proposal_id: 'prop_002', target_type: 'PARAMETER', parameter_key: 'win_rate_target', display_title: 'Win-rate target 70% → 75%', current_value: '70%', proposed_value: '75%', rationale: 'Recent execution quality supports a tighter target.', proposer: { member_id: 'mem_ravi-kumar', display_name: 'Ravi Kumar', tier: 'T4' }, status: 'voting', tally: { approve_weighted: 4, reject_weighted: 3, required_weighted_votes: 5, approvals_remaining: 1, your_weight_if_eligible: 1, has_voted: false }, expires_at: '2026-03-19T07:00:00Z', created_at: '2026-03-17T09:00:00Z' },
];

/** Detail views derived from the list rows + plausible vote records. */
export const SEED_PROPOSAL_DETAILS: ProposalDetail[] = [
  { ...SEED_PROPOSALS[0], voting_window_hours: 24, applied_at: null, votes: [
    { vote_id: 'vote_101', voter_id: 'mem_jules-tan', voter_display_name: 'Jules Tan', voter_tier: 'T3', vote: 'approve', weight: 1, comment: '', voted_at: '2026-03-17T12:00:00Z' },
    { vote_id: 'vote_102', voter_id: 'mem_sarah-park', voter_display_name: 'Sarah Park', voter_tier: 'T3', vote: 'approve', weight: 1, comment: '', voted_at: '2026-03-17T13:00:00Z' },
    { vote_id: 'vote_103', voter_id: 'mem_mike-rivera', voter_display_name: 'Mike Rivera', voter_tier: 'T3', vote: 'reject', weight: 1, comment: '', voted_at: '2026-03-17T14:00:00Z' },
  ], actions: [{ action_type: 'proposal_created', actor_id: 'mem_dana-voss', occurred_at: '2026-03-17T09:00:00Z' }] },
  { ...SEED_PROPOSALS[1], voting_window_hours: 24, applied_at: null, votes: [
    { vote_id: 'vote_104', voter_id: 'mem_jules-tan', voter_display_name: 'Jules Tan', voter_tier: 'T3', vote: 'approve', weight: 1, comment: '', voted_at: '2026-03-17T12:30:00Z' },
    { vote_id: 'vote_105', voter_id: 'mem_kenji-honda', voter_display_name: 'Kenji Honda', voter_tier: 'T2', vote: 'reject', weight: 1, comment: '', voted_at: '2026-03-17T15:00:00Z' },
  ], actions: [{ action_type: 'proposal_created', actor_id: 'mem_ravi-kumar', occurred_at: '2026-03-17T09:00:00Z' }] },
];

/** Central governance parameters from governance.page.ts cards. */
export const SEED_GOVERNANCE_PARAMETERS: GovernanceParameter[] = [
  { key: 'roi_floor', value: '15%', unit: '%', votable: true },
  { key: 'win_rate_target', value: '70%', unit: '%', votable: true },
  { key: 'reserve_target', value: '12%', unit: '%', votable: true },
  { key: 'single_execution_cap', value: '$50k', unit: 'USD', votable: true },
  { key: 'distribution_shares', value: '46/30/12/8/4', unit: '%', votable: true },
];

/** Safety rails from governance.page.ts (never community-governed). */
export const SEED_SAFETY_RAILS: SafetyRail[] = [
  { key: 'reconciliation_audit_trail', label: 'Reconciliation & audit trail', rationale: 'Every dollar is accounted for and the audit trail is immutable.' },
  { key: 'no_ponzi', label: 'No-ponzi · no unearned returns', rationale: 'Returns come only from realized arbitrage profits.' },
  { key: 'kyc_identity', label: 'KYC & identity rules', rationale: 'Members verify identity before contributing capital.' },
  { key: 'human_control', label: 'Human control over money & reputation', rationale: 'Automation never makes final calls on money or reputation.' },
  { key: 'technical_architecture', label: 'Technical architecture (kernel/engines/providers)', rationale: 'The kernel/engines/providers contract is fixed by design.' },
];

/** Recent votes from governance.page.ts sidebar. */
export const SEED_RECENT_VOTES: RecentVoteRow[] = [
  { proposal_id: 'prop_roi_floor', display_title: 'ROI floor 15%', parameter_key: 'roi_floor', decided_at: '2026-02-14T00:00:00Z', approval_percent: 87, status: 'passed' },
  { proposal_id: 'prop_vetting_timeout', display_title: 'Vetting timeout 48h', parameter_key: 'vetting_timeout', decided_at: '2026-01-22T00:00:00Z', approval_percent: 76, status: 'passed' },
  { proposal_id: 'prop_deployment_cap', display_title: 'Deployment cap 50%', parameter_key: 'deployment_cap', decided_at: '2026-01-08T00:00:00Z', approval_percent: 72, status: 'passed' },
  { proposal_id: 'prop_reserve_floor', display_title: 'Reserve floor 15%', parameter_key: 'reserve_floor', decided_at: '2025-12-03T00:00:00Z', approval_percent: 41, status: 'rejected' },
];

// ─── member + auth ─────────────────────────────────────────────────────

/**
 * The signed-in member, from profile.page.ts (Alex Chen). The wireframe
 * login page pins a different persona (jane@example.com) — both are
 * served as the wireframes render them (DISCOVERY in the file header).
 */
export const SEED_MEMBER: Member = {
  id: 'mem_alexchen', full_name: 'Alex Chen', username: 'alexchen', email: 'alex@meridian.com', status: 'active', email_verified: true, two_factor_enabled: true, roles: ['MEMBER', 'VETTER'], kyc_status: 'VERIFIED',
  profile: { first_name: 'Alex', last_name: 'Chen', display_name: 'Alex Chen', phone: '', country: 'USA', timezone: 'America/Los_Angeles', avatar_url: '' },
  settings: { email_notifications: true, push_notifications: true, newsletter: true },
  created_at: '2024-03-01T00:00:00Z', updated_at: '2026-03-14T00:00:00Z',
};

/** AuthMeMember mirrors /members/me with the UPPER-status + contribution_types variants (gaps §4.8, §4.11). */
export const SEED_AUTH_ME_MEMBER: AuthMeMember = {
  id: SEED_MEMBER.id, email: SEED_MEMBER.email, status: 'ACTIVE',
  profile: { first_name: SEED_MEMBER.profile.first_name, last_name: SEED_MEMBER.profile.last_name, display_name: SEED_MEMBER.profile.display_name },
  roles: SEED_MEMBER.roles, kyc_status: SEED_MEMBER.kyc_status, two_factor_enabled: SEED_MEMBER.two_factor_enabled,
  contribution_types: ['SIGNAL', 'CAPITAL'], created_at: SEED_MEMBER.created_at, last_login_at: '2026-03-18T08:00:00Z',
};

/** Login member pinned by the task contract (jane@example.com). */
export const SEED_LOGIN_MEMBER: LoginMember = {
  id: 'mem_jane',
  email: 'jane@example.com',
  status: 'ACTIVE',
  roles: ['MEMBER', 'VETTER'],
  kyc_status: 'VERIFIED',
  two_factor_enabled: false,
};

export const SEED_NOTIFICATION_PREFS: NotificationPrefs = {
  email_notifications: true,
  push_notifications: true,
  newsletter: true,
};

// ─── notifications ─────────────────────────────────────────────────────

interface NotificationSeedRow {
  id: string;
  title: string;
  caption: string;
  link: string;
  read: boolean;
  time: string;
  type: NotificationItem['type'];
  data?: { payout_id: string; amount: number; type: string };
}

/** 8 rows from notifications.page.ts NOTIFICATIONS export. */
const NOTIFICATION_SEED_ROWS: NotificationSeedRow[] = [
  { id: 'n1', title: 'O-2051 needs 1 more vote to approve', caption: 'Vetting closes in 18h — the Bulk Lego Set Resale is 4/5 weighted votes.', link: '/opportunities/O-2051', read: false, time: '2m ago', type: 'EXECUTION_STARTED' },
  { id: 'n2', title: 'E-1042 · Size 10.5 sold on GOAT', caption: '$2,880 recovered — 3 of 8 items sold, ROI tracking at +12.4%.', link: '/executions/E-1042', read: false, time: '1h ago', type: 'EXECUTION_FIRST_SALE', data: { payout_id: '', amount: 2880, type: 'EXECUTION' } },
  { id: 'n3', title: 'Reserve ratio steady at 18.2%', caption: 'Above the 12% community target. No action needed.', link: '/pool', read: false, time: '3h ago', type: 'EXECUTION_COMPLETED' },
  { id: 'n4', title: 'Payout preview updated for E-1039', caption: 'Projected net profit $5,982 · distribution pending vote outcome.', link: '/payouts', read: true, time: '5h ago', type: 'PAYOUT_PENDING', data: { payout_id: 'pay_0001', amount: 5982, type: 'PAYOUT' } },
  { id: 'n5', title: 'New proposal: ROI floor → 18%', caption: 'Dana Voss proposed raising the ROI floor. Vote closes in 22h.', link: '/community/alpha/governance', read: true, time: '8h ago', type: 'EXECUTION_STARTED' },
  { id: 'n6', title: 'Daily reconciliation: BALANCED', caption: 'Every dollar accounted for. Audit trail intact.', link: '/executions/E-1042', read: true, time: 'Yesterday', type: 'EXECUTION_COMPLETED' },
  { id: 'n7', title: 'Reputation milestone: Tier 3 reached', caption: 'Vetting weight now ×1.4. Keep it up.', link: '/profile', read: true, time: '2 days ago', type: 'PAYOUT_COMPLETED' },
  { id: 'n8', title: 'Pool snapshot available', caption: 'The weekly pool.snapshot_taken report is ready to export.', link: '/pool', read: true, time: '3 days ago', type: 'EXECUTION_COMPLETED' },
];

/** NotificationItem is a mock/UI extension; shape contract: docs/apis/08-notifications-api.md. */
export const SEED_NOTIFICATIONS: NotificationItem[] = NOTIFICATION_SEED_ROWS.map((n) => ({
  id: n.id,
  type: n.type,
  title: n.title,
  body: n.caption,
  ...(n.data ? { data: n.data } : {}),
  read: n.read,
  created_at: isoFromRelative(n.time),
  route: n.link,
}));

// ─── capital ───────────────────────────────────────────────────────────

/** Balance from the pool page + dashboard (member-level figures). */
export const SEED_BALANCE: BalanceInfo = {
  balances: { available: '12500.00', locked: '0.00', pending_deposit: '0.00', pending_withdrawal: '0.00', total: '12500.00' },
  lifetime: { total_deposited: '15000.00', total_withdrawn: '0.00', total_earned: '1847.23' },
  withdrawal_limits: { min_amount: '100.00', max_single: '5000.00', daily_limit: '20000.00', daily_used: '0.00', daily_remaining: '20000.00' },
  next_payout_estimate: { amount: '412.50', expected_date: '2026-03-20' },
};

/** 3 transactions with natural references (allocation/distribution/release). */
export const SEED_TRANSACTIONS: CapitalTransaction[] = [
  { id: 'tx_003', type: 'ALLOCATION', amount: '-1800.00', description: 'Allocated to E-1042 · Limited Edition Sneaker Resale', reference: { type: 'EXECUTION', id: 'E-1042' }, balance_after: '12500.00', created_at: '2026-03-06T09:00:00Z' },
  { id: 'tx_002', type: 'DISTRIBUTION', amount: '412.50', description: 'Payout received · E-1030', reference: { type: 'PAYOUT', id: 'pay_0030' }, balance_after: '14300.00', created_at: '2026-03-04T09:00:00Z' },
  { id: 'tx_001', type: 'RELEASE', amount: '3100.00', description: 'Released from E-1039 · Vintage Watch Liquidation', reference: { type: 'EXECUTION', id: 'E-1039' }, balance_after: '13887.50', created_at: '2026-02-20T09:00:00Z' },
];

/** Public pool status from the pool + dashboard KPIs ($1,423,580 total, $487,230 locked, reserve 18.2%). */
export const SEED_POOL_STATUS: PoolStatus = {
  totals: { total_capital: '1423580.00', available_capital: '936350.00', deployed_capital: '487230.00' },
  health: { status: 'HEALTHY', reserve_ratio: 18.2, deployment_ratio: 34.2 },
  activity: { active_executions: 3, contributors_count: 42 },
  performance: { avg_roi_30d: 12.4, total_profit_30d: '5982.00', executions_completed_30d: 3 },
  snapshot_at: '2026-03-18T09:00:00Z',
};

// ─── seedGateway ───────────────────────────────────────────────────────

const TOKEN = 'mock_access_token_2026';
const REFRESH = 'mock_refresh_token_2026';

/** Register every wireframe route on a fresh gateway. Returns nothing (routes live on the gateway). */
export function seedGateway(gateway: MockGateway): void {
  // ── Auth ────────────────────────────────────────────────────────────
  gateway.register('POST', '/auth/login', () => ({
    access_token: TOKEN,
    refresh_token: REFRESH,
    token_type: 'Bearer',
    expires_in: 900,
    member: SEED_LOGIN_MEMBER,
  }));
  gateway.register('GET', '/auth/me', () => ({
    member: SEED_AUTH_ME_MEMBER,
    session: { created_at: '2026-03-18T08:00:00Z', expires_at: '2026-03-18T08:15:00Z' },
  }));
  // POST /auth/register — contract: docs/apis/01-auth-api.md. Echoes the
  // payload email back in the envelope (shapes: member.ts RegisterResponse).
  gateway.register('POST', '/auth/register', (ctx) => {
    const email = (ctx.body as { email?: string } | undefined)?.email ?? 'new@example.com';
    return {
      member_id: 'mem_new_' + email.split('@')[0],
      email,
      status: 'ACTIVE',
      message: 'Account created — verification email sent.',
    } satisfies RegisterResponse;
  });
  // POST /auth/login/2fa — contract: docs/apis/01-auth-api.md. A valid
  // temp_token (any non-empty) completes the second factor and issues
  // a token pair (shapes: member.ts TwoFactorLoginResponse).
  gateway.register('POST', '/auth/login/2fa', (ctx) => {
    const temp_token = (ctx.body as { temp_token?: string } | undefined)?.temp_token ?? '';
    if (!temp_token) {
      throw new ApiError('AUTH_TOKEN_INVALID', 'Missing or expired 2FA temp token.', {});
    }
    return {
      access_token: TOKEN,
      refresh_token: REFRESH,
      token_type: 'Bearer',
      expires_in: 900,
    } satisfies TwoFactorLoginResponse;
  });
  // POST /auth/refresh — contract: docs/apis/01-auth-api.md. Rotates to a
  // fresh token pair; a missing refresh token is rejected.
  gateway.register('POST', '/auth/refresh', (ctx) => {
    const refresh_token = (ctx.body as { refresh_token?: string } | undefined)?.refresh_token ?? '';
    if (!refresh_token) {
      throw new ApiError('AUTH_REFRESH_INVALID', 'Missing or revoked refresh token.', {});
    }
    return {
      access_token: TOKEN,
      refresh_token: REFRESH,
      token_type: 'Bearer',
      expires_in: 900,
    } satisfies AuthTokens;
  });
  // POST /auth/logout — revoke the session (no-op in mock; presence is the contract).
  gateway.register('POST', '/auth/logout', () => ({ success: true }));
  // POST /auth/2fa/setup — initiate 2FA enrollment (dev secret + backup codes).
  gateway.register('POST', '/auth/2fa/setup', () => ({
    secret: 'JBSWY3DPEHPK3PXP',
    qr_code_url: 'data:image/png;base64,dev_qr',
    manual_entry: { account: 'alex@meridian.com', issuer: 'MERIDIAN' },
    backup_codes: ['a1b2c3d4', 'e5f6g7h8', 'i9j0k1l2', 'm3n4o5p6', 'q7r8s9t0'],
  } satisfies TwoFactorSetupResponse));
  // POST /auth/2fa/verify — a 6-digit code enables 2FA in the mock.
  gateway.register('POST', '/auth/2fa/verify', (ctx) => {
    const code = String((ctx.body as { code?: unknown } | undefined)?.code ?? '');
    if (code.trim().length < 6) {
      throw new ApiError('AUTH_2FA_INVALID', 'That code is incorrect. Please try again.', {});
    }
    return { two_factor_enabled: true, message: 'Two-factor authentication enabled' } satisfies TwoFactorStatusResponse;
  });
  // POST /auth/2fa/disable — a valid code + password disables it.
  gateway.register('POST', '/auth/2fa/disable', (ctx) => {
    const code = String((ctx.body as { code?: unknown } | undefined)?.code ?? '');
    if (code.trim().length < 6) {
      throw new ApiError('AUTH_2FA_INVALID', 'That code is incorrect. Please try again.', {});
    }
    return { two_factor_enabled: false, message: 'Two-factor authentication disabled' } satisfies TwoFactorStatusResponse;
  });

  // ── Capital ─────────────────────────────────────────────────────────
  gateway.register('GET', '/capital/balance', () => SEED_BALANCE);
  gateway.register('GET', '/capital/transactions', () => ({ transactions: SEED_TRANSACTIONS }));
  gateway.register('GET', '/capital/pool/status', () => SEED_POOL_STATUS);
  gateway.register('POST', '/capital/deposits', (ctx) => {
    const amount = (ctx.body as { amount?: string } | undefined)?.amount ?? '0.00';
    return {
      deposit_id: 'dep_001',
      amount,
      status: 'PENDING',
      payment: { provider: 'STRIPE', client_secret: 'cs_mock_secret', publishable_key: 'pk_mock_publishable' },
      fees: { processing_fee: '0.00', net_deposit: amount },
      expires_at: '2026-03-18T09:30:00Z',
    } satisfies DepositResponse;
  });
  gateway.register('POST', '/capital/withdrawals', (ctx) => {
    const amount = (ctx.body as { amount?: string } | undefined)?.amount ?? '0.00';
    return {
      withdrawal_id: 'wd_001',
      amount,
      fee: '0.00',
      net_amount: amount,
      status: 'PENDING',
      method: { type: 'BANK_ACCOUNT', details: {} },
      requires_2fa: Number(amount) > 1000,
      estimated_arrival: '2026-03-20T00:00:00Z',
    } satisfies WithdrawalResponse;
  });

  // ── Opportunities ───────────────────────────────────────────────────
  gateway.register('GET', '/opportunities', () => ({ opportunities: SEED_OPPORTUNITIES, summary: SEED_OPPORTUNITY_SUMMARY }));
  gateway.register('GET', '/opportunities/mine', () => ({ opportunities: SEED_OPPORTUNITIES, summary: SEED_OPPORTUNITY_SUMMARY }));
  gateway.register('GET', '/vetting/queue', () => ({ opportunities: SEED_VETTING_QUEUE }));
  gateway.registerPattern('GET', '/opportunities/:id', (ctx) =>
    opportunityDetailFromRow(SEED_OPPORTUNITIES.find((o) => o.opportunity_id === ctx.params?.['id']) ?? SEED_OPPORTUNITIES[0]),
  );
  gateway.registerPattern('POST', '/opportunities/:id/vote', (ctx) => {
    const vote = (ctx.body as { vote?: 'APPROVE' | 'REJECT' } | undefined)?.vote ?? 'APPROVE';
    return {
      vote_id: 'vote_001',
      opportunity_id: ctx.params?.['id'] ?? '',
      vote,
      vetting_status: { votes_for: 5, votes_against: 2, votes_needed: VOTES_NEEDED, status: 'IN_PROGRESS' },
      reputation_earned: 1,
    } satisfies VettingVoteResponse;
  });

  // ── Executions ──────────────────────────────────────────────────────
  // Contract: docs/apis/04b-executions-api.md (list board endpoint
  // documented there as the canonical surface).
  gateway.register('GET', '/executions', () => ({ executions: SEED_EXECUTIONS }));
  gateway.registerPattern('GET', '/executions/:id', (ctx) =>
    SEED_EXECUTIONS.find((e) => e.execution_id === ctx.params?.['id']) ?? SEED_EXECUTIONS[0],
  );

  // ── Payouts ─────────────────────────────────────────────────────────
  // Pool-wide ledger — contract: docs/apis/07-payouts-api.md.
  gateway.register('GET', '/payouts', () => ({ payouts: SEED_PAYOUTS }));
  gateway.register('GET', '/members/me/payouts', () => ({ payouts: SEED_PAYOUT_LIST, summary: SEED_PAYOUT_SUMMARY }));

  // ── Communities ─────────────────────────────────────────────────────
  gateway.register('GET', '/communities', () => ({ communities: SEED_COMMUNITIES }));
  gateway.registerPattern('GET', '/communities/:id', (ctx) =>
    SEED_COMMUNITY_DETAILS.find((c) => c.id === ctx.params?.['id']) ?? SEED_COMMUNITY_DETAILS[0],
  );
  gateway.registerPattern('GET', '/communities/:id/members', () => ({ members: SEED_COMMUNITY_MEMBERS }));
  gateway.registerPattern('GET', '/communities/:id/parameters', () => ({ parameters: SEED_COMMUNITY_PARAMETERS }));

  // ── Governance ──────────────────────────────────────────────────────
  gateway.register('GET', '/governance/proposals', () => ({ proposals: SEED_PROPOSALS }));
  gateway.registerPattern('GET', '/governance/proposals/:id', (ctx) =>
    SEED_PROPOSAL_DETAILS.find((p) => p.proposal_id === ctx.params?.['id']) ?? SEED_PROPOSAL_DETAILS[0],
  );
  gateway.registerPattern('POST', '/governance/proposals/:id/vote', (ctx) => {
    const vote = (ctx.body as { vote?: 'approve' | 'reject' } | undefined)?.vote ?? 'approve';
    return {
      vote_id: 'vote_200',
      proposal_id: ctx.params?.['id'] ?? '',
      vote,
      weight: 1,
      tally: {
        approve_weighted: 5,
        reject_weighted: 3,
        required_weighted_votes: 5,
        approvals_remaining: 0,
        your_weight_if_eligible: 1,
        has_voted: true,
      },
      reputation_earned: 1,
    } satisfies ProposalVoteResponse;
  });
  gateway.register('GET', '/governance/parameters', () => ({ parameters: SEED_GOVERNANCE_PARAMETERS }));
  gateway.register('GET', '/governance/safety-rails', () => ({ rails: SEED_SAFETY_RAILS }));
  gateway.register('GET', '/governance/recent-votes', () => ({ votes: SEED_RECENT_VOTES }));

  // ── Members + notifications ─────────────────────────────────────────
  gateway.register('GET', '/members/me', () => SEED_MEMBER);
  gateway.register('GET', '/members/me/settings', () => ({ settings: SEED_NOTIFICATION_PREFS }));
  // GET /notifications shape contract: docs/apis/08-notifications-api.md.
  gateway.register('GET', '/notifications', () => ({ notifications: SEED_NOTIFICATIONS }));
}
