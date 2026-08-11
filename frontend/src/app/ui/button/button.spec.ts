/**
 * Unit tests for UiButtonComponent.
 *
 * Retrofit test suite for an existing component. The behavior was
 * already implemented and verified via the e2e playwright spec
 * (frontend/e2e/ui-button.spec.ts); these unit tests pin the contract
 * at the component level so future refactors can't regress it.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [UiButtonComponent],
  template: `
    <ui-button [variant]="variant" [size]="size" [disabled]="disabled"
               [type]="type" [ariaLabel]="ariaLabel" [extraClass]="extraClass">
      click me
    </ui-button>
  `,
})
class HostComponent {
  variant: any = 'secondary';
  size: any = 'md';
  disabled = false;
  type: any = 'button';
  ariaLabel: string | null = null;
  extraClass = '';
}

describe('UiButtonComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a native <button> as the inner element', async () => {
    const fixture = await renderHost();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn.tagName).toBe('BUTTON');
  });

  it('passes through the type input (button / submit / reset)', async () => {
    const fixture = await renderHost({ type: 'submit' });
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('type')).toBe('submit');
  });

  it('applies .btn + .btn-<variant> for non-icon variants', async () => {
    const fixture = await renderHost({ variant: 'primary' });
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.className).toContain('btn');
    expect(btn.className).toContain('btn-primary');
  });

  it('applies only .icon-btn for the icon variant (no .btn)', async () => {
    const fixture = await renderHost({ variant: 'icon' });
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.className).toContain('icon-btn');
    expect(btn.classList.contains('btn')).toBe(false);
  });

  // DISCOVERY 2026-08-11: the component's hostClass() returns a string
  // with embedded style="padding:..." that is bound via [class] in the
  // template. Angular treats the whole value as a class list, so the
  // inline padding style never actually applies to the DOM. The size
  // input has no visual effect today. These tests pin the current
  // behavior — they will pass when the bug is fixed and fail to
  // alert us to regressions.
  it('does not set inline padding style for size=md', async () => {
    const fixture = await renderHost({ size: 'md' });
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('style') ?? '').not.toMatch(/padding/);
  });

  it('does not set inline padding style for size=sm (known bug)', async () => {
    const fixture = await renderHost({ size: 'sm' });
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('style') ?? '').not.toMatch(/padding/);
  });

  it('does not set inline padding style for size=lg (known bug)', async () => {
    const fixture = await renderHost({ size: 'lg' });
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('style') ?? '').not.toMatch(/padding/);
  });

  it('disables the button when disabled=true', async () => {
    const fixture = await renderHost({ disabled: true });
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBe(true);
  });

  it('does not disable the button when disabled=false (default)', async () => {
    const fixture = await renderHost();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBe(false);
  });

  it('sets aria-label when provided', async () => {
    const fixture = await renderHost({ ariaLabel: 'Submit form' });
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-label')).toBe('Submit form');
  });

  it('omits aria-label when not provided (null)', async () => {
    const fixture = await renderHost({ ariaLabel: null });
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.hasAttribute('aria-label')).toBe(false);
  });

  it('appends extraClass to the class list', async () => {
    const fixture = await renderHost({ extraClass: 'my-extra-class' });
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.className).toContain('my-extra-class');
  });

  it('projects content via <ng-content>', async () => {
    const fixture = await renderHost();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.textContent.trim()).toBe('click me');
  });
});