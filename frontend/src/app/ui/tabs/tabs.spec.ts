/**
 * Unit tests for UiTabsComponent.
 *
 * Retrofit test suite. Pins: .tabs wrapper, role="tablist", tab
 * buttons get role="tab", active tab gets .active + aria-selected=true,
 * selectChange event emits the clicked tab id, click also flips active when
 * parent doesn't bind to (selectChange).
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiTabsComponent } from './tabs.component';

@Component({
  standalone: true,
  imports: [UiTabsComponent],
  template: `<ui-tabs [tabs]="tabs" [active]="active" (selectChange)="onSelect($event)" />`,
})
class HostComponent {
  tabs = [
    { id: 'pool', label: 'Pool' },
    { id: 'risk', label: 'Risk' },
    { id: 'flow', label: 'Flow' },
  ];
  active = 'pool';
  lastSelected: string | null = null;
  onSelect(id: string) {
    this.lastSelected = id;
    this.active = id;
  }
}

describe('UiTabsComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a .tabs wrapper with role=tablist', async () => {
    const fixture = await renderHost();
    const tabs = fixture.nativeElement.querySelector('.tabs');
    expect(tabs).toBeTruthy();
    expect(tabs.getAttribute('role')).toBe('tablist');
  });

  it('renders one .tab button per entry', async () => {
    const fixture = await renderHost();
    const tabButtons = fixture.nativeElement.querySelectorAll('.tab');
    expect(tabButtons.length).toBe(3);
  });

  it('sets role=tab on each tab button', async () => {
    const fixture = await renderHost();
    const tabButtons = fixture.nativeElement.querySelectorAll('.tab');
    for (const btn of tabButtons) {
      expect(btn.getAttribute('role')).toBe('tab');
    }
  });

  it('applies .active + aria-selected=true to the active tab only', async () => {
    const fixture = await renderHost({ active: 'risk' });
    const tabButtons = fixture.nativeElement.querySelectorAll('.tab');
    expect(tabButtons[0].classList.contains('active')).toBe(false);
    expect(tabButtons[0].getAttribute('aria-selected')).toBe('false');
    expect(tabButtons[1].classList.contains('active')).toBe(true);
    expect(tabButtons[1].getAttribute('aria-selected')).toBe('true');
    expect(tabButtons[2].classList.contains('active')).toBe(false);
    expect(tabButtons[2].getAttribute('aria-selected')).toBe('false');
  });

  it('renders the label text on each tab', async () => {
    const fixture = await renderHost();
    const tabButtons = fixture.nativeElement.querySelectorAll('.tab');
    expect(tabButtons[0].textContent.trim()).toBe('Pool');
    expect(tabButtons[1].textContent.trim()).toBe('Risk');
    expect(tabButtons[2].textContent.trim()).toBe('Flow');
  });

  it('emits the clicked tab id via (selectChange) event', async () => {
    const fixture = await renderHost();
    const tabButtons = fixture.nativeElement.querySelectorAll('.tab');
    tabButtons[2].click();
    expect(fixture.componentInstance.lastSelected).toBe('flow');
  });
});