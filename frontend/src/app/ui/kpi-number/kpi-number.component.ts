import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ui-kpi-card',
  standalone: true,
  template: `
    <div class="card p-5" data-testid="kpi-card">
      <div class="flex items-center justify-between mb-3">
        <div class="kpi-label">{{ label }}</div>
        <ng-content select="[slot=icon]" />
      </div>
      <div [class]="numberClass()">{{ value }}</div>
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiKpiCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() gradient: '' | 'emerald' | 'violet' | 'blue' = '';

  numberClass(): string {
    const base = 'kpi-number';
    if (this.gradient) return `${base} text-gradient-${this.gradient}`;
    return base;
  }
}