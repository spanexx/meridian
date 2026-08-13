/**
 * MERIDIAN — KPI card primitive.
 *
 * Renders a labeled numeric value with optional gradient text. The gradient
 * input is a semantic key (emerald | violet | blue) and is mapped to a CSS
 * class via `gradientClass`; the legacy 'violet' key now maps to the
 * copper-themed text-gradient-copper class (was text-gradient-violet).
 *
 * @owner   spanexx
 * @reviewed 2026-08-13
 */
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

  /** Map the semantic gradient key to its CSS class. */
  private readonly gradientClass: Readonly<Record<Exclude<UiKpiCardComponent['gradient'], ''>, string>> = {
    emerald: 'text-gradient-emerald',
    violet: 'text-gradient-copper', // 'violet' is the legacy semantic key; CSS class is now copper
    blue: 'text-gradient-blue',
  };

  // numberClass is unit-tested directly in kpi-number.spec.ts
  // ("numberClass returns the right CSS class for each gradient key").
  numberClass(): string {
    const base = 'kpi-number';
    if (this.gradient) return `${base} ${this.gradientClass[this.gradient]}`;
    return base;
  }
}
