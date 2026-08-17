/**
 * Unit tests for NotFoundPageComponent — the wildcard 404 page.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { NotFoundPageComponent } from './not-found.page';

async function renderStandalone(): Promise<ComponentFixture<NotFoundPageComponent>> {
  await TestBed.configureTestingModule({
    providers: [provideRouter([{ path: '', pathMatch: 'full', redirectTo: '/dashboard' }])],
  }).compileComponents();
  const { NotFoundPageComponent: Comp } = await import('./not-found.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  return fixture;
}

describe('NotFoundPage (wildcard)', () => {
  it('renders a 404 heading', async () => {
    const fixture = await renderStandalone();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Page not found');
    expect(fixture.nativeElement.textContent).toContain('404');
  });

  it('offers a way back to the landing', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const link = Array.from(root.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Back to the landing'),
    ) as HTMLAnchorElement | null;
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/');
  });
});
