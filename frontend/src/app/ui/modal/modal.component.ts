import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ui-modal',
  standalone: true,
  template: `
    @if (open) {
      <div class="modal-overlay" data-testid="modal-overlay" (click)="onOverlay($event)">
        <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <div class="modal-title">{{ title }}</div>
            <button class="icon-btn" aria-label="Close" (click)="close.emit()">×</button>
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
  @Output() close = new EventEmitter<void>();

  onOverlay(_e: MouseEvent): void {
    if (this.closeOnOverlay) this.close.emit();
  }
}