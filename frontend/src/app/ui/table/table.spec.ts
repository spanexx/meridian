/**
 * Unit tests for UiTableComponent.
 *
 * Retrofit test suite. Pins: .table-scroll wrapper, columns render
 * as <th> with labels, rows render as .table-row, custom format
 * function is called per row, alignment class propagates.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiTableComponent } from './table.component';

interface Row {
  asset: string;
  roi: string;
  deployed: string;
}

@Component({
  standalone: true,
  imports: [UiTableComponent],
  template: `<ui-table [columns]="columns" [rows]="rows" />`,
})
class HostComponent {
  columns = [
    { key: 'asset', label: 'Asset' },
    { key: 'roi', label: 'ROI', align: 'right' as const, format: (r: Row) => `ROI: ${r.roi}` },
    { key: 'deployed', label: 'Deployed', align: 'right' as const },
  ];
  rows: Row[] = [
    { asset: 'Sneaker Resale', roi: '+12.4%', deployed: '$18,500' },
    { asset: 'Bulk Cards', roi: '+8.1%', deployed: '$9,200' },
  ];
}

describe('UiTableComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a .table-scroll wrapper', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.querySelector('.table-scroll')).toBeTruthy();
  });

  it('renders a <table> inside the wrapper', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.querySelector('.table-scroll table')).toBeTruthy();
  });

  it('renders one <th> per column with the label', async () => {
    const fixture = await renderHost();
    const ths = fixture.nativeElement.querySelectorAll('thead th');
    expect(ths.length).toBe(3);
    expect(ths[0].textContent.trim()).toBe('Asset');
    expect(ths[1].textContent.trim()).toBe('ROI');
    expect(ths[2].textContent.trim()).toBe('Deployed');
  });

  it('applies text-right class to columns with align=right', async () => {
    const fixture = await renderHost();
    const ths = fixture.nativeElement.querySelectorAll('thead th');
    expect(ths[0].classList.contains('text-right')).toBe(false);
    expect(ths[1].classList.contains('text-right')).toBe(true);
    expect(ths[2].classList.contains('text-right')).toBe(true);
  });

  it('renders one .table-row per row entry', async () => {
    const fixture = await renderHost();
    const rows = fixture.nativeElement.querySelectorAll('tr.table-row');
    expect(rows.length).toBe(2);
  });

  it('renders the value from each row when no format is provided', async () => {
    const fixture = await renderHost();
    const firstRow = fixture.nativeElement.querySelector('tr.table-row');
    const cells = firstRow.querySelectorAll('td');
    expect(cells[0].textContent.trim()).toBe('Sneaker Resale');
    expect(cells[2].textContent.trim()).toBe('$18,500');
  });

  it('calls the format function when provided and renders its result', async () => {
    const fixture = await renderHost();
    const firstRow = fixture.nativeElement.querySelector('tr.table-row');
    const cells = firstRow.querySelectorAll('td');
    expect(cells[1].textContent.trim()).toBe('ROI: +12.4%');
  });

  it('applies text-right to cells in aligned columns', async () => {
    const fixture = await renderHost();
    const firstRow = fixture.nativeElement.querySelector('tr.table-row');
    const cells = firstRow.querySelectorAll('td');
    expect(cells[1].classList.contains('text-right')).toBe(true);
    expect(cells[2].classList.contains('text-right')).toBe(true);
  });
});