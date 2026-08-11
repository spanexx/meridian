/**
 * Unit tests for UiCardComponent.
 *
 * Retrofit test suite. Pins: hover variant adds .card-hover, padding
 * variants map to tailwind padding classes, default padding is md
 * (p-5), extraClass is appended.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiCardComponent } from './card.component';

@Component({
  standalone: true,
  imports: [UiCardComponent],
  template: `
    <ui-card [hover]="hover" [padding]="padding" [extraClass]="extraClass">
      card body
    </ui-card>
  `,
})
class HostComponent {
  hover = false;
  padding: any = 'md';
  extraClass = '';
}

describe('UiCardComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a <div> with the .card class', async () => {
    const fixture = await renderHost();
    const div = fixture.nativeElement.querySelector('div');
    expect(div).toBeTruthy();
    expect(div.classList.contains('card')).toBe(true);
  });

  it('does not apply .card-hover by default', async () => {
    const fixture = await renderHost();
    const div = fixture.nativeElement.querySelector('div');
    expect(div.classList.contains('card-hover')).toBe(false);
  });

  it('applies .card-hover when hover=true', async () => {
    const fixture = await renderHost({ hover: true });
    const div = fixture.nativeElement.querySelector('div');
    expect(div.classList.contains('card-hover')).toBe(true);
  });

  it('applies .p-5 for the default padding=md', async () => {
    const fixture = await renderHost();
    const div = fixture.nativeElement.querySelector('div');
    expect(div.classList.contains('p-5')).toBe(true);
  });

  it('maps padding=none to no padding class', async () => {
    const fixture = await renderHost({ padding: 'none' });
    const div = fixture.nativeElement.querySelector('div');
    expect(div.classList.contains('p-4')).toBe(false);
    expect(div.classList.contains('p-5')).toBe(false);
    expect(div.classList.contains('p-6')).toBe(false);
  });

  it('maps padding=sm to .p-4', async () => {
    const fixture = await renderHost({ padding: 'sm' });
    const div = fixture.nativeElement.querySelector('div');
    expect(div.classList.contains('p-4')).toBe(true);
  });

  it('maps padding=lg to .p-6', async () => {
    const fixture = await renderHost({ padding: 'lg' });
    const div = fixture.nativeElement.querySelector('div');
    expect(div.classList.contains('p-6')).toBe(true);
  });

  it('appends extraClass to the class list', async () => {
    const fixture = await renderHost({ extraClass: 'shadow-lg' });
    const div = fixture.nativeElement.querySelector('div');
    expect(div.classList.contains('shadow-lg')).toBe(true);
  });

  it('projects content via <ng-content>', async () => {
    const fixture = await renderHost();
    const div = fixture.nativeElement.querySelector('div');
    expect(div.textContent.trim()).toBe('card body');
  });
});