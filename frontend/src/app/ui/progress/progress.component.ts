import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type UiProgressVariant = 'emerald' | 'violet' | 'amber' | 'blue';

@Component({
  selector: 'ui-progress',
  standalone: true,
  template: `
    <div class="progress-track" data-testid="progress-track">
      <div
        class="progress-fill"
        [class]="'progress-fill ' + fillClass()"
        [style.width.%]="clamp(value)"
      ></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiProgressComponent {
  @Input() value = 0;
  @Input() variant: UiProgressVariant = 'emerald';

  fillClass(): string {
    return `progress-fill-${this.variant}`;
  }

  clamp(v: number): number {
    return Math.max(0, Math.min(100, v));
  }
}