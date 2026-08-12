/**
 * RED spec — CommunitySettingsPageComponent (wireframe/meridian/community-detail/settings/index.html).
 *
 * Sections (chunk 1/4 of the wireframe):
 *   - breadcrumb: Communities › <community name> › Settings
 *   - header: title "Community Settings" + Admin badge + back-to-community link
 *   - main col (chunk 1): General card (name, ID disabled, description, focus, region, min contribution, Save)
 *   - sidebar (chunk 1): At a glance card + Safety rails card
 *
 * Sections deferred to chunk 2/4:
 *   - Governance Parameters (read-only-with-propose)
 *   - Members & Roles (3 toggles)
 *   - Danger Zone (archive + transfer)
 *   - How changes work (sidebar)
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CommunitySettingsPageComponent } from './community-settings.page';
import { UiIconComponent } from '../../ui/icon/icon.component';

async function renderPage(id?: string) {
  await TestBed.configureTestingModule({
    imports: [CommunitySettingsPageComponent, UiIconComponent],
    providers: [provideRouter([])],
  }).compileComponents();
  const fixture = TestBed.createComponent(CommunitySettingsPageComponent);
  if (id) {
    fixture.componentInstance.id = id;
  }
  fixture.detectChanges();
  return fixture;
}

describe('CommunitySettingsPageComponent (chunk 1/4)', () => {
  // Header ----------------------------------------------------------------
  it('renders the page title "Community Settings"', async () => {
    const f = await renderPage('alpha');
    const h1 = (f.nativeElement as HTMLElement).querySelector('h1.page-title');
    expect(h1?.textContent?.trim()).toBe('Community Settings');
  });

  it('renders the Admin badge in the title row', async () => {
    const f = await renderPage('alpha');
    const root = f.nativeElement as HTMLElement;
    const badge = root.querySelector('.badge-premium');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Admin');
  });

  it('subtitle explains governance parameters cannot be changed unilaterally', async () => {
    const f = await renderPage('alpha');
    const sub = (f.nativeElement as HTMLElement).querySelector('.page-subtitle');
    expect(sub?.textContent).toContain('Governance parameters');
    expect(sub?.textContent).toContain('Governance Vote');
  });

  it('renders a Back to community link using routerLink to /community/:id', async () => {
    const f = await renderPage('alpha');
    const root = f.nativeElement as HTMLElement;
    const back = Array.from(root.querySelectorAll('a')).find(a =>
      a.textContent?.includes('Back to community'),
    );
    expect(back).toBeTruthy();
    expect(back?.getAttribute('href')).toBe('/community/alpha');
  });

  // Breadcrumb -----------------------------------------------------------
  it('breadcrumb: Communities › <community name> › Settings', async () => {
    const f = await renderPage('alpha');
    const bc = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="community-settings-breadcrumb"]',
    );
    expect(bc?.textContent).toContain('Communities');
    expect(bc?.textContent).toContain('MERIDIAN Alpha');
    expect(bc?.textContent).toContain('Settings');
  });

  it('breadcrumb Communities link points to /communities', async () => {
    const f = await renderPage('alpha');
    const bc = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="community-settings-breadcrumb"]',
    ) as HTMLElement;
    const link = Array.from(bc.querySelectorAll('a')).find(a =>
      a.textContent?.trim() === 'Communities',
    );
    expect(link?.getAttribute('href')).toBe('/communities');
  });

  it('breadcrumb <community name> link points to /community/:id', async () => {
    const f = await renderPage('alpha');
    const bc = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="community-settings-breadcrumb"]',
    ) as HTMLElement;
    const link = Array.from(bc.querySelectorAll('a')).find(a =>
      a.textContent?.includes('MERIDIAN Alpha'),
    );
    expect(link?.getAttribute('href')).toBe('/community/alpha');
  });

  // General card ---------------------------------------------------------
  it('renders the General card with title + description', async () => {
    const f = await renderPage('alpha');
    const root = f.nativeElement as HTMLElement;
    const general = root.querySelector('[data-testid="general-card"]');
    expect(general).toBeTruthy();
    expect(general?.textContent).toContain('General');
    expect(general?.textContent).toContain('Identity and scope');
  });

  it('General form has 6 inputs: name, ID (disabled), description, focus, region, min contribution', async () => {
    const f = await renderPage('alpha');
    const form = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="general-form"]',
    );
    const inputs = form?.querySelectorAll('input, textarea, select') ?? [];
    expect(inputs.length).toBe(6);
  });

  it('General form: name input is editable', async () => {
    const f = await renderPage('alpha');
    const form = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="general-form"]',
    );
    const nameInput = form?.querySelector('input[type="text"]') as HTMLInputElement;
    expect(nameInput).toBeTruthy();
    expect(nameInput.disabled).toBe(false);
  });

  it('General form: ID input is disabled (community ID is immutable)', async () => {
    const f = await renderPage('alpha');
    const form = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="general-form"]',
    );
    const idInput = form?.querySelector('input[disabled]') as HTMLInputElement;
    expect(idInput).toBeTruthy();
    expect(idInput.value).toBe('C-001');
  });

  it('General form: description textarea is present and carries community data', async () => {
    const f = await renderPage('alpha');
    const form = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="general-form"]',
    );
    const textarea = form?.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    // textarea value comes from the bound signal (initialised from community data)
    expect(textarea.value).toContain('MERIDIAN Alpha');
  });

  it('General form: focus + region selects carry existing values', async () => {
    const f = await renderPage('alpha');
    const form = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="general-form"]',
    );
    const selects = form?.querySelectorAll('select') ?? [];
    expect(selects.length).toBe(2);
    expect((selects[0] as HTMLSelectElement).value).toBe('General arbitrage');
    expect((selects[1] as HTMLSelectElement).value).toBe('Global');
  });

  it('General form: Save button calls submitGeneral and sets lastSavedAt', async () => {
    const f = await renderPage('alpha');
    const form = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="general-form"]',
    ) as HTMLFormElement;
    const submit = form?.querySelector('button[type="submit"]');
    expect(submit).toBeTruthy();
    const c = f.componentInstance as unknown as {
      submitGeneral: (ev: Event) => void;
      lastSavedAt: () => string | null;
    };
    expect(c.lastSavedAt).toBeNull();
    c.submitGeneral(new Event('submit'));
    expect(c.lastSavedAt).not.toBeNull();
  });

  // Sidebar: At a glance --------------------------------------------------
  it('renders the At a glance sidebar card', async () => {
    const f = await renderPage('alpha');
    const root = f.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="at-a-glance-card"]');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('At a glance');
  });

  it('At a glance shows Status, Members, Total pool, Founded, Active proposals rows', async () => {
    const f = await renderPage('alpha');
    const card = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="at-a-glance-card"]',
    ) as HTMLElement;
    expect(card.textContent).toContain('Status');
    expect(card.textContent).toContain('Members');
    expect(card.textContent).toContain('Total pool');
    expect(card.textContent).toContain('Founded');
    expect(card.textContent).toContain('Active proposals');
  });

  it('At a glance has a "2 open" link to /governance', async () => {
    const f = await renderPage('alpha');
    const card = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="at-a-glance-card"]',
    ) as HTMLElement;
    const govLink = Array.from(card.querySelectorAll('a')).find(a =>
      a.textContent?.includes('2 open'),
    );
    expect(govLink).toBeTruthy();
    expect(govLink?.getAttribute('href')).toBe('/governance');
  });

  // Sidebar: Safety rails ------------------------------------------------
  it('renders the Safety rails sidebar card', async () => {
    const f = await renderPage('alpha');
    const root = f.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="safety-rails-card"]');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('Safety rails');
    expect(card?.textContent).toContain('Never community-governed');
  });

  it('Safety rails list has 5 fixed items', async () => {
    const f = await renderPage('alpha');
    const card = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="safety-rails-card"]',
    ) as HTMLElement;
    const items = card.querySelectorAll('[data-testid="safety-rail-item"]');
    expect(items.length).toBe(5);
    const expected = [
      'Integrity verification',
      'Reconciliation checks',
      'No-ponzi mechanics',
      'Human control override',
      'KYC & identity rules',
    ];
    for (const text of expected) {
      expect(card.textContent).toContain(text);
    }
  });

  it('Safety rails render the check-circle icon for each item', async () => {
    const f = await renderPage('alpha');
    const card = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="safety-rails-card"]',
    ) as HTMLElement;
    const icons = card.querySelectorAll('svg[data-icon="check-circle"]');
    expect(icons.length).toBe(5);
  });

  // Component methods ----------------------------------------------------
  it('community() returns the matching community data for the route id', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      community: () => { name: string; id: string } | null;
    };
    expect(c.community?.name).toBe('MERIDIAN Alpha');
    expect(c.community?.id).toBe('C-001');
  });

  it('community() returns null for an unknown id', async () => {
    const f = await renderPage('nope');
    const c = f.componentInstance as unknown as {
      community: () => { name: string } | null;
    };
    expect(c.community).toBeNull();
  });

  it('initial form state mirrors the community data', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      formName: () => string;
      formFocus: () => string;
      formRegion: () => string;
      formDescription: () => string;
      formMinContribution: () => number;
    };
    expect(c.formName).toBe('MERIDIAN Alpha');
    expect(c.formFocus).toBe('General arbitrage');
    expect(c.formRegion).toBe('Global');
    expect(c.formDescription).toContain('MERIDIAN Alpha');
    expect(c.formMinContribution).toBe(1000);
  });

  it('safetyRails() returns the 5 fixed items (read-only)', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as { safetyRails: () => ReadonlyArray<string> };
    const rails = c.safetyRails();
    expect(rails.length).toBe(5);
    expect(rails).toContain('Integrity verification');
    expect(rails).toContain('Reconciliation checks');
    expect(rails).toContain('No-ponzi mechanics');
    expect(rails).toContain('Human control override');
    expect(rails).toContain('KYC & identity rules');
  });
// Public methods (additional regression tests) --------------------
  it('setFormName(name) updates formName()', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      setFormName: (v: string) => void;
      formName: () => string;
    };
    c.setFormName('MERIDIAN Beta');
    expect(c.formName).toBe('MERIDIAN Beta');
  });

  it('setFormFocus(focus) updates formFocus()', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      setFormFocus: (v: string) => void;
      formFocus: () => string;
    };
    c.setFormFocus('Electronics');
    expect(c.formFocus).toBe('Electronics');
  });

  it('setFormRegion(region) updates formRegion()', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      setFormRegion: (v: string) => void;
      formRegion: () => string;
    };
    c.setFormRegion('Europe');
    expect(c.formRegion).toBe('Europe');
  });

  it('setFormDescription(text) updates formDescription()', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      setFormDescription: (v: string) => void;
      formDescription: () => string;
    };
    c.setFormDescription('A new description.');
    expect(c.formDescription).toBe('A new description.');
  });

  it('setFormMinContribution(n) coerces to finite number (and falls back to 0 on NaN)', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      setFormMinContribution: (v: number) => void;
      formMinContribution: () => number;
    };
    c.setFormMinContribution(NaN);
    expect(c.formMinContribution).toBe(0);
    c.setFormMinContribution(5000);
    expect(c.formMinContribution).toBe(5000);
  });

  it('ngOnInit() initialises form fields from the community data', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as { ngOnInit: () => void; formName: () => string };
    c.ngOnInit();
    expect(c.formName).toBe('MERIDIAN Alpha');
  });

  it('formatUsd(n) prepends $ and uses thousands separators', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as { formatUsd: (n: number) => string };
    expect(c.formatUsd(0)).toBe('$0');
    expect(c.formatUsd(1000)).toBe('$1,000');
    expect(c.formatUsd(1423580)).toBe('$1,423,580');
  });
});
