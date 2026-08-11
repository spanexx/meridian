import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface UiTableColumn<T = unknown> {
  key: string;
  label: string;
  format?: (row: T) => string;
  align?: 'left' | 'right' | 'center';
}

@Component({
  selector: 'ui-table',
  standalone: true,
  template: `
    <div class="table-scroll" data-testid="table-scroll">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-xs uppercase tracking-wider text-slate-500">
            @for (c of columns; track c.key) {
              <th
                class="text-left font-medium py-2 px-3"
                [class.text-right]="c.align === 'right'"
                [class.text-center]="c.align === 'center'"
              >{{ c.label }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows; track $index) {
            <tr class="table-row">
              @for (c of columns; track c.key) {
                <td
                  class="py-3 px-3"
                  [class.text-right]="c.align === 'right'"
                  [class.text-center]="c.align === 'center'"
                >
                  {{ c.format ? c.format(row) : getValue(row, c.key) }}
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTableComponent<T = Record<string, unknown>> {
  @Input() columns: UiTableColumn<T>[] = [];
  @Input() rows: T[] = [];

  getValue(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }
}