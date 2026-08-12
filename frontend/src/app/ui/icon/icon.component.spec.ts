/**
 * Unit tests for UiIconComponent — inline-SVG implementation.
 *
 * The component renders an <svg> with the lucide path data
 * sourced from lucide v0.x. (Per the user 2026-08-12: PR #19 tried
 * to swap this for the lucide web font from lucide-static, but that
 * font is a SHOWCASE font that renders icon names as text characters
 * — a regression. We reverted to inline SVG.)
 *
 * Behavior pins:
 *   1. Renders an <svg> with viewBox="0 0 24 24".
 *   2. The svg contains one or more <path>/<line>/<polyline> children.
 *   3. Default size is 18 (matches the wireframe visual weight).
 *   4. size input controls the rendered svg width/height.
 *   5. ariaLabel input controls accessibility:
 *      - omitted → aria-hidden="true" (decorative)
 *      - set → aria-label="..." + role="img"
 *   6. Unknown name renders an empty svg (no crash).
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { TestBed } from '@angular/core/testing';
import { UiIconComponent } from './icon.component';

const SUPPORTED_NAMES = [
  'arrow-right',
  'arrow-down-to-line',
  'bookmark',
  'camera',
  'check',
  'check-circle-2',
  'chevron-right',
  'download',
  'info',
  'message-square',
  'send',
  'sparkles',
  'tag',
  'thumbs-down',
  'thumbs-up',
  'x',
  'banknote',
  'bell',
  'circle-dollar-sign',
  'clock',
  'cpu',
  'diamond',
  'filter',
  'layout-dashboard',
  'lightbulb',
  'log-out',
  'menu',
  'moon',
  'sun',
  'package',
  'plus',
  'plus-circle',
  'settings',
  'cog',
  'share-2',
  'trending-up',
  'user',
  'users',
  'vote',
  'watch',
  'zap',
] as const;

function render(name: string, opts: { size?: number; ariaLabel?: string } = {}) {
  TestBed.configureTestingModule({ imports: [UiIconComponent] });
  const fixture = TestBed.createComponent(UiIconComponent);
  fixture.componentRef.setInput('name', name);
  if (opts.size !== undefined) fixture.componentRef.setInput('size', opts.size);
  if (opts.ariaLabel !== undefined) fixture.componentRef.setInput('ariaLabel', opts.ariaLabel);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('UiIconComponent (inline SVG)', () => {
  it.each(SUPPORTED_NAMES)('renders an <svg> with viewBox="0 0 24 24" for name=%s', (name) => {
    const root = render(name);
    const svg = root.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it.each(SUPPORTED_NAMES)('svg has at least one <path>/<line>/<polyline> child for name=%s', (name) => {
    const root = render(name);
    const svg = root.querySelector('svg') as SVGElement;
    // jsdom exposes all child SVG elements via getElementsByTagName*
    const kids = svg.getElementsByTagName('path').length +
                 svg.getElementsByTagName('line').length +
                 svg.getElementsByTagName('polyline').length +
                 svg.getElementsByTagName('polygon').length +
                 svg.getElementsByTagName('circle').length +
                 svg.getElementsByTagName('rect').length +
                 svg.getElementsByTagName('g').length;
    expect(kids).toBeGreaterThan(0);
  });

  it('size input controls the rendered svg width/height', () => {
    const root = render('plus', { size: 24 });
    const svg = root.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('default size is 18', () => {
    const root = render('plus');
    const svg = root.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('18');
    expect(svg?.getAttribute('height')).toBe('18');
  });

  it('sets aria-hidden=true by default (decorative)', () => {
    const root = render('plus');
    const svg = root.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('caller-supplied ariaLabel takes over with role=img', () => {
    const root = render('plus', { ariaLabel: 'Submit' });
    const svg = root.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('Submit');
    expect(svg?.getAttribute('role')).toBe('img');
  });

  it('unknown name renders an empty svg (no crash)', () => {
    const root = render('totally-unknown-icon');
    const svg = root.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('host is inline-flex so it aligns with text', () => {
    const root = render('plus');
    expect(getComputedStyle(root).display).toBe('inline-flex');
  });
});
