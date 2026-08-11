/**
 * Unit tests for UiProgressComponent.
 *
 * Retrofit test suite. Pins: .progress-track wraps the fill, fill uses
 * progress-fill-<variant>, fill width clamps to [0, 100].
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiProgressComponent } from './progress.component';

@Component({
  standalone: true,
  imports: [UiProgressComponent],
  template: `<ui-progress [value]="value" [variant]="variant" />`,
})
class HostComponent {
  value = 50;
  variant: any = 'emerald';
}

describe('UiProgressComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a .progress-track wrapper', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.querySelector('.progress-track')).toBeTruthy();
  });

  it('renders a .progress-fill inside the track', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.querySelector('.progress-track .progress-fill')).toBeTruthy();
  });

  it('applies progress-fill-<variant> for every variant', async () => {
    for (const variant of ['emerald', 'violet', 'amber', 'blue']) {
      const fixture = await renderHost({ variant });
      const fill = fixture.nativeElement.querySelector('.progress-fill');
      expect(fill.classList.contains(`progress-fill-${variant}`)).toBe(true);
    }
  });

  it('sets fill width to the value as a percentage', async () => {
    const fixture = await renderHost({ value: 50 });
    const fill = fixture.nativeElement.querySelector('.progress-fill');
    expect(fill.style.width).toBe('50%');
  });

  it('clamps negative values to 0%', async () => {
    const fixture = await renderHost({ value: -10 });
    const fill = fixture.nativeElement.querySelector('.progress-fill');
    expect(fill.style.width).toBe('0%');
  });

  it('clamps values above 100 to 100%', async () => {
    const fixture = await renderHost({ value: 150 });
    const fill = fixture.nativeElement.querySelector('.progress-fill');
    expect(fill.style.width).toBe('100%');
  });

  it('handles value=0', async () => {
    const fixture = await renderHost({ value: 0 });
    const fill = fixture.nativeElement.querySelector('.progress-fill');
    expect(fill.style.width).toBe('0%');
  });

  it('handles value=100', async () => {
    const fixture = await renderHost({ value: 100 });
    const fill = fixture.nativeElement.querySelector('.progress-fill');
    expect(fill.style.width).toBe('100%');
  });
});