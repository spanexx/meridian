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
import { UiIconComponent } from '../../../ui/icon/icon.component';

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

  it('renders a Back to community link using routerLink to /community-detail/:id', async () => {
    const f = await renderPage('alpha');
    const root = f.nativeElement as HTMLElement;
    const back = Array.from(root.querySelectorAll('a')).find(a =>
      a.textContent?.includes('Back to community'),
    );
    expect(back).toBeTruthy();
    expect(back?.getAttribute('href')).toBe('/community-detail/alpha');
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

  it('breadcrumb <community name> link points to /community-detail/:id', async () => {
    const f = await renderPage('alpha');
    const bc = (f.nativeElement as HTMLElement).querySelector(
      '[data-testid="community-settings-breadcrumb"]',
    ) as HTMLElement;
    const link = Array.from(bc.querySelectorAll('a')).find(a =>
      a.textContent?.includes('MERIDIAN Alpha'),
    );
    expect(link?.getAttribute('href')).toBe('/community-detail/alpha');
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

  // ─── CHUNK 2/4: Governance Parameters card ───────────────────────────────

  it('renders the Governance Parameters card with warning banner', async () => {
    const f = await renderPage('alpha');
    const root = f.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="governance-card"]');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('Governance Parameters');
    expect(card?.textContent).toContain('can only be changed by a Governance Vote');
    expect(root.querySelector('[data-testid="governance-card"] svg[data-icon="alert-triangle"]')).toBeTruthy();
  });

  it('governance params: 6 parameters (ROI floor, Win-rate target, Capital share, Signal share, Reserve ratio, Single-execution cap)', async () => {
    const f = await renderPage('alpha');
    const card = (f.nativeElement as HTMLElement).querySelector('[data-testid="governance-card"]') as HTMLElement;
    const expected = ['ROI floor', 'Win-rate target', 'Capital share', 'Signal share', 'Reserve ratio', 'Single-execution cap'];
    for (const label of expected) {
      expect(card.textContent).toContain(label);
    }
  });

  it('each governance param has a Propose change button with vote-required badge', async () => {
    const f = await renderPage('alpha');
    const card = (f.nativeElement as HTMLElement).querySelector('[data-testid="governance-card"]') as HTMLElement;
    const proposeButtons = card.querySelectorAll('button[data-action="propose"]');
    expect(proposeButtons.length).toBe(6);
    const badges = card.querySelectorAll('.badge[data-testid="vote-required-badge"]');
    expect(badges.length).toBe(6);
    expect(card.textContent).toContain('Vote required');
  });

  it('clicking a Propose button calls onPropose(label) and increments proposalsCount', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      onPropose: (label: string) => void;
      lastProposalLabel: () => string | null;
      proposalsCount: () => number;
    };
    expect(c.proposalsCount).toBe(0);
    expect(c.lastProposalLabel).toBeNull();
    c.onPropose('ROI floor');
    expect(c.proposalsCount).toBe(1);
    expect(c.lastProposalLabel).toBe('ROI floor');
  });

  // ─── CHUNK 2/4: Members & Roles card ─────────────────────────────────────

  it('renders the Members & Roles card', async () => {
    const f = await renderPage('alpha');
    const card = (f.nativeElement as HTMLElement).querySelector('[data-testid="members-roles-card"]');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('Members & Roles');
  });

  it('members roles: 3 toggles (Open enrollment, Require KYC, Vetter privilege auto-promotion)', async () => {
    const f = await renderPage('alpha');
    const card = (f.nativeElement as HTMLElement).querySelector('[data-testid="members-roles-card"]') as HTMLElement;
    const expected = ['Open enrollment', 'Require KYC', 'Vetter privilege auto-promotion'];
    for (const label of expected) {
      expect(card.textContent).toContain(label);
    }
    const switches = card.querySelectorAll('ui-switch');
    expect(switches.length).toBe(3);
  });

  it('initial toggles mirror the community settings (openEnrollment=true, requireKyc=true, vetterAutoPromote=false)', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      roleOpenEnrollment: () => boolean;
      roleRequireKyc: () => boolean;
      roleVetterAutoPromote: () => boolean;
    };
    expect(c.roleOpenEnrollment).toBe(true);
    expect(c.roleRequireKyc).toBe(true);
    expect(c.roleVetterAutoPromote).toBe(false);
  });

  it('toggle handlers update the role state', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      setRoleOpenEnrollment: (v: boolean) => void;
      setRoleRequireKyc: (v: boolean) => void;
      setRoleVetterAutoPromote: (v: boolean) => void;
      roleOpenEnrollment: () => boolean;
      roleRequireKyc: () => boolean;
      roleVetterAutoPromote: () => boolean;
    };
    c.setRoleOpenEnrollment(false);
    c.setRoleVetterAutoPromote(true);
    expect(c.roleOpenEnrollment).toBe(false);
    expect(c.roleRequireKyc).toBe(true);
    expect(c.roleVetterAutoPromote).toBe(true);
  });

  // ─── CHUNK 2/4: Danger Zone card ──────────────────────────────────────────

  it('renders the Danger Zone card with Irreversible caption', async () => {
    const f = await renderPage('alpha');
    const card = (f.nativeElement as HTMLElement).querySelector('[data-testid="danger-zone-card"]');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('Danger Zone');
    expect(card?.textContent).toContain('Irreversible');
  });

  it('danger zone has Archive community + Transfer admin role buttons', async () => {
    const f = await renderPage('alpha');
    const card = (f.nativeElement as HTMLElement).querySelector('[data-testid="danger-zone-card"]') as HTMLElement;
    expect(card.textContent).toContain('Archive community');
    expect(card.textContent).toContain('Transfer admin role');
    expect(card.querySelectorAll('button[data-action="archive"]').length).toBe(1);
    expect(card.querySelectorAll('button[data-action="transfer-admin"]').length).toBe(1);
  });

  it('clicking Archive opens the confirmation modal', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      archiveModalOpen: () => boolean;
      onArchive: () => void;
    };
    expect(c.archiveModalOpen).toBe(false);
    c.onArchive();
    f.detectChanges();
    expect(c.archiveModalOpen).toBe(true);
    const root = f.nativeElement as HTMLElement;
    // Dump body to figure out where the data-testid lands
    const allTestIds = Array.from(root.querySelectorAll('[data-testid]')).map(e => e.getAttribute('data-testid'));
    expect(root.querySelector('[data-testid="archive-confirm-modal"]')).toBeTruthy();
  });

  it('Archive confirm: confirmArchive() sets status to archived and closes modal', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      onArchive: () => void;
      confirmArchive: () => void;
      archiveModalOpen: () => boolean;
      communityStatus: () => string;
    };
    c.onArchive();
    c.confirmArchive();
    expect(c.archiveModalOpen).toBe(false);
    expect(c.communityStatus).toBe('archived');
  });

  it('Transfer admin calls onTransferAdmin returning transfer-initiated', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as { onTransferAdmin: () => string };
    expect(c.onTransferAdmin()).toBe('transfer-initiated');
  });

  // ─── CHUNK 2/4: How changes work sidebar card ─────────────────────────────

  it('renders the How changes work sidebar card with 4-step process list', async () => {
    const f = await renderPage('alpha');
    const card = (f.nativeElement as HTMLElement).querySelector('[data-testid="how-changes-card"]');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('How changes work');
    const steps = card?.querySelectorAll('[data-testid="how-changes-step"]') ?? [];
    expect(steps.length).toBe(4);
    for (const label of ['Propose', 'Debate', 'Vote', 'Enact']) {
      expect(card?.textContent).toContain(label);
    }
  });

  it('How changes work has an Open governance CTA linking to /governance', async () => {
    const f = await renderPage('alpha');
    const card = (f.nativeElement as HTMLElement).querySelector('[data-testid="how-changes-card"]') as HTMLElement;
    const cta = Array.from(card.querySelectorAll('a')).find(a =>
      a.textContent?.includes('Open governance'),
    );
    expect(cta).toBeTruthy();
    expect(cta?.getAttribute('href')).toBe('/governance');
  });

  it('howChangesSteps() returns the 4 step labels', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as { howChangesSteps: () => ReadonlyArray<string> };
    expect(c.howChangesSteps()).toEqual(['Propose', 'Debate', 'Vote', 'Enact']);
  });

  it('governanceParameters() returns 6 entries with label + value', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      governanceParameters: () => ReadonlyArray<{ label: string; value: string }>;
    };
    const params = c.governanceParameters();
    expect(params.length).toBe(6);
    for (const label of ['ROI floor', 'Win-rate target', 'Single-execution cap']) {
      expect(params.map((p) => p.label)).toContain(label);
    }
    for (const p of params) {
      expect(p.value).toBeTruthy();
    }
  });
it('closeArchiveModal() closes the modal without changing status', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      onArchive: () => void;
      closeArchiveModal: () => void;
      archiveModalOpen: () => boolean;
      communityStatus: () => string;
    };
    c.onArchive();
    expect(c.archiveModalOpen).toBe(true);
    c.closeArchiveModal();
    expect(c.archiveModalOpen).toBe(false);
    expect(c.communityStatus).toBe('active');
  });
});
