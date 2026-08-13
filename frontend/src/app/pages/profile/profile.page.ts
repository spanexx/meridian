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
 * @reviewed 2026-08-13
 */
import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';

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

@Component({
  selector: 'app-profile-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent],
  templateUrl: './profile.template.html',
})
export class ProfilePageComponent {
  // ─── Dataset (mock for the signed-in user) ───────────────────────────
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

  readonly identity = {
    email: 'alex@meridian.com',
    kyc: 'Verified',
    twofa: 'TOTP',
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

  /** Sign out handler (no-op for mock; production would clear session). */
  signOut(): void {
    // DISCOVERY 2026-08-13: no real auth wired in this scaffold.
    // See .agents/skills/playwright-cli/SKILL.md.
    // The user click is acknowledged so the button is testable, but the
    // session-clearing pipeline is owned by the auth feature pack.
  }
}
