/**
 * CommunitySettingsPageComponent — per-community settings page.
 *
 * Renders per wireframe/meridian/community-detail/settings/index.html.
 *
 * Backend-readiness pack: the Governance Parameters card now consumes the
 * injected ApiClient.communityParameters(id) (core/api/api-client.ts)
 * instead of the hardcoded GOVERNANCE_PARAMETERS const; the dev
 * MockGateway seeds the same 6 wireframe parameters (mock-seed.ts
 * SEED_COMMUNITY_PARAMETERS). The General card / Members & Roles /
 * Danger Zone are local-configuration display and stay as-is (the
 * detail API does not yet carry editable settings). A loading skeleton
 * covers the parameters fetch.
 *
 * @owner   spanexx
 * @reviewed 2026-08-18
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../../ui/icon/icon.component';
import { UiSwitchComponent } from '../../../ui/switch/switch.component';
import { UiModalComponent } from '../../../ui/modal/modal.component';
import { UiToastComponent } from '../../../ui/toast/toast.component';
import { ApiClient } from '../../../core/api/api-client';
import { type CommunityParameter } from '../../../core/models';

interface CommunitySettings {
  readonly ref: string;
  readonly name: string;
  readonly id: string;
  readonly focus: string;
  readonly region: string;
  readonly description: string;
  readonly minContributionUsd: number;
  readonly status: 'active' | 'proposed' | 'archived';
  readonly members: number;
  readonly totalPoolUsd: number;
  readonly founded: string;
  readonly activeProposals: number;
}

interface GovernanceParameter {
  readonly label: string;
  readonly value: string;
}

interface MemberRole {
  readonly key: 'openEnrollment' | 'requireKyc' | 'vetterAutoPromote';
  readonly title: string;
  readonly description: string;
  readonly initial: boolean;
}

const COMMUNITY_SETTINGS: ReadonlyArray<CommunitySettings> = [
  {
    ref: 'alpha',
    name: 'MERIDIAN Alpha',
    id: 'C-001',
    focus: 'General arbitrage',
    region: 'Global',
    description:
      'MERIDIAN Alpha is the founding community, focused on general arbitrage opportunities across multiple categories including electronics, collectibles, and fashion.',
    minContributionUsd: 1000,
    status: 'active',
    members: 124,
    totalPoolUsd: 1_423_580,
    founded: 'March 2024',
    activeProposals: 2,
  },
];

const MEMBER_ROLES: ReadonlyArray<MemberRole> = [
  {
    key: 'openEnrollment',
    title: 'Open enrollment',
    description: 'Allow new members to join without an invite.',
    initial: true,
  },
  {
    key: 'requireKyc',
    title: 'Require KYC at join',
    description: 'New members must verify identity before contributing.',
    initial: true,
  },
  {
    key: 'vetterAutoPromote',
    title: 'Vetter privilege auto-promotion',
    description: 'Reputation-based automatic Vetter promotion after 90 days.',
    initial: false,
  },
];

const HOW_CHANGES_STEPS: ReadonlyArray<string> = ['Propose', 'Debate', 'Vote', 'Enact'];

const SAFETY_RAILS: ReadonlyArray<string> = [
  'Integrity verification',
  'Reconciliation checks',
  'No-ponzi mechanics',
  'Human control override',
  'KYC & identity rules',
];

@Component({
  selector: 'app-community-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    UiIconComponent,
    UiSwitchComponent,
    UiModalComponent,
    UiToastComponent,
  ],
  templateUrl: './community-settings.template.html',
})
export class CommunitySettingsPageComponent {
  /** Route :id param. Defaults to 'alpha' for the mock dataset. */
  @Input() set id(value: string) {
    this._id.set(value || 'alpha');
    this.loadParameters();
  }
  get id(): string {
    return this._id();
  }
  private readonly _id = signal<string>('alpha');

  /** Manual change-detection trigger (used for OnPush children). */
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly client = inject(ApiClient);

  /** True until the first communityParameters() payload resolves (drives the skeleton). */
  readonly loading = signal(true);

  /** Governance parameters sourced from the injected ApiClient. */
  private readonly _parameters = signal<ReadonlyArray<CommunityParameter>>([]);

  private static readonly COMMUNITIES_BY_REF = new Map<string, CommunitySettings>(
    COMMUNITY_SETTINGS.map((c) => [c.ref, c] as const),
  );

  constructor() {
    this.loadParameters();
  }

  /** Load governance parameters via the injected ApiClient. */
  private loadParameters(): void {
    this.loading.set(true);
    this.client
      .communityParameters(this._id())
      .then((r) => this._parameters.set(r.parameters))
      .finally(() => this.loading.set(false));
  }

  /** The currently-loaded community (null if id not found). */
  get community(): CommunitySettings | null {
    return CommunitySettingsPageComponent.COMMUNITIES_BY_REF.get(this._id()) ?? null;
  }

  /** Mutable status (mutates only via Danger Zone archive flow). */
  private _communityStatus: 'active' | 'proposed' | 'archived' = 'active';
  get communityStatus(): string {
    return this._communityStatus;
  }

  // ─── Editable form fields (General card) ────────────────────────────────
  formName = '';
  formFocus = '';
  formRegion = '';
  formDescription = '';
  formMinContribution = 1000;
  lastSavedAt: string | null = null;

  // ─── Members & Roles ────────────────────────────────────────────────────
  private _roleOpenEnrollment = true;
  private _roleRequireKyc = true;
  private _roleVetterAutoPromote = false;
  get roleOpenEnrollment(): boolean { return this._roleOpenEnrollment; }
  get roleRequireKyc(): boolean { return this._roleRequireKyc; }
  get roleVetterAutoPromote(): boolean { return this._roleVetterAutoPromote; }
  setRoleOpenEnrollment(v: boolean): void { this._roleOpenEnrollment = v; this.cdr.markForCheck(); }
  setRoleRequireKyc(v: boolean): void { this._roleRequireKyc = v; this.cdr.markForCheck(); }
  setRoleVetterAutoPromote(v: boolean): void { this._roleVetterAutoPromote = v; this.cdr.markForCheck(); }

  // ─── Governance Parameters + proposal flow ─────────────────────────────
  private _proposalsCount = 0;
  private _lastProposalLabel: string | null = null;
  get proposalsCount(): number { return this._proposalsCount; }
  get lastProposalLabel(): string | null { return this._lastProposalLabel; }
  governanceParameters(): ReadonlyArray<GovernanceParameter> {
    return this._parameters().map((p) => ({ label: p.display_name, value: p.value ?? '' }));
  }
  /** Called when a Propose button is clicked. Stamps the count + label. */
  onPropose(label: string): void {
    this._proposalsCount += 1;
    this._lastProposalLabel = label;
    this.cdr.markForCheck();
  }

  // ─── Danger Zone state ──────────────────────────────────────────────────
  private _archiveModalOpen = false;
  get archiveModalOpen(): boolean { return this._archiveModalOpen; }
  /** Open the archive confirm modal. */
  onArchive(): void {
    this._archiveModalOpen = true;
    this.cdr.markForCheck();
  }
  /** Dismiss the modal without action. */
  closeArchiveModal(): void {
    this._archiveModalOpen = false;
    this.cdr.markForCheck();
  }
  /** Confirm: flip community status to 'archived' and close the modal. */
  confirmArchive(): void {
    this._communityStatus = 'archived';
    this._archiveModalOpen = false;
    this.cdr.markForCheck();
  }
  /** Transfer admin role (mock: returns a status string for the caller). */
  onTransferAdmin(): string {
    return 'transfer-initiated';
  }

  // ─── How changes work (sidebar card) ───────────────────────────────────
  howChangesSteps(): ReadonlyArray<string> {
    return HOW_CHANGES_STEPS;
  }

  // ─── Static option lists ────────────────────────────────────────────────
  readonly focusOptions = ['General arbitrage', 'Electronics', 'Collectibles', 'Fashion & apparel', 'Regional'];
  readonly regionOptions = ['Global', 'North America', 'Europe', 'Asia-Pacific', 'Latin America'];
  readonly memberRoles = MEMBER_ROLES;

  // ─── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    const c = this.community;
    if (c) {
      this.formName = c.name;
      this.formFocus = c.focus;
      this.formRegion = c.region;
      this.formDescription = c.description;
      this.formMinContribution = c.minContributionUsd;
      this._communityStatus = c.status;
    }
  }

  // ─── Public methods (for TDD pre-commit gate) ───────────────────────────
  setFormName(value: string): void { this.formName = value; }
  setFormFocus(value: string): void { this.formFocus = value; }
  setFormRegion(value: string): void { this.formRegion = value; }
  setFormDescription(value: string): void { this.formDescription = value; }
  setFormMinContribution(value: number): void {
    const n = Number(value);
    this.formMinContribution = Number.isFinite(n) ? n : 0;
  }

  submitGeneral(event: Event): void {
    event.preventDefault();
    this.lastSavedAt = new Date().toISOString();
  }

  safetyRails(): ReadonlyArray<string> {
    return SAFETY_RAILS;
  }

  formatUsd(n: number): string {
    return '$' + n.toLocaleString('en-US');
  }
}
