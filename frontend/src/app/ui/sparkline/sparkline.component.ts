import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'ui-sparkline',
  standalone: true,
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + width + ' ' + height"
      [attr.width]="width"
      [attr.height]="height"
      preserveAspectRatio="none"
      data-testid="sparkline"
    >
      <path
        [attr.d]="path()"
        fill="none"
        [attr.stroke]="stroke"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSparklineComponent {
  @Input() width = 100;
  @Input() height = 24;
  @Input() stroke = 'var(--e-400, #34d399)';

  private data = signal<number[]>([]);

  @Input() set values(v: number[]) {
    this.data.set(v ?? []);
  }

  path = computed(() => {
    const d = this.data();
    if (d.length < 2) return '';
    const min = Math.min(...d);
    const max = Math.max(...d);
    const range = max - min || 1;
    const stepX = this.width / (d.length - 1);
    return d
      .map((y, i) => {
        const x = i * stepX;
        const ny = this.height - ((y - min) / range) * this.height;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${ny.toFixed(2)}`;
      })
      .join(' ');
  });
}