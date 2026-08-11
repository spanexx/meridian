import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type UiTier = 'observer' | 'contributor' | 'vetted' | 'governor' | 'founder';

const TIER_LABELS: Record<UiTier, string> = {
  observer: 'Observer',
  contributor: 'Contributor',
  vetted: 'Vetted',
  governor: 'Governor',
  founder: 'Founder',
};

const TIER_VARIANTS: Record<UiTier, 'neutral' | 'info' | 'success' | 'warning' | 'premium'> = {
  observer: 'neutral',
  contributor: 'info',
  vetted: 'success',
  governor: 'warning',
  founder: 'premium',
};

import { UiBadgeComponent } from '../badge/badge.component';

@Component({
  selector: 'ui-tier-badge',
  standalone: true,
  imports: [UiBadgeComponent],
  host: { '[attr.data-tier]': 'tier' },
  template: `<ui-badge [variant]="variant()">{{ label() }}</ui-badge>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTierBadgeComponent {
  @Input({ required: true }) tier!: UiTier;

  label(): string {
    return TIER_LABELS[this.tier] ?? this.tier;
  }

  variant(): 'neutral' | 'info' | 'success' | 'warning' | 'premium' {
    return TIER_VARIANTS[this.tier] ?? 'neutral';
  }
}