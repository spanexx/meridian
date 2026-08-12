/**
 * CommunitySettingsPageComponent — per-community settings page.
 *
 * Renders per wireframe/meridian/community-detail/settings/index.html.
 * Chunk 1/4 of the wireframe:
 *   - breadcrumb (Communities > <community> > Settings)
 *   - header (title + Admin badge + back-to-community)
 *   - General card (name, ID disabled, description, focus, region, min contribution, Save)
 *   - sidebar: At a glance + Safety rails
 *
 * Sections deferred to chunk 2/4: Governance Parameters, Members & Roles, Danger Zone,
 * How changes work (sidebar).
 *
 * Design notes:
 *   - Plain class fields (not signals). Angular's [value] property binding on <input>
 *     only fires once during the first change-detection cycle. Using signals here
 *     creates a chicken-and-egg where the field shows empty on first render and never
 *     re-binds. Plain class fields + ngOnInit seed = predictable property binding.
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';

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

const FOCUS_OPTIONS: ReadonlyArray<string> = [
  'General arbitrage',
  'Electronics',
  'Collectibles',
  'Fashion & apparel',
  'Regional',
];

const REGION_OPTIONS: ReadonlyArray<string> = [
  'Global',
  'North America',
  'Europe',
  'Asia-Pacific',
  'Latin America',
];

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
  imports: [RouterLink, UiIconComponent],
  templateUrl: './community-settings.template.html',
})
export class CommunitySettingsPageComponent {
  /** Route :id param. Set via input binding from the router.
   *  Defaults to 'alpha' (the only community in mock data) when the
   *  input binding hasn't fired yet. Matches the pattern used by
   *  community-detail.page.ts. */
  @Input() id: string = 'alpha';

  // Lookup table (private static).
  private static readonly COMMUNITIES_BY_REF = new Map<string, CommunitySettings>(
    COMMUNITY_SETTINGS.map((c) => [c.ref, c] as const),
  );

  /** Currently-loaded community (null if id not found). */
  get community(): CommunitySettings | null {
    return CommunitySettingsPageComponent.COMMUNITIES_BY_REF.get(this.id) ?? null;
  }

  // Editable form fields (seeded in ngOnInit).
  formName = '';
  formFocus = '';
  formRegion = '';
  formDescription = '';
  formMinContribution = 1000;

  /** ISO timestamp of the last successful General save. */
  lastSavedAt: string | null = null;

  /** Static option lists (driven from the wireframe). */
  readonly focusOptions = FOCUS_OPTIONS;
  readonly regionOptions = REGION_OPTIONS;

  // ─── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {
    const c = this.community;
    if (c) {
      this.formName = c.name;
      this.formFocus = c.focus;
      this.formRegion = c.region;
      this.formDescription = c.description;
      this.formMinContribution = c.minContributionUsd;
    }
  }

  // ─── Public methods (for TDD pre-commit gate) ─────────────────────
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
