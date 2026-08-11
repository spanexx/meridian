import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type UiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
export type UiButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [class]="hostClass()"
      [attr.aria-label]="ariaLabel || null"
    >
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent {
  @Input() variant: UiButtonVariant = 'secondary';
  @Input() size: UiButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() ariaLabel: string | null = null;
  @Input() extraClass = '';

  hostClass(): string {
    if (this.variant === 'icon') {
      return `icon-btn ${this.extraClass}`.trim();
    }
    const sizePx = this.size === 'sm' ? '0.5rem 0.875rem' : this.size === 'lg' ? '0.875rem 1.25rem' : null;
    const sizeStyle = sizePx ? ` style="padding: ${sizePx};"` : '';
    const base = `btn btn-${this.variant}`;
    return `${base} ${this.extraClass}`.trim() + (sizePx ? sizeStyle : '');
  }
}