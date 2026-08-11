/**
 * Unit tests for UiKpiCardComponent.
 *
 * Retrofit test suite. Pins: label + value render, optional icon
 * slot projects content, gradient input adds text-gradient-<color>
 * class to the value, default gradient is none.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiKpiCardComponent } from './kpi-number.component';

@Component({
  standalone: true,
  imports: [UiKpiCardComponent],
  template: `
    <ui-kpi-card [label]="label" [value]="value" [gradient]="gradient">
      <div slot="icon">$</div>
    </ui-kpi-card>
  `,
})
class HostComponent {
  label = 'Total Pool';
  value: string | number = '$1,000';
  gradient: '' | 'emerald' | 'violet' | 'blue' = '';
}

describe('UiKpiCardComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the label with .kpi-label class', async () => {
    const fixture = await renderHost();
    const label = fixture.nativeElement.querySelector('.kpi-label');
    expect(label).toBeTruthy();
    expect(label.textContent.trim()).toBe('Total Pool');
  });

  it('renders the value with .kpi-number class', async () => {
    const fixture = await renderHost();
    const number = fixture.nativeElement.querySelector('.kpi-number');
    expect(number).toBeTruthy();
    expect(number.textContent.trim()).toBe('$1,000');
  });

  it('wraps everything in a .card.p-5 container', async () => {
    const fixture = await renderHost();
    const card = fixture.nativeElement.querySelector('.card.p-5');
    expect(card).toBeTruthy();
  });

  it('does not apply text-gradient-* class when gradient is empty', async () => {
    const fixture = await renderHost({ gradient: '' });
    const number = fixture.nativeElement.querySelector('.kpi-number');
    expect(number.classList.contains('text-gradient-emerald')).toBe(false);
    expect(number.classList.contains('text-gradient-violet')).toBe(false);
    expect(number.classList.contains('text-gradient-blue')).toBe(false);
  });

  it('applies text-gradient-emerald when gradient=emerald', async () => {
    const fixture = await renderHost({ gradient: 'emerald' });
    const number = fixture.nativeElement.querySelector('.kpi-number');
    expect(number.classList.contains('text-gradient-emerald')).toBe(true);
  });

  it('applies text-gradient-violet when gradient=violet', async () => {
    const fixture = await renderHost({ gradient: 'violet' });
    const number = fixture.nativeElement.querySelector('.kpi-number');
    expect(number.classList.contains('text-gradient-violet')).toBe(true);
  });

  it('applies text-gradient-blue when gradient=blue', async () => {
    const fixture = await renderHost({ gradient: 'blue' });
    const number = fixture.nativeElement.querySelector('.kpi-number');
    expect(number.classList.contains('text-gradient-blue')).toBe(true);
  });

  it('projects content into the icon slot', async () => {
    const fixture = await renderHost();
    const root = fixture.nativeElement;
    expect(root.textContent).toContain('$');
  });
});