import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface UiTab {
  id: string;
  label: string;
}

@Component({
  selector: 'ui-tabs',
  standalone: true,
  template: `
    <div class="tabs" role="tablist">
      @for (t of tabs; track t.id) {
        <button
          class="tab"
          [class.active]="t.id === active"
          role="tab"
          [attr.aria-selected]="t.id === active"
          (click)="select.emit(t.id)"
        >
          {{ t.label }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTabsComponent {
  @Input() tabs: UiTab[] = [];
  @Input() active = '';
  @Output() select = new EventEmitter<string>();
}