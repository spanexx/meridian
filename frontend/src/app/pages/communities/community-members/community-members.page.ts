/**
 * CommunityMembersPageComponent — per-community members list page.
 *
 * Sub-route of /community/:id/members. Members are scoped to one community.
 *
 * Renders per wireframe/meridian/members/index.html.
 * Sections:
 *   - header: title + summary subtitle + search input + Tier dropdown
 *   - Tier dropdown menu (5 items: All / T4 / T3 / T2 / T1)
 *   - Role tabs (4: All / Capital / Signal / Access)
 *   - Members table (10 × 7 cols): Member / Role / Tier / Reputation / Contribution / Signals / chevron
 *   - Pagination: "Showing 8 of 124" + Prev/Next + "1 / 16"
 *   - Empty state
 *
 * NOTE: each row links to /members/<name> (the existing placeholder route).
 * Each row carries data-category (tier) + data-status (role) attributes for the
 * tier filter and role-tab filters in the wireframe.
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../../ui/icon/icon.component';

export type Tier = 't1' | 't2' | 't3' | 't4';
export type Role = 'capital' | 'signal' | 'access';

export interface Member {
  readonly name: string;
  readonly location: string;
  readonly role: Role;
  readonly tier: Tier;
  readonly reputation: number;
  readonly contributionText: string;  // formatted: "$284,500" or "3 creds"
  readonly signalsCount: number;
  readonly signalsPctChange: number | null;  // null for "—"
  readonly avatarBg: 'violet' | 'emerald' | 'amber' | 'blue';
}

const MEMBERS: ReadonlyArray<Member> = [
  { name: 'Dana Voss',     location: 'Düsseldorf, DE', role: 'capital', tier: 't4', reputation: 92, contributionText: '$284,500', signalsCount: 4, signalsPctChange: 28, avatarBg: 'violet' },
  { name: 'Ravi Kumar',    location: 'London, UK',     role: 'capital', tier: 't4', reputation: 88, contributionText: '$198,200', signalsCount: 6, signalsPctChange: 22, avatarBg: 'emerald' },
  { name: 'Mike Rivera',   location: 'Boston, US',     role: 'signal',  tier: 't3', reputation: 78, contributionText: '$3,200',   signalsCount: 14, signalsPctChange: 24.6, avatarBg: 'amber' },
  { name: 'Sarah Park',    location: 'Seoul, KR',      role: 'signal',  tier: 't3', reputation: 81, contributionText: '$1,500',   signalsCount: 11, signalsPctChange: 31, avatarBg: 'violet' },
  { name: 'Jules Tan',     location: 'Singapore, SG',  role: 'access',  tier: 't3', reputation: 74, contributionText: '3 creds',  signalsCount: 7, signalsPctChange: 19, avatarBg: 'blue' },
  { name: 'Lena Moreau',   location: 'Paris, FR',      role: 'capital', tier: 't3', reputation: 69, contributionText: '$142,000', signalsCount: 3, signalsPctChange: 16, avatarBg: 'amber' },
  { name: 'Kenji Honda',   location: 'Osaka, JP',      role: 'signal',  tier: 't2', reputation: 55, contributionText: '$800',     signalsCount: 9, signalsPctChange: 12, avatarBg: 'amber' },
  { name: 'Tomás Alves',   location: 'Lisbon, PT',     role: 'capital', tier: 't3', reputation: 64, contributionText: '$96,500',  signalsCount: 5, signalsPctChange: 14, avatarBg: 'blue' },
  { name: 'Yuki Nakamura', location: 'Tokyo, JP',      role: 'access',  tier: 't2', reputation: 48, contributionText: '1 cred',   signalsCount: 2, signalsPctChange: 8,  avatarBg: 'violet' },
  { name: 'Omar Nasser',   location: 'Cairo, EG',      role: 'signal',  tier: 't1', reputation: 22, contributionText: '$250',     signalsCount: 1, signalsPctChange: null, avatarBg: 'emerald' },
];

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

  /** Route param :id — defaults to 'alpha' so the page renders without a real binding. */
  @Input() id: string = 'alpha';

  /** Display name for the community (derived from id; v1 mapping). */
  get communityName(): string {
    const map: Readonly<Record<string, string>> = {
      'alpha': 'Alpha Syndicate',
      'meridian-prime': 'Meridian Prime',
      'long-tail': 'Long Tail',
    };
    return map[this.id] ?? (this.id ? this.id.charAt(0).toUpperCase() + this.id.slice(1) : 'Alpha Syndicate');
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

  get activeTier(): 'all' | Tier { return this._activeTier; }
  get activeRole(): 'all' | Role { return this._activeRole; }
  get searchQuery(): string { return this._search; }
  get currentPage(): number { return this._page; }

  private _tierMenuOpen = false;
  get tierMenuOpen(): boolean { return this._tierMenuOpen; }

  private _roleMenuOpen = false;
  get roleMenuOpen(): boolean { return this._roleMenuOpen; }

  // Role counts (displayed in tabs; mock-only; could come from the data layer later).
  readonly counts = {
    total: TOTAL_COUNT,
    capital: 42,
    signal: 67,
    access: 15,
  };

  readonly tiers: ReadonlyArray<{ value: 'all' | Tier; label: string }> = [
    { value: 'all', label: 'All tiers' },
    { value: 't4',  label: 'Top contributors' },
    { value: 't3',  label: 'Vetters' },
    { value: 't2',  label: 'Contributors' },
    { value: 't1',  label: 'New' },
  ];

  /** Role options for the mobile dropdown (matches the inline tabs). */
  readonly roles: ReadonlyArray<{ value: 'all' | Role; label: string; count: number }> = [
    { value: 'all',     label: 'All',     count: this.counts.total },
    { value: 'capital', label: 'Capital', count: this.counts.capital },
    { value: 'signal',  label: 'Signal',  count: this.counts.signal },
    { value: 'access',  label: 'Access',  count: this.counts.access },
  ];

  // ─── Core data accessors ──────────────────────────────────────────────
  members(): ReadonlyArray<Member> { return MEMBERS; }

  /**
   * Members after tier + role + search filters (used by the template).
   * Pagination is applied downstream — this list is everything matching.
   */
  filteredMembers(): ReadonlyArray<Member> {
    const q = this._search.trim().toLowerCase();
    return MEMBERS.filter((m) => {
      if (this._activeTier !== 'all' && m.tier !== this._activeTier) return false;
      if (this._activeRole !== 'all' && m.role !== this._activeRole) return false;
      if (q && !m.name.toLowerCase().includes(q) && !m.location.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  /** The 8-row page slice of `filteredMembers()`. */
  pagedMembers(): ReadonlyArray<Member> {
    const start = (this._page - 1) * PAGE_SIZE;
    return this.filteredMembers().slice(start, start + PAGE_SIZE);
  }

  maxPage(): number { return Math.max(1, Math.ceil(TOTAL_COUNT / PAGE_SIZE)); }
  pageSize(): number { return PAGE_SIZE; }

  /** Slug-ify a member name into the URL-safe form used by /members/:name. */
  slugForName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')   // strip diacritics (Lena = lena, Tomás = tomas)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /** The URL each row links to. */
  memberUrl(name: string): string {
    return `/members/${this.slugForName(name)}`;
  }

  /**
   * Public route-id setter (called by the route loader or in tests).
   * v1: just stores the id; Angular's withComponentInputBinding is not enabled,
   * so the route param doesn't auto-flow into @Input.
   */
  setRouteId(id: string): void {
    this.id = id || 'alpha';
    this.cdr.markForCheck();
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
