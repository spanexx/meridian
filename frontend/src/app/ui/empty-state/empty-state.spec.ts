/**
 * Unit tests for UiEmptyStateComponent.
 *
 * Retrofit test suite. Pins: .empty wrapper, title + message render,
 * icon slot + cta slot project content.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiEmptyStateComponent } from './empty-state.component';

@Component({
  standalone: true,
  imports: [UiEmptyStateComponent],
  template: `
    <ui-empty-state [title]="title" [message]="message">
      <div slot="icon">⊙</div>
      <button>action</button>
    </ui-empty-state>
  `,
})
class HostComponent {
  title = 'Nothing here yet';
  message = 'When data lands, you will see it here.';
}

describe('UiEmptyStateComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a wrapper with .empty class', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.querySelector('.empty')).toBeTruthy();
  });

  it('renders the title text', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.textContent).toContain('Nothing here yet');
  });

  it('renders the message text', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.textContent).toContain('When data lands');
  });

  it('projects content into the icon slot', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.textContent).toContain('⊙');
  });

  it('projects content into the default (cta) slot', async () => {
    const fixture = await renderHost();
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent.trim()).toBe('action');
  });
});