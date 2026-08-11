import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ui-switch',
  standalone: true,
  template: `
    <button
      class="switch"
      type="button"
      role="switch"
      [attr.aria-checked]="checked"
      [attr.aria-label]="ariaLabel || null"
      (click)="toggle()"
    ></button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSwitchComponent {
  @Input() checked = false;
  @Input() ariaLabel: string | null = null;
  @Output() checkedChange = new EventEmitter<boolean>();

  toggle(): void {
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked);
  }
}