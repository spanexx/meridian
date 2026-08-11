import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type UiToastVariant = 'success' | 'error' | 'info' | 'neutral';

@Component({
  selector: 'ui-toast',
  standalone: true,
  template: `
    <div class="toast-box">
      <div
        class="toast"
        [class.toast-success]="variant === 'success'"
        [class.toast-error]="variant === 'error'"
        [class.toast-info]="variant === 'info'"
        role="status"
      >
        <div class="flex items-start gap-2">
          <div class="flex-1">
            @if (title) {
              <div class="text-sm font-medium">{{ title }}</div>
            }
            <div class="text-xs text-slate-400">{{ message }}</div>
          </div>
          @if (dismissible) {
            <button class="icon-btn" aria-label="Dismiss" (click)="dismiss.emit()">×</button>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiToastComponent {
  @Input() title = '';
  @Input() message = '';
  @Input() variant: UiToastVariant = 'neutral';
  @Input() dismissible = true;
  @Output() dismiss = new EventEmitter<void>();
}