import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type UiBadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'premium';

@Component({
  selector: 'ui-badge',
  standalone: true,
  template: `<span [class]="hostClass()"><ng-content /></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiBadgeComponent {
  @Input() variant: UiBadgeVariant = 'neutral';
  @Input() extraClass = '';

  hostClass(): string {
    return `badge badge-${this.variant} ${this.extraClass}`.trim();
  }
}