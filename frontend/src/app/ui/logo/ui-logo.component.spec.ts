/**
 * Unit tests for UiLogoComponent — the official MERIDIAN mark.
 *
 * Geometry pins (transcribed from the official logo SVG, 2026-08-12,
 * normalized to a 24x24 viewBox):
 *   1. Outer ring circle: cx=12, cy=12, r=11.49 — centered in its
 *      own square bounding box (282x282 @ 500 -> 24x24).
 *   2. Internal arc: quadratic bezier M 9.61 23.24 Q 6.13 11.15
 *      12.60 0.53 — bows left, ends exactly on the ring.
 *   3. Both strokes are the same weight: stroke-width=1.02.
 *   4. Round line caps; the clip-path at r=12 trims cap overshoot.
 *   5. stroke="currentColor" (theme CSS controls color — no second
 *      light-mode asset), fill="none".
 *   6. size input controls rendered width/height; default 28.
 *   7. role="img" + aria-label; host inline-flex.
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { TestBed } from '@angular/core/testing';
import { UiLogoComponent } from './ui-logo.component';

function render(size = 28, ariaLabel = 'Meridian logo') {
  TestBed.configureTestingModule({ imports: [UiLogoComponent] });
  const fixture = TestBed.createComponent(UiLogoComponent);
  fixture.componentRef.setInput('size', size);
  fixture.componentRef.setInput('ariaLabel', ariaLabel);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('UiLogoComponent', () => {
  it('renders an <svg> with viewBox="0 0 24 24"', () => {
    const root = render();
    const svg = root.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('renders the outer ring centered in its square box (12, 12, r=11.49)', () => {
    const root = render();
    const svg = root.querySelector('svg') as SVGElement;
    // The ring is a direct child of <svg>; the clip circle lives in <defs>
    const ring = svg.querySelector(':scope > circle');
    expect(ring).toBeTruthy();
    expect(ring?.getAttribute('cx')).toBe('12');
    expect(ring?.getAttribute('cy')).toBe('12');
    expect(ring?.getAttribute('r')).toBe('11.49');
  });

  it('renders the official meridian arc (quadratic bezier, bows left)', () => {
    const root = render();
    const svg = root.querySelector('svg') as SVGElement;
    const paths = svg.querySelectorAll('g clipPath path, g > path');
    const arc = svg.querySelector('g path');
    expect(arc).toBeTruthy();
    expect(arc?.getAttribute('d')).toBe('M 9.61 23.24 Q 6.13 11.15 12.60 0.53');
  });

  it('clips the arc to the ring radius so caps never overshoot', () => {
    const root = render();
    const clip = root.querySelector('clipPath circle');
    expect(clip).toBeTruthy();
    expect(clip?.getAttribute('r')).toBe('12');
    expect(clip?.getAttribute('cx')).toBe('12');
  });

  it('uses the same stroke weight for ring and arc (1.02)', () => {
    const root = render();
    const svg = root.querySelector('svg') as SVGElement;
    const ring = svg.querySelector(':scope > circle');
    const arc = svg.querySelector(':scope > g path');
    expect(ring?.getAttribute('stroke-width')).toBe('1.02');
    expect(arc?.getAttribute('stroke-width')).toBe('1.02');
  });

  it('uses stroke="currentColor" so theme CSS controls the color', () => {
    const root = render();
    const svg = root.querySelector('svg');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });

  it('uses fill="none" (outline only)', () => {
    const root = render();
    const svg = root.querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('none');
  });

  it('uses round line caps', () => {
    const root = render();
    const svg = root.querySelector('svg') as SVGElement;
    const ring = svg.querySelector(':scope > circle');
    const arc = svg.querySelector(':scope > g path');
    expect(ring?.getAttribute('stroke-linecap')).toBe('round');
    expect(arc?.getAttribute('stroke-linecap')).toBe('round');
  });

  it('size input controls rendered width and height; default 28', () => {
    const root = render();
    const svg = root.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('28');
    expect(svg?.getAttribute('height')).toBe('28');
  });

  it('accepts a custom size', () => {
    const root = render(48);
    const svg = root.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('48');
    expect(svg?.getAttribute('height')).toBe('48');
  });

  it('exposes role="img" + aria-label for accessibility', () => {
    const root = render(28, 'Meridian brand mark');
    const svg = root.querySelector('svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Meridian brand mark');
  });

  it('host is inline-flex so it aligns with text', () => {
    const root = render();
    expect(getComputedStyle(root).display).toBe('inline-flex');
  });
});
