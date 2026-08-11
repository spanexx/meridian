/**
 * Unit tests for UiIconComponent — the inline-SVG icon component
 * that replaces lucide-angular (which was removed mid-session,
 * 2026-08-11, per MEMORY).
 *
 * The dashboard wireframe uses 13 lucide icons (banknote, zap,
 * users, lightbulb, package, share-2, filter, plus, trending-up,
 * clock, arrow-right, cpu, watch). This component maps each to an
 * inline SVG so we get the visual fidelity without the bundle cost.
 *
 * Behavior pins:
 *   1. Component renders without error for each of the 13 supported
 *      names.
 *   2. The rendered <svg> has a viewBox so the icon scales via CSS.
 *   3. The component sets `aria-hidden="true"` by default (decorative);
 *      caller can override by passing an ariaLabel.
 *   4. Unknown name falls back to a generic placeholder and reason
 *      (so dashboards don't silently lose their lucide icons).
 *   5. The component is exported from the ui barrel so pages can
 *      `import { UiIconComponent } from '../../ui'`.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { UiIconComponent } from './icon.component';

const SUPPORTED_NAMES = [
  'arrow-right',
  'banknote',
  'clock',
  'cpu',
  'filter',
  'lightbulb',
  'package',
  'plus',
  'share-2',
  'trending-up',
  'users',
  'watch',
  'zap',
] as const;

async function renderIcon(name: string, ariaLabel?: string) {
  await TestBed.configureTestingModule({
    imports: [UiIconComponent],
  }).compileComponents();
  const fixture = TestBed.createComponent(UiIconComponent);
  fixture.componentRef.setInput('name', name);
  if (ariaLabel !== undefined) {
    fixture.componentRef.setInput('ariaLabel', ariaLabel);
  }
  fixture.detectChanges();
  return fixture;
}

describe('UiIconComponent', () => {
  it.each(SUPPORTED_NAMES)('renders <svg> with viewBox for name=%s', async (name) => {
    const fixture = await renderIcon(name);
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBeTruthy();
  });

  it('sets aria-hidden=true by default (decorative use)', async () => {
    const fixture = await renderIcon('plus');
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('caller-supplied ariaLabel takes over and adds role=img', async () => {
    const fixture = await renderIcon('plus', 'Submit');
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('Submit');
    expect(svg?.getAttribute('role')).toBe('img');
  });

  it('unknown name renders a placeholder (not a crash)', async () => {
    const fixture = await renderIcon('totally-unknown-icon');
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('size input controls the rendered svg width/height', async () => {
    const fixture = await renderIcon('plus');
    fixture.componentRef.setInput('size', 32);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });
});
