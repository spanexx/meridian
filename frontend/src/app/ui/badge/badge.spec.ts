/**
 * Unit tests for UiBadgeComponent.
 *
 * Retrofit test suite. Pins the public contract: variant maps to a
 * theme.css badge-<variant> class, content is projected, and the
 * neutral variant defaults when no variant is supplied.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiBadgeComponent } from './badge.component';

@Component({
  standalone: true,
  imports: [UiBadgeComponent],
  template: `<ui-badge [variant]="variant" [extraClass]="extraClass">label</ui-badge>`,
})
class HostComponent {
  variant: any = 'neutral';
  extraClass = '';
}

describe('UiBadgeComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a <span> as the inner element', async () => {
    const fixture = await renderHost();
    const span = fixture.nativeElement.querySelector('span');
    expect(span).toBeTruthy();
    expect(span.tagName).toBe('SPAN');
  });

  it('applies .badge + .badge-<variant> for every variant', async () => {
    for (const variant of ['neutral', 'success', 'warning', 'danger', 'info', 'premium']) {
      const fixture = await renderHost({ variant });
      const span = fixture.nativeElement.querySelector('span');
      expect(span.classList.contains('badge')).toBe(true);
      expect(span.classList.contains(`badge-${variant}`)).toBe(true);
    }
  });

  it('defaults to the neutral variant when no variant is supplied', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.classList.contains('badge-neutral')).toBe(true);
  });

  it('projects content via <ng-content>', async () => {
    const fixture = await renderHost();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent.trim()).toBe('label');
  });

  it('appends extraClass to the class list', async () => {
    const fixture = await renderHost({ extraClass: 'pull-right' });
    const span = fixture.nativeElement.querySelector('span');
    expect(span.classList.contains('pull-right')).toBe(true);
  });
});