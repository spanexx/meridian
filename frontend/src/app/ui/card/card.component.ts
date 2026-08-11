import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  template: `
    <div [class]="hostClass()">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCardComponent {
  @Input() hover = false;
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() extraClass = '';

  hostClass(): string {
    const classes = ['card'];
    if (this.hover) classes.push('card-hover');
    const paddingMap = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };
    const p = paddingMap[this.padding];
    if (p) classes.push(p);
    if (this.extraClass) classes.push(this.extraClass);
    return classes.join(' ');
  }
}