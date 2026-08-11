import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  template: `<div class="skeleton" [style.width]="width" [style.height]="height"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
}