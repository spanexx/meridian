/**
 * Unit tests for UiSkeletonComponent.
 *
 * Retrofit test suite. Pins: .skeleton class, width + height map to
 * inline style, defaults to 100% / 1rem.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiSkeletonComponent } from './skeleton.component';

@Component({
  standalone: true,
  imports: [UiSkeletonComponent],
  template: `<ui-skeleton [width]="width" [height]="height" />`,
})
class HostComponent {
  width = '100%';
  height = '1rem';
}

describe('UiSkeletonComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a <div> with .skeleton class', async () => {
    const fixture = await renderHost();
    const div = fixture.nativeElement.querySelector('div');
    expect(div).toBeTruthy();
    expect(div.classList.contains('skeleton')).toBe(true);
  });

  it('sets width as inline style', async () => {
    const fixture = await renderHost({ width: '60%' });
    const div = fixture.nativeElement.querySelector('div');
    expect(div.style.width).toBe('60%');
  });

  it('sets height as inline style', async () => {
    const fixture = await renderHost({ height: '1.5rem' });
    const div = fixture.nativeElement.querySelector('div');
    expect(div.style.height).toBe('1.5rem');
  });

  it('defaults width to 100%', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const div = fixture.nativeElement.querySelector('div');
    expect(div.style.width).toBe('100%');
  });

  it('defaults height to 1rem', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const div = fixture.nativeElement.querySelector('div');
    expect(div.style.height).toBe('1rem');
  });
});