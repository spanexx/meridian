import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  template: `
    <div class="empty" data-testid="empty-state">
      <ng-content select="[slot=icon]" />
      <div class="text-sm font-medium mt-2">{{ title }}</div>
      <div class="text-xs text-slate-500 mt-1">{{ message }}</div>
      <div class="mt-4"><ng-content /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiEmptyStateComponent {
  @Input() title = '';
  @Input() message = '';
}