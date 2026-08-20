/**
 * Unit tests for UiAvatarComponent.
 *
 * Retrofit test suite. Pins: .avatar + .avatar-<size> classes, name
 * input derives initials, unknown size falls back to .avatar only.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiAvatarComponent } from './avatar.component';

@Component({
  standalone: true,
  imports: [UiAvatarComponent],
  template: `<ui-avatar [name]="name" [size]="size" />`,
})
class HostComponent {
  name = 'Alex Park';
  size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
}

describe('UiAvatarComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a <div> with .avatar class', async () => {
    const fixture = await renderHost();
    const div = fixture.nativeElement.querySelector('div');
    expect(div).toBeTruthy();
    expect(div.classList.contains('avatar')).toBe(true);
  });

  it('renders .avatar-sm for size=sm', async () => {
    const fixture = await renderHost({ size: 'sm' });
    const div = fixture.nativeElement.querySelector('div');
    expect(div.classList.contains('avatar-sm')).toBe(true);
  });

  it('renders .avatar-lg for size=lg', async () => {
    const fixture = await renderHost({ size: 'lg' });
    const div = fixture.nativeElement.querySelector('div');
    expect(div.classList.contains('avatar-lg')).toBe(true);
  });

  it('renders .avatar-xl for size=xl', async () => {
    const fixture = await renderHost({ size: 'xl' });
    const div = fixture.nativeElement.querySelector('div');
    expect(div.classList.contains('avatar-xl')).toBe(true);
  });

  it('does not add a size class for the default md size', async () => {
    const fixture = await renderHost();
    const div = fixture.nativeElement.querySelector('div');
    expect(div.classList.contains('avatar-sm')).toBe(false);
    expect(div.classList.contains('avatar-lg')).toBe(false);
    expect(div.classList.contains('avatar-xl')).toBe(false);
  });

  it('derives two-letter initials from a full name', async () => {
    const fixture = await renderHost({ name: 'Alex Park' });
    expect(fixture.nativeElement.textContent.trim()).toBe('AP');
  });

  it('derives single-letter initials from a single name', async () => {
    const fixture = await renderHost({ name: 'Cher' });
    expect(fixture.nativeElement.textContent.trim()).toBe('C');
  });

  it('falls back to "?" when name is empty', async () => {
    const fixture = await renderHost({ name: '' });
    expect(fixture.nativeElement.textContent.trim()).toBe('?');
  });

  it('uppercases lowercase initials', async () => {
    const fixture = await renderHost({ name: 'alex park' });
    expect(fixture.nativeElement.textContent.trim()).toBe('AP');
  });

  it('sets aria-label to the name when provided', async () => {
    const fixture = await renderHost({ name: 'Alex Park' });
    const div = fixture.nativeElement.querySelector('div');
    expect(div.getAttribute('aria-label')).toBe('Alex Park');
  });
});