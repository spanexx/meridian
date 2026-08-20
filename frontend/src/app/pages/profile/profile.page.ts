/**
 * ProfilePageComponent — the signed-in user's own private profile.
 *
 * Renders per wireframe/meridian/profile/index.html:
 *   - breadcrumb (Profile > Alex Chen)
 *   - hero: avatar (initials), name + role + tier badge + verified badge,
 *     location + member-since, 3 KPIs (overall / signals / lifetime),
 *     Settings + Sign out buttons
 *   - Reputation card (lg:col-span-2): 4 sub-cards (Signal / Capital /
 *     Access / Community) with score, progress bar, 2 stat rows
 *   - Privileges checklist (4 privileges)
 *   - Payouts side card (capital / signal / access / total)
 *   - Identity side card (email / KYC / 2FA / country)
 *   - Recent Activity table (5 rows: Date / Event / Result / Impact)
 *
 * Route: /profile — no route params. The shell sidebar sets the active
 * route to "profile".
 *
 * Mock data for Alex Chen (Vetter · T3); production would read this
 * from a service keyed by the signed-in user.
 *
 * @owner   spanexx
 * @reviewed 2026-08-19
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';
import { AuthStore } from '../../core/state/auth.store';
import type { KycStatus } from '../../core/models';

interface Reputation {
  readonly key: 'signal' | 'capital' | 'access' | 'community';
  readonly label: string;
  readonly sub: string;
  readonly score: number;
  readonly color: 'violet' | 'emerald' | 'blue' | 'amber';
  readonly icon: string;
  readonly stats: readonly { label: string; value: string; positive?: boolean }[];
}

interface PayoutRow {
  readonly label: string;
  readonly amount: number;
}

interface Activity {
  readonly date: string;
  readonly event: string;
  readonly link: string;
  readonly result: string;
  readonly resultVariant: 'success' | 'warning' | 'info';
  readonly impact: string;
  readonly impactVariant: 'positive' | 'neutral';
}

/** Pack C: human label for each KycStatus enum value. */
const KYC_LABEL: Record<KycStatus, string> = {
  VERIFIED: 'Verified',
  PENDING: 'Pending',
  NOT_STARTED: 'Not started',
  REJECTED: 'Rejected',
};

/** Pack C: badge variant per KYC status (success/warning/default/error). */
const KYC_BADGE_VARIANT: Record<KycStatus, 'badge-success' | 'badge-warning' | 'badge-error' | 'badge'> = {
  VERIFIED: 'badge-success',
  PENDING: 'badge-warning',
  NOT_STARTED: 'badge',
  REJECTED: 'badge-error',
};

@Component({
  selector: 'app-profile-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent],
  templateUrl: './profile.template.html',
})
export class ProfilePageComponent {
  // ─── Session (single source: AuthStore) ──────────────────────────────
  // Pack B (2026-08-19): the signed-in identity now flows from AuthStore
  // (member()), not a per-page mock. loadMe() fills it from /auth/me;
  // the wireframe's static demo content below remains the display source
  // for reputation / payouts / activity until those endpoints land.
  private readonly auth = inject(AuthStore);
  // Pack C: signOut() now flushes the session server-side + navigates /.
  private readonly router = inject(Router);

  /** Display name from the session member (falls back to the wireframe name). */
  readonly displayName = computed(() => this.auth.member()?.profile.display_name ?? 'Alex Chen');
  /** Email from the session member (falls back to the wireframe email). */
  readonly email = computed(() => this.auth.member()?.email ?? 'alex@meridian.com');
  /**
   * Pack C: KYC label reads from the session member. Fallback chain:
   * member.kyc_status → 'NOT_STARTED' (a fresh signed-in user with no
   * KYC record yet) → 'Verified' (preserves the wireframe copy for
   * dev mock data until the member loads).
   */
  readonly kycLabel = computed(() => {
    const status = this.auth.member()?.kyc_status ?? 'NOT_STARTED';
    return KYC_LABEL[status] ?? 'Not started';
  });
  /** Pack C: KYC badge variant mirrors the status (success/warning/etc). */
  readonly kycBadgeVariant = computed(() => {
    const status = this.auth.member()?.kyc_status ?? 'NOT_STARTED';
    return KYC_BADGE_VARIANT[status] ?? 'badge';
  });
  /** Pack C: 2FA label reads `two_factor_enabled` from the session member. */
  readonly twofaLabel = computed(() => (this.auth.member()?.two_factor_enabled ? 'TOTP' : 'Not enabled'));
  readonly user = {
    name: 'Alex Chen',
    initials: 'AC',
    role: 'Vetter',
    tier: 'T3',
    verified: true,
    location: 'San Francisco, CA',
    memberSince: 'March 2024',
    overall: 78,
    signals: { approved: 8, submitted: 14 },
    lifetimeEarned: 1847,
    kpis: [
      { label: 'Overall', value: '78', color: 'violet' as const },
      { label: 'Signals', value: '8 of 14', note: 'approved', color: 'default' as const },
      { label: 'Lifetime', value: '+$1,847', color: 'emerald' as const },
    ],
  };

  readonly reputation: readonly Reputation[] = [
    {
      key: 'signal', label: 'Signal', sub: 'Accuracy', score: 78,
      color: 'violet', icon: 'lightbulb',
      stats: [
        { label: 'Approval rate', value: '57%' },
        { label: 'Avg ROI', value: '+24.6%', positive: true },
      ],
    },
    {
      key: 'capital', label: 'Capital', sub: 'Stability', score: 65,
      color: 'emerald', icon: 'banknote',
      stats: [
        { label: 'Tenure', value: '2y 0m' },
        { label: 'Avg balance', value: '$12,500' },
      ],
    },
    {
      key: 'access', label: 'Access', sub: 'Utilization', score: 42,
      color: 'blue', icon: 'key',
      stats: [
        { label: 'Credentials', value: '1' },
        { label: 'Success rate', value: '100%', positive: true },
      ],
    },
    {
      key: 'community', label: 'Community', sub: 'Participation', score: 85,
      color: 'amber', icon: 'users',
      stats: [
        { label: 'Votes', value: '142 cast' },
        { label: 'Alignment', value: '89%', positive: true },
      ],
    },
  ];

  /** Vetting weight multiplier (tier-based). */
  readonly vettingWeight = '1.4×';

  readonly privileges: readonly string[] = [
    'Can vote',
    'Can operate',
    'Capital share +5%',
    'Max signal $50k',
  ];

  readonly payouts: readonly PayoutRow[] = [
    { label: 'Capital', amount: 1162.40 },
    { label: 'Signal', amount: 482.10 },
    { label: 'Access', amount: 202.73 },
  ];

  /** Sum of the payout rows. */
  readonly totalPayout = this.payouts.reduce((acc, p) => acc + p.amount, 0);

  /**
   * Pack C: identity card now derives email/kyc/2fa from the session
   * member (see computed signals above). The static fallback (country,
   * display name) remains until the wireframe port ships a per-member
   * country — out of Pack C scope.
   */
  readonly identity = {
    country: 'USA',
    countryFlag: '🇺🇸',
  };

  readonly activity: readonly Activity[] = [
    { date: 'Mar 14', event: 'Vote cast on O-2049', link: '/opportunities/O-2049', result: 'Approve', resultVariant: 'success', impact: '+rep', impactVariant: 'positive' },
    { date: 'Mar 12', event: 'Signal O-2045 approved', link: '/opportunities/O-2045', result: 'Approved', resultVariant: 'success', impact: '+rep', impactVariant: 'positive' },
    { date: 'Mar 9', event: 'E-1042 listed', link: '/executions/E-1042', result: 'Live', resultVariant: 'warning', impact: '—', impactVariant: 'neutral' },
    { date: 'Mar 4', event: 'Payout received (E-1030)', link: '/payouts', result: '+$412.50', resultVariant: 'success', impact: '+rep', impactVariant: 'positive' },
    { date: 'Feb 28', event: 'Capital deposit', link: '/pool', result: '+$2,500', resultVariant: 'info', impact: '—', impactVariant: 'neutral' },
  ];

  // ─── Helpers ─────────────────────────────────────────────────────────
  /** Hero gradient for the avatar. */
  readonly avatarGradient = 'var(--gradient-copper)';

  /** Per-color CSS var for the reputation score text. */
  reputationColor(color: 'violet' | 'emerald' | 'blue' | 'amber'): string {
    switch (color) {
      case 'violet': return 'var(--v-400)';
      case 'emerald': return 'var(--e-400)';
      case 'blue': return 'var(--b-400)';
      case 'amber': return 'var(--a-400)';
    }
  }

  /** Per-color icon background tint. */
  reputationTint(color: 'violet' | 'emerald' | 'blue' | 'amber'): string {
    switch (color) {
      case 'violet': return 'rgba(201,138,66,0.12)';
      case 'emerald': return 'rgba(16,185,129,0.12)';
      case 'blue': return 'rgba(96,165,250,0.12)';
      case 'amber': return 'rgba(245,158,11,0.12)';
    }
  }

  /** Number as formatted USD. */
  formatUsd(n: number): string {
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Pack C (2026-08-19): sign-out end-to-end. Calls AuthStore.logout()
   * (server-side revoke best-effort, then local clear) and routes to /
   * where the shell-less marketing landing renders. The auth guard
   * re-evaluates on every navigation, so the cleared session means
   * any /dashboard, /payouts, etc. click bounces back to /login.
   */
  async signOut(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/']);
  }

  constructor() {
    // Pack B: the session member now flows through AuthStore (one
    // source). loadMe() calls /auth/me and fills member(); the hero
    // reads firstName()/email() so a real session replaces the demo
    // identity without touching the wireframe template.
    void this.auth.loadMe();
  }
}
