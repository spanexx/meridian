/**
 * UiModalComponent — modal primitive (theme.css .modal-overlay/.modal).
 *
 * Overlay click-to-close uses role="presentation" — the sanctioned a11y
 * treatment for click-away scrims (the close button itself is the focusable
 * control). The @Output is named `closed` (not `close`) per
 * @angular-eslint/no-output-native; `close` shadows a native dialog event.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ui-modal',
  standalone: true,
  template: `
    @if (open) {
      <div class="modal-overlay" data-testid="modal-overlay" role="presentation" (click)="onOverlay($event)">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-head">
            <div class="modal-title">{{ title }}</div>
            <button class="icon-btn" aria-label="Close" (click)="closed.emit()">×</button>
          </div>
          <div><ng-content /></div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() closeOnOverlay = true;
  @Output() closed = new EventEmitter<void>();

  // Overlay click closes; clicks INSIDE the dialog never close it
  // (target check replaces the old stopPropagation — same behavior, but
  // the role=dialog div no longer carries an interactive click handler,
  // which satisfies the template a11y rules).
  onOverlay(e: MouseEvent): void {
    if (!this.closeOnOverlay) return;
    if ((e.target as HTMLElement | null)?.closest?.('.modal')) return;
    this.closed.emit();
  }
}