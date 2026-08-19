/**
 * Unit tests for UiTierBadgeComponent.
 *
 * Retrofit test suite. Pins: tier maps to badge variant + label,
 * data-tier attribute appears on the host element.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { TestBed } from '@angular/core/testing';
import { UiTierBadgeComponent } from './tier-badge.component';

describe('UiTierBadgeComponent', () => {
  function create(tier: 'observer' | 'contributor' | 'vetted' | 'governor' | 'founder') {
    const fixture = TestBed.createComponent(UiTierBadgeComponent);
    fixture.componentRef.setInput('tier', tier);
    fixture.detectChanges();
    return fixture;
  }

  it('renders an inner badge element', () => {
    const fixture = create('observer');
    expect(fixture.nativeElement.querySelector('.badge')).toBeTruthy();
  });

  it('sets data-tier attribute on the host element', () => {
    const fixture = create('observer');
    expect(fixture.nativeElement.getAttribute('data-tier')).toBe('observer');
  });

  it('maps tier=observer to label "Observer" + badge-neutral', () => {
    const fixture = create('observer');
    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge.textContent.trim()).toBe('Observer');
    expect(badge.classList.contains('badge-neutral')).toBe(true);
  });

  it('maps tier=contributor to badge-info', () => {
    const fixture = create('contributor');
    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge.classList.contains('badge-info')).toBe(true);
  });

  it('maps tier=vetted to badge-success', () => {
    const fixture = create('vetted');
    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge.classList.contains('badge-success')).toBe(true);
  });

  it('maps tier=governor to badge-warning', () => {
    const fixture = create('governor');
    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge.classList.contains('badge-warning')).toBe(true);
  });

  it('maps tier=founder to badge-premium', () => {
    const fixture = create('founder');
    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge.classList.contains('badge-premium')).toBe(true);
  });
});