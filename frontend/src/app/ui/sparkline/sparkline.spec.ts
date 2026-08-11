/**
 * Unit tests for UiSparklineComponent.
 *
 * Retrofit test suite. Pins: SVG renders with a single <path>, d
 * attribute starts with M and contains Ls for the line segments,
 * width + height attrs reflect inputs, stroke attr is applied,
 * empty values list renders no path or an empty d.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiSparklineComponent } from './sparkline.component';

@Component({
  standalone: true,
  imports: [UiSparklineComponent],
  template: `<ui-sparkline [values]="values" [width]="width" [height]="height" [stroke]="stroke" />`,
})
class HostComponent {
  values: number[] = [3, 5, 4, 7, 6, 9, 8, 11];
  width = 100;
  height = 24;
  stroke = 'var(--e-400, #34d399)';
}

describe('UiSparklineComponent', () => {
  async function renderHost(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renders an <svg> element', async () => {
    const fixture = await renderHost();
    expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
  });

  it('applies width and height as svg attributes', async () => {
    const fixture = await renderHost({ width: 320, height: 40 });
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('320');
    expect(svg.getAttribute('height')).toBe('40');
  });

  it('renders a single <path> child', async () => {
    const fixture = await renderHost();
    const paths = fixture.nativeElement.querySelectorAll('svg path');
    expect(paths.length).toBe(1);
  });

  it('path d attribute starts with M and contains L commands', async () => {
    const fixture = await renderHost();
    const path = fixture.nativeElement.querySelector('svg path');
    const d = path.getAttribute('d');
    expect(d).toMatch(/^M/);
    expect(d).toMatch(/L/);
  });

  it('path has fill=none and stroke-width set', async () => {
    const fixture = await renderHost();
    const path = fixture.nativeElement.querySelector('svg path');
    expect(path.getAttribute('fill')).toBe('none');
    expect(path.getAttribute('stroke-width')).toBe('1.5');
  });

  it('applies stroke attribute when provided', async () => {
    const fixture = await renderHost({ stroke: '#ff0000' });
    const path = fixture.nativeElement.querySelector('svg path');
    expect(path.getAttribute('stroke')).toBe('#ff0000');
  });

  it('renders no path or empty d when values list is too short', async () => {
    const fixture = await renderHost({ values: [5] });
    const path = fixture.nativeElement.querySelector('svg path');
    // Either no path is rendered, or the path's d is empty.
    if (path) {
      expect(path.getAttribute('d')).toBe('');
    }
  });
});