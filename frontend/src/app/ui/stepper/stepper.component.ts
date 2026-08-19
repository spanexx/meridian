/**
 * UiStepperComponent — step indicator primitive (theme.css .stepper).
 *
 * Steps are keyboard-activatable (role=button + tabindex) and emit
 * selectChange (renamed from `select` — @angular-eslint/no-output-native:
 * `select` shadows the native input event).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';

export interface UiStep {
  label: string;
  done?: boolean;
  active?: boolean;
}

@Component({
  selector: 'ui-stepper',
  standalone: true,
  template: `
    <div class="stepper" data-testid="stepper">
      @for (s of steps; track s.label; let i = $index, last = $last) {
        <div
          class="step"
          [class.active]="s.active"
          [class.done]="s.done"
          (click)="selectChange.emit(i)"
          role="button"
          tabindex="0"
        >
          <div class="step-num">{{ i + 1 }}</div>
          <div class="step-label">{{ s.label }}</div>
        </div>
        @if (!last) {
          <div class="step-divider"></div>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiStepperComponent {
  @Input() steps: UiStep[] = [];
  @Output() selectChange = new EventEmitter<number>();
}