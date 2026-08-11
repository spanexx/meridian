/**
 * Unit tests for UiModalComponent.
 *
 * Retrofit test suite. Pins: hidden by default (open=false renders
 * nothing), open=true renders .modal-overlay + .modal with role=dialog,
 * aria-modal=true, close button emits (close), overlay click emits
 * (close) when closeOnOverlay=true.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiModalComponent } from './modal.component';

@Component({
  standalone: true,
  imports: [UiModalComponent],
  template: `
    <ui-modal [open]="open" [title]="title" [closeOnOverlay]="closeOnOverlay"
              (close)="onClose()">
      <p>body</p>
    </ui-modal>
  `,
})
class HostComponent {
  open = false;
  title = 'Confirm action';
  closeOnOverlay = true;
  closeCount = 0;
  onClose() { this.closeCount++; }
}

describe('UiModalComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders nothing when open=false', async () => {
    const fixture = await renderHost({ open: false });
    expect(fixture.nativeElement.querySelector('.modal-overlay')).toBeNull();
    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
  });

  it('renders .modal-overlay when open=true', async () => {
    const fixture = await renderHost({ open: true });
    expect(fixture.nativeElement.querySelector('.modal-overlay')).toBeTruthy();
  });

  it('renders .modal inside the overlay with role=dialog', async () => {
    const fixture = await renderHost({ open: true });
    const modal = fixture.nativeElement.querySelector('.modal');
    expect(modal).toBeTruthy();
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
  });

  it('renders the title text in .modal-title', async () => {
    const fixture = await renderHost({ open: true, title: 'Are you sure?' });
    const title = fixture.nativeElement.querySelector('.modal-title');
    expect(title.textContent.trim()).toBe('Are you sure?');
  });

  it('projects content via <ng-content>', async () => {
    const fixture = await renderHost({ open: true });
    expect(fixture.nativeElement.textContent).toContain('body');
  });

  it('clicking the close button emits (close) once', async () => {
    const fixture = await renderHost({ open: true });
    const closeBtn = fixture.nativeElement.querySelector('.icon-btn[aria-label="Close"]');
    closeBtn.click();
    expect(fixture.componentInstance.closeCount).toBe(1);
  });

  it('clicking the overlay emits (close) when closeOnOverlay=true', async () => {
    const fixture = await renderHost({ open: true, closeOnOverlay: true });
    const overlay = fixture.nativeElement.querySelector('.modal-overlay');
    overlay.click();
    expect(fixture.componentInstance.closeCount).toBe(1);
  });

  it('clicking the overlay does NOT emit (close) when closeOnOverlay=false', async () => {
    const fixture = await renderHost({ open: true, closeOnOverlay: false });
    const overlay = fixture.nativeElement.querySelector('.modal-overlay');
    overlay.click();
    expect(fixture.componentInstance.closeCount).toBe(0);
  });

  it('clicking inside .modal does not emit (close) on overlay click', async () => {
    const fixture = await renderHost({ open: true });
    const modal = fixture.nativeElement.querySelector('.modal');
    modal.click();
    expect(fixture.componentInstance.closeCount).toBe(0);
  });
});