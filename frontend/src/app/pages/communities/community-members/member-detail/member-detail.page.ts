/**
 * MemberDetailPageComponent — public profile for a single member.
 *
 * Renders per wireframe/meridian/member-detail/index.html:
 *   - breadcrumb (Members > <name>)
 *   - hero: avatar (initials gradient), name + role badge + verified badge,
 *     location + member-since, 3 KPIs (overall / capital / lifetime earned),
 *     Follow button (toggles state, copies share URL on click)
 *   - Reputation card: 4 sub-cards (Signal / Capital / Access / Community),
 *     each with score, progress bar, sub-text
 *   - Contribution card: 4 stat rows (capital deployed / executions funded /
 *     avg share / privileges)
 *   - Access Credentials card: 1 credential row
 *   - Recent Activity table (Date / Event / Result / Impact) with 4 rows
 *
 * Route: /community/:id/members/:memberId — defaults to "dana-voss" so the page renders
 * before the route binds (matches the project-wide pattern from
 * community-detail).
 *
 * @owner   spanexx
 * @reviewed 2026-08-13
 */
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { UiIconComponent } from '../../../../ui/icon/icon.component';

interface Member {
  readonly name: string;
  readonly ref: string;
  readonly initials: string;
  readonly role: 'capital' | 'signal' | 'access';
  readonly tier: 't1' | 't2' | 't3' | 't4';
  readonly verified: boolean;
  readonly location: string;
  readonly memberSince: string;
  readonly overall: number;
  readonly capitalDeployed: number;
  readonly lifetimeEarned: number;
  readonly reputation: {
    readonly key: 'signal' | 'capital' | 'access' | 'community';
    readonly label: string;
    readonly sub: string;
    readonly score: number;
    readonly color: 'violet' | 'emerald' | 'blue' | 'amber';
    readonly icon: string;
    readonly note: string;
  }[];
  readonly contribution: {
    readonly label: string;
    readonly value: string;
    readonly accent?: 'violet';
  }[];
  readonly credentials: {
    readonly icon: string;
    readonly name: string;
    readonly status: string;
    readonly badge: 'success' | 'warning' | 'info';
  }[];
  readonly activity: {
    readonly date: string;
    readonly event: string;
    readonly link: string;
    readonly result: string;
    readonly resultVariant: 'success' | 'warning' | 'info' | 'danger';
    readonly impact: string;
    readonly impactVariant: 'default' | 'positive' | 'neutral';
  }[];
}

@Component({
  selector: 'app-member-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent, DecimalPipe, TitleCasePipe],
  templateUrl: './member-detail.template.html',
})
export class MemberDetailPageComponent {
  /** Route :name param — wires the page to whatever member was requested. */
  /** Community ref bound from route param `:id`. Defaults to 'alpha'. */
  readonly id = input<string>('alpha');
  /** Member slug bound from route param `:memberId`. Defaults to 'dana-voss'. */
  readonly memberId = input<string>('dana-voss');

  // ─── Dataset (1 row per member slug; production would hit a service) ────
  private readonly members: readonly Member[] = [
    {
      name: 'Dana Voss',
      ref: 'dana-voss',
      initials: 'DV',
      role: 'capital',
      tier: 't4',
      verified: true,
      location: 'Düsseldorf, DE',
      memberSince: 'March 2023',
      overall: 92,
      capitalDeployed: 284500,
      lifetimeEarned: 38240,
      reputation: [
        {
          key: 'signal',
          label: 'Signal',
          sub: 'Accuracy',
          score: 64,
          color: 'violet',
          icon: 'lightbulb',
          note: '4 submitted · 3 approved',
        },
        {
          key: 'capital',
          label: 'Capital',
          sub: 'Stability',
          score: 97,
          color: 'emerald',
          icon: 'banknote',
          note: '2y 4m tenure · never a missed window',
        },
        {
          key: 'access',
          label: 'Access',
          sub: 'Utilization',
          score: 38,
          color: 'blue',
          icon: 'key',
          note: '1 credential · warehouse',
        },
        {
          key: 'community',
          label: 'Community',
          sub: 'Participation',
          score: 88,
          color: 'amber',
          icon: 'users',
          note: '214 votes · 93% alignment',
        },
      ],
      contribution: [
        { label: 'Capital deployed', value: '$284,500' },
        { label: 'Executions funded', value: '23' },
        { label: 'Avg share of pool', value: '20%' },
        { label: 'Privileges', value: 'Vote · Propose · Operate', accent: 'violet' },
      ],
      credentials: [
        {
          icon: 'warehouse',
          name: 'Düsseldorf warehouse',
          status: 'Verified · next available now',
          badge: 'success',
        },
      ],
      activity: [
        {
          date: 'Mar 13',
          event: 'Capital allocation · E-1042',
          link: '/executions/E-1042',
          result: '$3,700',
          resultVariant: 'info',
          impact: 'locked',
          impactVariant: 'neutral',
        },
        {
          date: 'Mar 9',
          event: 'Vote · ROI floor proposal',
          link: '/governance',
          result: 'Approve',
          resultVariant: 'success',
          impact: '+rep',
          impactVariant: 'positive',
        },
        {
          date: 'Mar 4',
          event: 'Payout · E-1030',
          link: '/payouts',
          result: '+$1,890',
          resultVariant: 'success',
          impact: '+rep',
          impactVariant: 'positive',
        },
        {
          date: 'Feb 27',
          event: 'Capital deposit',
          link: '/pool',
          result: '+$25,000',
          resultVariant: 'info',
          impact: '—',
          impactVariant: 'neutral',
        },
      ],
    },
  ];

  private readonly fallback: Member = {
    name: 'Unknown contributor',
    ref: '',
    initials: '??',
    role: 'capital',
    tier: 't1',
    verified: false,
    location: '—',
    memberSince: '—',
    overall: 0,
    capitalDeployed: 0,
    lifetimeEarned: 0,
    reputation: [],
    contribution: [],
    credentials: [],
    activity: [],
  };

  /** Active member object — fallback if slug doesn't match. */
  readonly member = computed<Member>(() => {
    const slug = this.memberId();
    return this.members.find((m) => m.ref === slug) ?? { ...this.fallback, ref: slug };
  });

  /**
   * Community display name keyed by the route-bound community ref.
   * Production: read from a service. For now, the mock dataset only
   * supports 'alpha' (MERIDIAN Alpha Syndicate).
   */
  readonly communityName = computed<string>(() => {
    const ref = this.id();
    if (ref === 'alpha') return 'Alpha Syndicate';
    return ref;
  });

  /** Hero gradient for the avatar (mirrors the wireframe's violet). */
  readonly avatarGradient = 'var(--gradient-copper)';

  /** Follow toggle state. */
  private readonly _following = signal<boolean>(false);
  readonly following = this._following.asReadonly();

  /** Toggle follow state. Wired to the Follow button click. */
  follow(): void {
    this._following.set(!this._following());
  }

  /** Public read accessor for the follow state. */
  isFollowing(): boolean {
    return this._following();
  }

  /** Stable share URL for the profile (community-scoped). */
  shareUrl(): string {
    return `https://meridian.example/community/${this.id()}/members/${this.memberId()}`;
  }

  /** Initials helper for arbitrary names (also exposed for testing). */
  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? '';
    const b = parts[1]?.[0] ?? '';
    return (a + b).toUpperCase();
  }

  /** Per-color CSS var for the reputation score text. */
  reputationColor(color: 'violet' | 'emerald' | 'blue' | 'amber'): string {
    switch (color) {
      case 'violet':
        return 'var(--v-400)';
      case 'emerald':
        return 'var(--e-400)';
      case 'blue':
        return 'var(--b-400)';
      case 'amber':
        return 'var(--a-400)';
    }
  }

  /** Per-color icon background tint. */
  reputationTint(color: 'violet' | 'emerald' | 'blue' | 'amber'): string {
    switch (color) {
      case 'violet':
        return 'rgba(201,138,66,0.12)';
      case 'emerald':
        return 'rgba(16,185,129,0.12)';
      case 'blue':
        return 'rgba(96,165,250,0.12)';
      case 'amber':
        return 'rgba(245,158,11,0.12)';
    }
  }

  /** Capital as formatted USD. */
  formatUsd(n: number): string {
    return `$${n.toLocaleString('en-US')}`;
  }
}
