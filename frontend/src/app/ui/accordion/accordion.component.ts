/**
 * UiAccordionItemComponent — collapsible section primitive (theme.css
 * .accordion-item). Native <button> toggle with aria-expanded; open state
 * initializes from defaultOpen in ngOnInit, toggling emits openChange.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';

@Component({
  selector: 'ui-accordion-item',
  standalone: true,
  template: `
    <div class="accordion-item">
      <button
        class="accordion-toggle"
        type="button"
        [attr.aria-expanded]="open()"
        (click)="onToggle()"
      >
        <span class="flex-1 text-left">{{ title }}</span>
        <span class="accordion-chevron" [class.open]="open()">▾</span>
      </button>
      @if (open()) {
        <div class="accordion-body"><ng-content /></div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiAccordionItemComponent implements OnInit {
  @Input({ required: true }) title!: string;
  @Input() defaultOpen = false;
  @Output() openChange = new EventEmitter<boolean>();

  open = signal(false);

  ngOnInit(): void {
    this.open.set(this.defaultOpen);
  }

  onToggle(): void {
    const next = !this.open();
    this.open.set(next);
    this.openChange.emit(next);
  }
}