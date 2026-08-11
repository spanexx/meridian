/**
 * Unit tests for UiStatBarComponent.
 *
 * Retrofit test suite. Pins: .progress-track wrapper, fill width
 * clamps to [0, 100], fill uses progress-fill-<variant>.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiStatBarComponent } from './stat-bar.component';

@Component({
  standalone: true,
  imports: [UiStatBarComponent],
  template: `<ui-stat-bar [value]="value" [variant]="variant" />`,
})
class HostComponent {
  value = 62;
  variant: any = 'emerald';
}

describe('UiStatBarComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  // Helper: stat-bar's width is animated from 0 → value via
  // queueMicrotask. Tests need to flush the microtask before
  // asserting the final width.
  async function flushMicrotask() {
    await new Promise((r) => setTimeout(r, 0));
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

  it('animates from 0% to the value on init (microtask-triggered transition)', async () => {
    const fixture = await renderHost({ value: 62 });
    // Initial render: width should be 0% because the animation
    // hasn't fired yet (queueMicrotask triggers the transition).
    const fill = fixture.nativeElement.querySelector('.progress-fill');
    expect(fill.style.width).toBe('0%');
    // Wait for the microtask + macrotask so the animation starts.
    await flushMicrotask();
    fixture.detectChanges();
    expect(fill.style.width).toBe('62%');
  });

  it('clamps negative values to 0%', async () => {
    const fixture = await renderHost({ value: -10 });
    const fill = fixture.nativeElement.querySelector('.progress-fill');
    await flushMicrotask();
    fixture.detectChanges();
    expect(fill.style.width).toBe('0%');
  });

  it('clamps values above 100 to 100%', async () => {
    const fixture = await renderHost({ value: 150 });
    const fill = fixture.nativeElement.querySelector('.progress-fill');
    await flushMicrotask();
    fixture.detectChanges();
    expect(fill.style.width).toBe('100%');
  });
});