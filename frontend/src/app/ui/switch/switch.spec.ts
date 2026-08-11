/**
 * Unit tests for UiSwitchComponent.
 *
 * Retrofit test suite. Pins: .switch class, role="switch",
 * aria-checked reflects state, click toggles state and emits
 * (checkedChange).
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiSwitchComponent } from './switch.component';

@Component({
  standalone: true,
  imports: [UiSwitchComponent],
  template: `<ui-switch [(checked)]="checked" [ariaLabel]="ariaLabel" />`,
})
class HostComponent {
  checked = false;
  ariaLabel: string | null = null;
}

describe('UiSwitchComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a <button> with .switch class', async () => {
    const fixture = await renderHost();
    const btn = fixture.nativeElement.querySelector('button.switch');
    expect(btn).toBeTruthy();
  });

  it('sets role=switch', async () => {
    const fixture = await renderHost();
    const btn = fixture.nativeElement.querySelector('button.switch');
    expect(btn.getAttribute('role')).toBe('switch');
  });

  it('sets aria-checked=false by default', async () => {
    const fixture = await renderHost();
    const btn = fixture.nativeElement.querySelector('button.switch');
    expect(btn.getAttribute('aria-checked')).toBe('false');
  });

  it('sets aria-checked=true when checked=true', async () => {
    const fixture = await renderHost({ checked: true });
    const btn = fixture.nativeElement.querySelector('button.switch');
    expect(btn.getAttribute('aria-checked')).toBe('true');
  });

  it('toggles aria-checked on click', async () => {
    const fixture = await renderHost({ checked: false });
    const btn = fixture.nativeElement.querySelector('button.switch');
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('aria-checked')).toBe('true');
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('aria-checked')).toBe('false');
  });

  it('emits (checkedChange) with the new value on toggle', async () => {
    const fixture = await renderHost({ checked: false });
    const host = fixture.componentInstance;
    const btn = fixture.nativeElement.querySelector('button.switch');
    btn.click();
    expect(host.checked).toBe(true);
    btn.click();
    expect(host.checked).toBe(false);
  });

  it('sets aria-label when provided', async () => {
    const fixture = await renderHost({ ariaLabel: 'Live updates' });
    const btn = fixture.nativeElement.querySelector('button.switch');
    expect(btn.getAttribute('aria-label')).toBe('Live updates');
  });

  it('omits aria-label when not provided', async () => {
    const fixture = await renderHost({ ariaLabel: null });
    const btn = fixture.nativeElement.querySelector('button.switch');
    expect(btn.hasAttribute('aria-label')).toBe(false);
  });
});