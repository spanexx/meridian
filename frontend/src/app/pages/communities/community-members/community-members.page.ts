/**
 * CommunityMembersPageComponent — per-community members list page.
 *
 * Sub-route of /community/:id/members. Members are scoped to one community.
 *
 * Renders per wireframe/meridian/members/index.html.
 *
 * Backend-readiness pack: the page now consumes the injected
 * ApiClient.communityMembers(id) (core/api/api-client.ts) instead of a
 * hardcoded MEMBERS const. The dev MockGateway seeds the same wireframe
 * members (mock-seed.ts SEED_COMMUNITY_MEMBERS, 10 rows). Each canonical
 * CommunityMemberRow carries name/role/tier/reputation; the wireframe-only
 * presentation fields (location, contribution text, signal counts, avatar
 * gradient) are not in the canonical member API yet, so they are supplied
 * by the MODULE-LOCAL MEMBER_PRESENTATION table keyed by display name.
 *
 * Sections:
 *   - header: title + summary subtitle + search input + Tier dropdown
 *   - Tier dropdown menu (5 items: All / T4 / T3 / T2 / T1)
 *   - Role tabs (4: All / Capital / Signal / Access)
 *   - Members table (10 × 7 cols): Member / Role / Tier / Reputation /
 *     Contribution / Signals / chevron
 *   - Pagination: "Showing 8 of 124" + Prev/Next + "1 / 16"
 *   - Empty state
 *
 * Each row links to /community/:id/members/<slug> (per-community route).
 * Each row carries data-category (tier) + data-status (role) attributes.
 *
 * @owner   spanexx
 * @reviewed 2026-08-18
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  Input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../../ui/icon/icon.component';
import { ApiClient } from '../../../core/api/api-client';
import { type CommunityMemberRow, type CommunityContributionType } from '../../../core/models';

export type Tier = 't1' | 't2' | 't3' | 't4';
export type Role = 'capital' | 'signal' | 'access';

export interface Member {
  readonly name: string;
  readonly location: string;
  readonly role: Role;
  readonly tier: Tier;
  readonly reputation: number;
  readonly contributionText: string; // formatted: "$284,500" or "3 creds"
  readonly signalsCount: number;
  readonly signalsPctChange: number | null; // null for "—"
  readonly avatarBg: 'violet' | 'emerald' | 'amber' | 'blue';
}

/**
 * Wireframe-only presentation fields not yet in the canonical member API
 * (location / contribution money / signal counts / avatar gradient).
 * Keyed by display name so they survive the canonical → view mapping.
 */
const MEMBER_PRESENTATION: Readonly<Record<string, Omit<Member, 'name' | 'role' | 'tier' | 'reputation'>>> = {
  'Dana Voss': { location: 'Düsseldorf, DE', contributionText: '$284,500', signalsCount: 4, signalsPctChange: 28, avatarBg: 'violet' },
  'Ravi Kumar': { location: 'London, UK', contributionText: '$198,200', signalsCount: 6, signalsPctChange: 22, avatarBg: 'emerald' },
  'Mike Rivera': { location: 'Boston, US', contributionText: '$3,200', signalsCount: 14, signalsPctChange: 24.6, avatarBg: 'amber' },
  'Sarah Park': { location: 'Seoul, KR', contributionText: '$1,500', signalsCount: 11, signalsPctChange: 31, avatarBg: 'violet' },
  'Jules Tan': { location: 'Singapore, SG', contributionText: '3 creds', signalsCount: 7, signalsPctChange: 19, avatarBg: 'blue' },
  'Lena Moreau': { location: 'Paris, FR', contributionText: '$142,000', signalsCount: 3, signalsPctChange: 16, avatarBg: 'amber' },
  'Kenji Honda': { location: 'Osaka, JP', contributionText: '$800', signalsCount: 9, signalsPctChange: 12, avatarBg: 'amber' },
  'Tomás Alves': { location: 'Lisbon, PT', contributionText: '$96,500', signalsCount: 5, signalsPctChange: 14, avatarBg: 'blue' },
  'Yuki Nakamura': { location: 'Tokyo, JP', contributionText: '1 cred', signalsCount: 2, signalsPctChange: 8, avatarBg: 'violet' },
  'Omar Nasser': { location: 'Cairo, EG', contributionText: '$250', signalsCount: 1, signalsPctChange: null, avatarBg: 'emerald' },
};

/** Map a canonical CommunityMemberRow (API shape) to the wireframe view row. */
const toMember = (m: CommunityMemberRow): Member => {
  const p = MEMBER_PRESENTATION[m.display_name];
  return {
    name: m.display_name,
    location: p?.location ?? '',
    role: m.contribution_type as Role,
    tier: (m.tier.toLowerCase() as Tier) ?? 't1',
    reputation: m.reputation_score,
    contributionText: p?.contributionText ?? '',
    signalsCount: p?.signalsCount ?? 0,
    signalsPctChange: p?.signalsPctChange ?? null,
    avatarBg: p?.avatarBg ?? 'violet',
  };
};

const PAGE_SIZE = 8;
const TOTAL_COUNT = 124;

@Component({
  selector: 'app-community-members-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent],
  templateUrl: './community-members.template.html',
})
export class CommunityMembersPageComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly client = inject(ApiClient);

  constructor() {
    this.load();
  }

  /** Route param :id — defaults to 'alpha' so the page renders without a real binding. */
  @Input() set id(value: string) {
    this._id.set(value || 'alpha');
    this.load();
  }
  get id(): string {
    return this._id();
  }
  private readonly _id = signal<string>('alpha');

  /** True until the first communityMembers() payload resolves (drives the skeleton). */
  readonly loading = signal(true);

  /** All member rows — sourced from the injected ApiClient. */
  private readonly _members = signal<ReadonlyArray<Member>>([]);

  /** Display name for the community (derived from id; v1 mapping). */
  get communityName(): string {
    const map: Readonly<Record<string, string>> = {
      alpha: 'Alpha Syndicate',
      'meridian-prime': 'Meridian Prime',
      'long-tail': 'Long Tail',
    };
    const id = this._id();
    return map[id] ?? (id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Alpha Syndicate');
  }

  /** Capitalised single-line scope tag for the header. */
  get scopeLabel(): string {
    return this.communityName;
  }

  /** Display label for the currently-active role (used by the mobile dropdown trigger). */
  activeRoleLabel(): string {
    const r = this.roles.find((x) => x.value === this._activeRole);
    return r?.label ?? 'All';
  }

  /** Count next to the active role label. */
  activeRoleCount(): number {
    const r = this.roles.find((x) => x.value === this._activeRole);
    return r?.count ?? this.counts.total;
  }

  private _activeTier: 'all' | Tier = 'all';
  private _activeRole: 'all' | Role = 'all';
  private _search = '';
  private _page = 1;

  get activeTier(): 'all' | Tier {
    return this._activeTier;
  }
  get activeRole(): 'all' | Role {
    return this._activeRole;
  }
  get searchQuery(): string {
    return this._search;
  }
  get currentPage(): number {
    return this._page;
  }

  private _tierMenuOpen = false;
  get tierMenuOpen(): boolean {
    return this._tierMenuOpen;
  }

  private _roleMenuOpen = false;
  get roleMenuOpen(): boolean {
    return this._roleMenuOpen;
  }

  // Role counts (displayed in tabs; mock-only; could come from the data layer later).
  readonly counts = {
    total: TOTAL_COUNT,
    capital: 42,
    signal: 67,
    access: 15,
  };

  readonly tiers: ReadonlyArray<{ value: 'all' | Tier; label: string }> = [
    { value: 'all', label: 'All tiers' },
    { value: 't4', label: 'Top contributors' },
    { value: 't3', label: 'Vetters' },
    { value: 't2', label: 'Contributors' },
    { value: 't1', label: 'New' },
  ];

  /** Role options for the mobile dropdown (matches the inline tabs). */
  readonly roles: ReadonlyArray<{ value: 'all' | Role; label: string; count: number }> = [
    { value: 'all', label: 'All', count: this.counts.total },
    { value: 'capital', label: 'Capital', count: this.counts.capital },
    { value: 'signal', label: 'Signal', count: this.counts.signal },
    { value: 'access', label: 'Access', count: this.counts.access },
  ];

  /** Load members via the injected ApiClient and map them to the view. */
  private load(): void {
    this.loading.set(true);
    this.client
      .communityMembers(this._id())
      .then((r) => this._members.set(r.members.map(toMember)))
      .finally(() => this.loading.set(false));
  }

  // ─── Core data accessors ──────────────────────────────────────────────
  members(): ReadonlyArray<Member> {
    return this._members();
  }

  /**
   * Members after tier + role + search filters (used by the template).
   * Pagination is applied downstream — this list is everything matching.
   */
  filteredMembers(): ReadonlyArray<Member> {
    const q = this._search.trim().toLowerCase();
    return this._members().filter((m) => {
      if (this._activeTier !== 'all' && m.tier !== this._activeTier) return false;
      if (this._activeRole !== 'all' && m.role !== this._activeRole) return false;
      if (q && !m.name.toLowerCase().includes(q) && !m.location.toLowerCase().includes(q))
        return false;
      return true;
    });
  }

  /** The 8-row page slice of `filteredMembers()`. */
  pagedMembers(): ReadonlyArray<Member> {
    const start = (this._page - 1) * PAGE_SIZE;
    return this.filteredMembers().slice(start, start + PAGE_SIZE);
  }

  maxPage(): number {
    return Math.max(1, Math.ceil(this.counts.total / PAGE_SIZE));
  }
  pageSize(): number {
    return PAGE_SIZE;
  }

  /** Slug-ify a member name into the URL-safe form used by /community/:id/members/:memberId. */
  slugForName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // strip diacritics (Lena = lena, Tomás = tomas)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /** URL to a single member's public profile, scoped to the current community. */
  memberUrl(name: string): string {
    return `/community/${this._id()}/members/${this.slugForName(name)}`;
  }

  /** Public route-id setter (called by the route loader or in tests). */
  setRouteId(id: string): void {
    this.id = id || 'alpha';
  }

  // ─── Formatters (called from the template) ─────────────────────────
  formatUsd(n: number): string {
    return '$' + n.toLocaleString('en-US');
  }

  formatCreds(n: number): string {
    return `${n} ${n === 1 ? 'cred' : 'creds'}`;
  }

  formatSignals(count: number, pct: number | null): string {
    if (pct === null) return `${count} · —`;
    const sign = pct > 0 ? '+' : '';
    return `${count} · ${sign}${pct}%`;
  }

  /** Render the contribution cell content (USD or cred text). */
  contributionText(member: Member): string {
    return member.contributionText;
  }

  /** 2-letter initials for the avatar circle. */
  initials(name: string): string {
    return name
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
  }

  // ─── Tier dropdown handlers ─────────────────────────────────────────
  openTierMenu(): void {
    this._tierMenuOpen = true;
    this.cdr.markForCheck();
  }
  closeTierMenu(): void {
    this._tierMenuOpen = false;
    this.cdr.markForCheck();
  }
  toggleTierMenu(): void {
    this._tierMenuOpen = !this._tierMenuOpen;
    this.cdr.markForCheck();
  }

  /** Close both dropdowns. Called on Escape and on outside click. */
  closeAllMenus(): void {
    this._tierMenuOpen = false;
    this._roleMenuOpen = false;
    this.cdr.markForCheck();
  }

  closeOnOutsideClick(target: EventTarget | HTMLElement | null): void {
    if (!target) return;
    const el = target as HTMLElement;
    if (el.closest && el.closest('[data-menu-container]')) return;
    this.closeAllMenus();
  }
  selectTier(tier: 'all' | Tier): void {
    this._activeTier = tier;
    this._tierMenuOpen = false;
    this._page = 1;
    this.cdr.markForCheck();
  }

  // ─── Role tabs handler ──────────────────────────────────────────────
  selectRole(role: 'all' | Role): void {
    this._activeRole = role;
    this._roleMenuOpen = false;
    this._page = 1;
    this.cdr.markForCheck();
  }

  // ─── Role dropdown handlers (mobile < sm) ────────────────────────────
  openRoleMenu(): void {
    this._roleMenuOpen = true;
    this.cdr.markForCheck();
  }
  closeRoleMenu(): void {
    this._roleMenuOpen = false;
    this.cdr.markForCheck();
  }
  toggleRoleMenu(): void {
    this._roleMenuOpen = !this._roleMenuOpen;
    this.cdr.markForCheck();
  }

  // ─── Search ─────────────────────────────────────────────────────────
  setSearch(query: string): void {
    this._search = query;
    this._page = 1;
    this.cdr.markForCheck();
  }

  // ─── Pagination ─────────────────────────────────────────────────────
  nextPage(): void {
    if (this._page < this.maxPage()) {
      this._page += 1;
      this.cdr.markForCheck();
    }
  }
  prevPage(): void {
    if (this._page > 1) {
      this._page -= 1;
      this.cdr.markForCheck();
    }
  }
}

