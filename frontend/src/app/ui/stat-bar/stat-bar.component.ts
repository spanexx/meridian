/**
 * UiStatBarComponent — animated progress bar primitive (theme.css
 * .progress-track/.progress-fill). Width animates 0 → value via a
 * queueMicrotask trigger so the CSS transition runs after first paint.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { ChangeDetectionStrategy, Component, Input, computed, signal, OnInit } from '@angular/core';

export type UiStatBarVariant = 'emerald' | 'violet' | 'amber' | 'blue';

@Component({
  selector: 'ui-stat-bar',
  standalone: true,
  template: `
    <div class="progress-track" data-testid="stat-bar">
      <div
        class="progress-fill"
        [class]="'progress-fill ' + fillClass()"
        [style.width.%]="animated()"
      ></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiStatBarComponent implements OnInit {
  @Input() value = 0;
  @Input() variant: UiStatBarVariant = 'emerald';

  private ready = signal(false);
  animated = computed(() => (this.ready() ? Math.max(0, Math.min(100, this.value)) : 0));

  fillClass(): string {
    return `progress-fill-${this.variant}`;
  }

  ngOnInit(): void {
    // Trigger the animation on next tick so the transition runs
    queueMicrotask(() => this.ready.set(true));
  }
}