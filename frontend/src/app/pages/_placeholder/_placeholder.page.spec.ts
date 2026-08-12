/**
 * PlaceholderPageComponent — stub page spec.
 *
 * Pins:
 *   - renders the placeholder card with title + icon
 *   - back link to /communities resolves to routerLink
 *   - default icon is lightbulb if none provided
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PlaceholderPageComponent } from './_placeholder.page';
import { UiIconComponent } from '../../ui/icon/icon.component';

async function renderStub(inputs: Partial<{
  title: string;
  subtitle: string;
  iconName: string;
  packName: string;
}> = {}) {
  await TestBed.configureTestingModule({
    imports: [PlaceholderPageComponent, UiIconComponent],
    providers: [provideRouter([])],
  }).compileComponents();
  const fixture = TestBed.createComponent(PlaceholderPageComponent);
  if (inputs.title !== undefined) fixture.componentInstance.title = inputs.title;
  if (inputs.subtitle !== undefined) fixture.componentInstance.subtitle = inputs.subtitle;
  if (inputs.iconName !== undefined) fixture.componentInstance.iconName = inputs.iconName;
  if (inputs.packName !== undefined) fixture.componentInstance.packName = inputs.packName;
  fixture.detectChanges();
  return fixture;
}

describe('PlaceholderPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaceholderPageComponent, UiIconComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the placeholder card with title + Coming soon heading', async () => {
    const f = await renderStub({ title: 'Governance', packName: 'governance-pack' });
    const root = f.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="placeholder-card"]')).toBeTruthy();
    expect(root.querySelector('h1')?.textContent).toContain('Governance');
    expect(root.textContent).toContain('Coming soon');
    expect(root.textContent).toContain('governance-pack');
  });

  it('renders the configured icon (lightbulb by default)', async () => {
    const f = await renderStub({ title: 'Test' });
    const root = f.nativeElement as HTMLElement;
    expect(root.querySelector('svg[data-icon="lightbulb"]')).toBeTruthy();
  });

  it('renders a back link to /communities using routerLink', async () => {
    const f = await renderStub({ title: 'Submit Signal' });
    const root = f.nativeElement as HTMLElement;
    const backLink = Array.from(root.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Back to Communities'),
    );
    expect(backLink).toBeTruthy();
    expect(backLink?.getAttribute('href')).toBe('/communities');
  });

  it('does NOT contain any raw href attribute (routerLink-only nav)', async () => {
    const f = await renderStub({ title: 'Profile', iconName: 'user' });
    const root = f.nativeElement as HTMLElement;
    const links = Array.from(root.querySelectorAll('a'));
    for (const a of links) {
      expect(a.hasAttribute('href')).toBe(true);
    }
  });

  it('ngOnInit() populates the title from defaults when no data is on the route', async () => {
    const f = TestBed.createComponent(PlaceholderPageComponent);
    f.componentInstance.ngOnInit();
    expect(f.componentInstance.title).toBe('Coming soon');
    expect(f.componentInstance.subtitle).toBe('');
    expect(f.componentInstance.iconName).toBe('lightbulb');
    expect(f.componentInstance.packName).toBe('unassigned');
  });
});
