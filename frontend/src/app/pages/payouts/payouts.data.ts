/**
 * Payouts demo dataset — 48 payout rows ported from
 * wireframe/meridian/payouts/index.html.
 *
 * 3 pending (E-1039) + 45 paid (E-1030, E-1028, then continuing the
 * execution series downward: E-1026, E-1024, ... E-1000). Every row
 * carries a type (capital / signal / access) whose share % is fixed:
 * capital 46%, signal 30%, access 12% — matching the Split Formula card.
 *
 * The first 8 rows exactly reproduce the wireframe table's 8 visible
 * rows (same order, members, amounts, shares, badges, dates); the wire
 * frame's first 7 are the high-fidelity review target.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */

export type PayoutType = 'capital' | 'signal' | 'access';
export type PayoutStatus = 'pending' | 'paid';

export interface PayoutMember {
  initials: string;
  name: string;
  gradient: string; // CSS background for the avatar circle
}

export interface Payout {
  ref: string;
  member: PayoutMember;
  type: PayoutType;
  amount: number; // rendered +$X,XXX.XX
  share: number; // percent
  status: PayoutStatus;
  date: string; // 'Mar 4' for paid, 'est. Mar 18' for pending
}

const dv: PayoutMember = { initials: 'DV', name: 'Dana Voss', gradient: 'var(--gradient-violet)' };
const mr: PayoutMember = { initials: 'MR', name: 'Mike Rivera', gradient: 'var(--gradient-amber)' };
const jt: PayoutMember = { initials: 'JT', name: 'Jules Tan', gradient: 'var(--gradient-blue)' };
const rk: PayoutMember = {
  initials: 'RK',
  name: 'Ravi Kumar',
  gradient: 'var(--gradient-emerald)',
};
const sp: PayoutMember = { initials: 'SP', name: 'Sarah Park', gradient: 'var(--gradient-violet)' };

export const PAYOUTS: Payout[] = [
  // ─── Pending (E-1039) ────────────────────────────────────────────
  {
    ref: 'E-1039',
    member: dv,
    type: 'capital',
    amount: 2340.8,
    share: 46,
    status: 'pending',
    date: 'est. Mar 18',
  },
  {
    ref: 'E-1039',
    member: mr,
    type: 'signal',
    amount: 1526.61,
    share: 30,
    status: 'pending',
    date: 'est. Mar 18',
  },
  {
    ref: 'E-1039',
    member: jt,
    type: 'access',
    amount: 610.64,
    share: 12,
    status: 'pending',
    date: 'est. Mar 18',
  },
  // ─── Paid (E-1030) ───────────────────────────────────────────────
  {
    ref: 'E-1030',
    member: dv,
    type: 'capital',
    amount: 1890.2,
    share: 46,
    status: 'paid',
    date: 'Mar 4',
  },
  {
    ref: 'E-1030',
    member: mr,
    type: 'signal',
    amount: 1232.74,
    share: 30,
    status: 'paid',
    date: 'Mar 4',
  },
  {
    ref: 'E-1030',
    member: jt,
    type: 'access',
    amount: 493.1,
    share: 12,
    status: 'paid',
    date: 'Mar 4',
  },
  // ─── Paid (E-1028) ───────────────────────────────────────────────
  {
    ref: 'E-1028',
    member: rk,
    type: 'capital',
    amount: 1204.55,
    share: 46,
    status: 'paid',
    date: 'Feb 21',
  },
  {
    ref: 'E-1028',
    member: sp,
    type: 'signal',
    amount: 785.58,
    share: 30,
    status: 'paid',
    date: 'Feb 21',
  },
  // ─── Paid (continued series downward: E-1026 … E-1000) ──────────
  {
    ref: 'E-1026',
    member: dv,
    type: 'capital',
    amount: 2098.34,
    share: 46,
    status: 'paid',
    date: 'Feb 18',
  },
  {
    ref: 'E-1026',
    member: mr,
    type: 'signal',
    amount: 1368.05,
    share: 30,
    status: 'paid',
    date: 'Feb 18',
  },
  {
    ref: 'E-1026',
    member: jt,
    type: 'access',
    amount: 547.22,
    share: 12,
    status: 'paid',
    date: 'Feb 18',
  },
  {
    ref: 'E-1024',
    member: rk,
    type: 'capital',
    amount: 2215.6,
    share: 46,
    status: 'paid',
    date: 'Feb 14',
  },
  {
    ref: 'E-1024',
    member: sp,
    type: 'signal',
    amount: 1444.3,
    share: 30,
    status: 'paid',
    date: 'Feb 14',
  },
  {
    ref: 'E-1024',
    member: jt,
    type: 'access',
    amount: 578.0,
    share: 12,
    status: 'paid',
    date: 'Feb 14',
  },
  {
    ref: 'E-1022',
    member: dv,
    type: 'capital',
    amount: 1854.12,
    share: 46,
    status: 'paid',
    date: 'Feb 11',
  },
  {
    ref: 'E-1022',
    member: sp,
    type: 'signal',
    amount: 1210.72,
    share: 30,
    status: 'paid',
    date: 'Feb 11',
  },
  {
    ref: 'E-1022',
    member: jt,
    type: 'access',
    amount: 484.29,
    share: 12,
    status: 'paid',
    date: 'Feb 11',
  },
  {
    ref: 'E-1020',
    member: rk,
    type: 'capital',
    amount: 2543.98,
    share: 46,
    status: 'paid',
    date: 'Feb 7',
  },
  {
    ref: 'E-1020',
    member: mr,
    type: 'signal',
    amount: 1658.68,
    share: 30,
    status: 'paid',
    date: 'Feb 7',
  },
  {
    ref: 'E-1020',
    member: jt,
    type: 'access',
    amount: 663.47,
    share: 12,
    status: 'paid',
    date: 'Feb 7',
  },
  {
    ref: 'E-1018',
    member: dv,
    type: 'capital',
    amount: 1722.45,
    share: 46,
    status: 'paid',
    date: 'Feb 4',
  },
  {
    ref: 'E-1018',
    member: mr,
    type: 'signal',
    amount: 1122.98,
    share: 30,
    status: 'paid',
    date: 'Feb 4',
  },
  {
    ref: 'E-1018',
    member: jt,
    type: 'access',
    amount: 449.19,
    share: 12,
    status: 'paid',
    date: 'Feb 4',
  },
  {
    ref: 'E-1016',
    member: rk,
    type: 'capital',
    amount: 1997.23,
    share: 46,
    status: 'paid',
    date: 'Jan 31',
  },
  {
    ref: 'E-1016',
    member: sp,
    type: 'signal',
    amount: 1302.54,
    share: 30,
    status: 'paid',
    date: 'Jan 31',
  },
  {
    ref: 'E-1016',
    member: jt,
    type: 'access',
    amount: 521.01,
    share: 12,
    status: 'paid',
    date: 'Jan 31',
  },
  {
    ref: 'E-1014',
    member: dv,
    type: 'capital',
    amount: 1567.8,
    share: 46,
    status: 'paid',
    date: 'Jan 28',
  },
  {
    ref: 'E-1014',
    member: mr,
    type: 'signal',
    amount: 1022.48,
    share: 30,
    status: 'paid',
    date: 'Jan 28',
  },
  {
    ref: 'E-1012',
    member: rk,
    type: 'capital',
    amount: 2320.15,
    share: 46,
    status: 'paid',
    date: 'Jan 25',
  },
  {
    ref: 'E-1012',
    member: sp,
    type: 'signal',
    amount: 1510.52,
    share: 30,
    status: 'paid',
    date: 'Jan 25',
  },
  {
    ref: 'E-1012',
    member: jt,
    type: 'access',
    amount: 604.2,
    share: 12,
    status: 'paid',
    date: 'Jan 25',
  },
  {
    ref: 'E-1010',
    member: dv,
    type: 'capital',
    amount: 1888.42,
    share: 46,
    status: 'paid',
    date: 'Jan 21',
  },
  {
    ref: 'E-1010',
    member: mr,
    type: 'signal',
    amount: 1221.38,
    share: 30,
    status: 'paid',
    date: 'Jan 21',
  },
  {
    ref: 'E-1010',
    member: jt,
    type: 'access',
    amount: 488.55,
    share: 12,
    status: 'paid',
    date: 'Jan 21',
  },
  {
    ref: 'E-1008',
    member: rk,
    type: 'capital',
    amount: 1764.9,
    share: 46,
    status: 'paid',
    date: 'Jan 18',
  },
  {
    ref: 'E-1008',
    member: sp,
    type: 'signal',
    amount: 1148.51,
    share: 30,
    status: 'paid',
    date: 'Jan 18',
  },
  {
    ref: 'E-1008',
    member: jt,
    type: 'access',
    amount: 459.4,
    share: 12,
    status: 'paid',
    date: 'Jan 18',
  },
  {
    ref: 'E-1006',
    member: dv,
    type: 'capital',
    amount: 2410.77,
    share: 46,
    status: 'paid',
    date: 'Jan 15',
  },
  {
    ref: 'E-1006',
    member: sp,
    type: 'signal',
    amount: 1571.87,
    share: 30,
    status: 'paid',
    date: 'Jan 15',
  },
  {
    ref: 'E-1004',
    member: rk,
    type: 'capital',
    amount: 1981.36,
    share: 46,
    status: 'paid',
    date: 'Jan 11',
  },
  {
    ref: 'E-1004',
    member: mr,
    type: 'signal',
    amount: 1290.18,
    share: 30,
    status: 'paid',
    date: 'Jan 11',
  },
  {
    ref: 'E-1004',
    member: jt,
    type: 'access',
    amount: 516.07,
    share: 12,
    status: 'paid',
    date: 'Jan 11',
  },
  {
    ref: 'E-1002',
    member: dv,
    type: 'capital',
    amount: 2156.09,
    share: 46,
    status: 'paid',
    date: 'Jan 8',
  },
  {
    ref: 'E-1002',
    member: mr,
    type: 'signal',
    amount: 1402.18,
    share: 30,
    status: 'paid',
    date: 'Jan 8',
  },
  {
    ref: 'E-1002',
    member: jt,
    type: 'access',
    amount: 560.87,
    share: 12,
    status: 'paid',
    date: 'Jan 8',
  },
  {
    ref: 'E-1000',
    member: rk,
    type: 'capital',
    amount: 1640.55,
    share: 46,
    status: 'paid',
    date: 'Jan 4',
  },
  {
    ref: 'E-1000',
    member: sp,
    type: 'signal',
    amount: 1068.74,
    share: 30,
    status: 'paid',
    date: 'Jan 4',
  },
  {
    ref: 'E-1000',
    member: jt,
    type: 'access',
    amount: 427.5,
    share: 12,
    status: 'paid',
    date: 'Jan 4',
  },
];
