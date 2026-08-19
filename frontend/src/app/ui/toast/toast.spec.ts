/**
 * Unit tests for UiToastComponent.
 *
 * Retrofit test suite. Pins: .toast-box wrapper, .toast variant class,
 * title + message render, dismiss button emits (dismiss).
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiToastComponent } from './toast.component';

@Component({
  standalone: true,
  imports: [UiToastComponent],
  template: `
    <ui-toast [title]="title" [message]="message" [variant]="variant"
              [dismissible]="dismissible" (dismiss)="onDismiss()" />
  `,
})
class HostComponent {
  title = 'Saved';
  message = 'Your changes have been recorded.';
  variant: 'success' | 'error' | 'info' | 'neutral' = 'success';
  dismissible = true;
  dismissCount = 0;
  onDismiss() { this.dismissCount++; }
}

describe('UiToastComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a wrapper with .toast-box class', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.querySelector('.toast-box')).toBeTruthy();
  });

  it('renders a .toast inside the box', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.querySelector('.toast-box .toast')).toBeTruthy();
  });

  it('applies .toast-success when variant=success', async () => {
    const fixture = await renderHost({ variant: 'success' });
    const toast = fixture.nativeElement.querySelector('.toast');
    expect(toast.classList.contains('toast-success')).toBe(true);
  });

  it('applies .toast-error when variant=error', async () => {
    const fixture = await renderHost({ variant: 'error' });
    const toast = fixture.nativeElement.querySelector('.toast');
    expect(toast.classList.contains('toast-error')).toBe(true);
  });

  it('applies .toast-info when variant=info', async () => {
    const fixture = await renderHost({ variant: 'info' });
    const toast = fixture.nativeElement.querySelector('.toast');
    expect(toast.classList.contains('toast-info')).toBe(true);
  });

  it('does not apply variant class when variant=neutral', async () => {
    const fixture = await renderHost({ variant: 'neutral' });
    const toast = fixture.nativeElement.querySelector('.toast');
    expect(toast.classList.contains('toast-success')).toBe(false);
    expect(toast.classList.contains('toast-error')).toBe(false);
    expect(toast.classList.contains('toast-info')).toBe(false);
  });

  it('renders the title text', async () => {
    const fixture = await renderHost({ title: 'Heads up' });
    expect(fixture.nativeElement.textContent).toContain('Heads up');
  });

  it('renders the message text', async () => {
    const fixture = await renderHost({ message: 'Something happened' });
    expect(fixture.nativeElement.textContent).toContain('Something happened');
  });

  it('sets role=status on the toast', async () => {
    const fixture = await renderHost();
    const toast = fixture.nativeElement.querySelector('.toast');
    expect(toast.getAttribute('role')).toBe('status');
  });

  it('shows dismiss button when dismissible=true', async () => {
    const fixture = await renderHost({ dismissible: true });
    const btn = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
    expect(btn).toBeTruthy();
  });

  it('hides dismiss button when dismissible=false', async () => {
    const fixture = await renderHost({ dismissible: false });
    const btn = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
    expect(btn).toBeNull();
  });

  it('clicking dismiss emits (dismiss) once', async () => {
    const fixture = await renderHost({ dismissible: true });
    const btn = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
    btn.click();
    expect(fixture.componentInstance.dismissCount).toBe(1);
  });
});