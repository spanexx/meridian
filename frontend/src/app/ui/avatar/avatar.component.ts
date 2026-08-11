import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type UiAvatarSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  template: `
    <div [class]="hostClass()" [attr.aria-label]="name || null">
      <ng-content>{{ initials() }}</ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiAvatarComponent {
  @Input() name = '';
  @Input() size: UiAvatarSize = 'md';

  hostClass(): string {
    const sizeClass = this.size === 'sm' ? 'avatar avatar-sm'
      : this.size === 'lg' ? 'avatar avatar-lg'
      : this.size === 'xl' ? 'avatar avatar-xl'
      : 'avatar';
    return sizeClass;
  }

  initials(): string {
    if (!this.name) return '?';
    const parts = this.name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }
}