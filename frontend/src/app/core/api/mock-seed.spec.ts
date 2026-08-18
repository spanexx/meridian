/**
 * mock-seed.spec.ts — raw seed array contract tests.
 *
 * Locks the counts and canonical shapes of the exported SEED_* arrays
 * (the gateway route contract + per-domain spot checks live in
 * mock-gateway.spec.ts). Any change to a display value, count, or enum
 * casing in mock-seed.ts fails CI here, keeping the wireframe world
 * stable for pages and specs.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { MockGateway } from './mock-gateway';
import {
  seedGateway,
  SEED_COMMUNITIES,
  SEED_COMMUNITY_MEMBERS,
  SEED_EXECUTIONS,
  SEED_NOTIFICATIONS,
  SEED_OPPORTUNITIES,
  SEED_PAYOUTS,
} from './mock-seed';

describe('mock seed arrays', () => {
  it('seeds 24 canonical opportunity rows with the wireframe dataset', () => {
    expect(SEED_OPPORTUNITIES).toHaveLength(24);
    expect(new Set(SEED_OPPORTUNITIES.map((o) => o.opportunity_id)).size).toBe(24);
    expect(SEED_OPPORTUNITIES[0].title).toBe('Bulk Lego Set Resale');
    expect(SEED_OPPORTUNITIES[23].title).toBe('Professional Espresso Machine');
    for (const o of SEED_OPPORTUNITIES) {
      expect(o.category).toMatch(/^[A-Z_]+$/);
      expect(typeof o.financials?.estimated_roi).toBe('number');
      expect(o.submitted_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('converts all 48 payout rows to the ledger shape with string amounts', () => {
    expect(SEED_PAYOUTS).toHaveLength(48);
    expect(SEED_PAYOUTS[0]).toMatchObject({ execution_ref: 'E-1039', type: 'CAPITAL', amount: '2340.80', share: 46, status: 'PENDING' });
    expect(SEED_PAYOUTS[7]).toMatchObject({ execution_ref: 'E-1028', member_id: 'mem_sp', type: 'SIGNAL', status: 'COMPLETED' });
    for (const p of SEED_PAYOUTS) {
      expect(typeof p.amount).toBe('string');
      expect(p.amount).toMatch(/^-?\d+\.\d{2}$/);
      expect(p.type).toMatch(/^(CAPITAL|SIGNAL|ACCESS|OPERATIONS)$/);
      expect(p.status).toMatch(/^(PENDING|COMPLETED)$/);
      expect(p.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('seeds 16 executions with E-1042 carrying the detail-page capital', () => {
    expect(SEED_EXECUTIONS).toHaveLength(16);
    const e1042 = SEED_EXECUTIONS.find((e) => e.execution_id === 'E-1042');
    expect(e1042).toBeDefined();
    expect(e1042?.capital).toMatchObject({ allocated: '18500.00', spent: '18200.00', recovered: '4280.00' });
    expect(e1042?.inventory).toMatchObject({ total_items: 8, sold: 3, listed: 5 });
    expect(e1042?.financials.projected_profit).toBe('4061.00');
  });

  it('seeds 10 community members with lowercase contribution types', () => {
    expect(SEED_COMMUNITY_MEMBERS).toHaveLength(10);
    expect(SEED_COMMUNITY_MEMBERS[0]).toMatchObject({ member_id: 'mem_dana-voss', display_name: 'Dana Voss', tier: 'T4', reputation_score: 92 });
    for (const m of SEED_COMMUNITY_MEMBERS) {
      expect(m.contribution_type).toMatch(/^(capital|signal|access|operator|admin)$/);
    }
  });

  it('seeds alpha + helia as the community list', () => {
    expect(SEED_COMMUNITIES.map((c) => c.id)).toEqual(['alpha', 'helia']);
    expect(SEED_COMMUNITIES[0]).toMatchObject({ name: 'MERIDIAN Alpha', member_count: 124, roi_ytd: 18.4, pool_capital: '1423580.00' });
  });

  it('seeds the 8 wireframe notifications (3 unread) with canonical types', () => {
    expect(SEED_NOTIFICATIONS).toHaveLength(8);
    expect(SEED_NOTIFICATIONS.map((n) => n.id)).toEqual(['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8']);
    expect(SEED_NOTIFICATIONS.filter((n) => !n.read)).toHaveLength(3);
    for (const n of SEED_NOTIFICATIONS) {
      expect(n.type).toMatch(/^[A-Z_]+$/);
      expect(typeof n.route).toBe('string');
      expect(n.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('registers 29 routes on a fresh gateway', () => {
    const gateway = new MockGateway();
    seedGateway(gateway);
    expect(gateway.routesList).toHaveLength(29);
  });
});
