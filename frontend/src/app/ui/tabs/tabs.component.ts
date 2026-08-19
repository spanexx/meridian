/**
 * UiTabsComponent — tab strip primitive (theme.css .tabs/.tab).
 *
 * Native <button role=tab> elements with aria-selected; emits
 * selectChange (renamed from `select` — @angular-eslint/no-output-native:
 * `select` shadows the native input event).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
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
          (click)="selectChange.emit(t.id)"
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
  @Output() selectChange = new EventEmitter<string>();
}