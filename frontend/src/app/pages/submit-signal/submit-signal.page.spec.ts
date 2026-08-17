/**
 * Unit tests for SubmitSignalPageComponent — wireframe-aligned.
 *
 * Per wireframe/meridian/submit-signal/index.html. This is a 5-step
 * wizard (Details → Acquisition → Resale → Evidence → Review) with a
 * live-preview sidebar. Behavior pins:
 *   - title 'Submit Signal' + 'An arbitrage opportunity for the
 *     community to vet.'
 *   - 5-step stepper (numbers 1-5, dividers) with class .active on the
 *     current step only; steps are indicators (only prev/next navigate)
 *   - Two-column grid: lg:col-span-2 panels + a 3-card sidebar
 *   - Step panels prefilled verbatim with the wireframe demo values
 *   - next()/back() move the active step; back disabled at step 1,
 *     next disabled nowhere; on the last step next becomes
 *     'Submit for vetting' (submit flow: toast + 900ms → /opportunities)
 *   - saveDraft() toast, addLink() appends a link input,
 *     selectType() toggles channels (updates Live Preview Channels count)
 *   - Live Preview sidebar rows bound to the form signals
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { SubmitSignalPageComponent } from './submit-signal.page';

async function renderStandalone(): Promise<ComponentFixture<SubmitSignalPageComponent>> {
  await TestBed.configureTestingModule({
    providers: [provideRouter([])],
  }).compileComponents();
  const { SubmitSignalPageComponent: Comp } = await import('./submit-signal.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  return fixture;
}

describe('SubmitSignalPage (wireframe-aligned)', () => {
  it('renders the page title "Submit Signal" + subtitle', async () => {
    const fixture = await renderStandalone();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Submit Signal');
    expect(fixture.nativeElement.textContent).toContain(
      'An arbitrage opportunity for the community to vet.',
    );
  });

  it('stepper renders 5 steps numbered 1-5 with dividers', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const steps = Array.from(root.querySelectorAll('[data-step]'));
    expect(steps.length).toBe(5);
    steps.forEach((s, i) => expect(s.querySelector('.step-num')?.textContent).toBe(String(i + 1)));
    expect(root.querySelectorAll('.step-divider').length).toBe(4);
  });

  it('only the current (first) step has class .active', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const steps = Array.from(root.querySelectorAll('[data-step]'));
    expect(steps[0].classList.contains('active')).toBe(true);
    steps.slice(1).forEach((s) => expect(s.classList.contains('active')).toBe(false));
  });

  it('renders the two-column grid with a 3-card sidebar (Live Preview / Tips / Auto-checks)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3')).toBeTruthy();
    const preview = root.querySelector('[data-testid="live-preview"]');
    expect(preview).toBeTruthy();
    expect(root.textContent).toContain('Tips');
    expect(root.textContent).toContain('Auto-checks');
  });

  it('only the active step panel is visible (others hidden)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const panels = Array.from(root.querySelectorAll('[data-step-panel]')) as HTMLElement[];
    expect(panels.length).toBe(5);
    expect(panels[0].hidden).toBe(false);
    panels.slice(1).forEach((p) => expect(p.hidden).toBe(true));
  });

  it('Details panel prefills title, category, risk, description verbatim', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(c.title()).toBe('Travis Scott × Nike Sneakers');
    expect(c.category()).toBe('Apparel');
    expect(c.risk()).toBe('Medium');
    expect((root.querySelector('input[data-field="title"]') as HTMLInputElement).value).toBe(
      'Travis Scott × Nike Sneakers',
    );
    const category = root.querySelector('select[data-field="category"]') as HTMLSelectElement;
    expect(category.value).toBe('Apparel');
    const options = Array.from(category.options).map((o) => o.textContent?.trim());
    expect(options).toEqual([
      'Apparel',
      'Collectibles',
      'Electronics',
      'Equipment',
      'Furniture',
      'Other',
    ]);
    expect(c.description()).toContain('Limited drop resale');
    const risk = root.querySelector('select[data-field="risk"]') as HTMLSelectElement;
    expect(risk.value).toBe('Medium');
  });

  it('next()/back() move the active step and toggle panel visibility', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(c.activeStep()).toBe(0);
    c.next();
    fixture.detectChanges();
    expect(c.activeStep()).toBe(1);
    const afterNext = Array.from(root.querySelectorAll('[data-step-panel]')) as HTMLElement[];
    expect(afterNext[1].hidden).toBe(false);
    expect(afterNext[0].hidden).toBe(true);
    c.back();
    fixture.detectChanges();
    expect(c.activeStep()).toBe(0);
  });

  it('back button is disabled at step 1 and enabled later; next never disabled', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect((root.querySelector('[data-step-prev]') as HTMLButtonElement).disabled).toBe(true);
    expect((root.querySelector('[data-step-next]') as HTMLButtonElement).disabled).toBe(false);
    c.next();
    fixture.detectChanges();
    expect((root.querySelector('[data-step-prev]') as HTMLButtonElement).disabled).toBe(false);
    c.activeStep.set(4);
    fixture.detectChanges();
    expect((root.querySelector('[data-step-next]') as HTMLButtonElement).disabled).toBe(false);
  });

  it('next button label becomes "Submit for vetting" on the last step', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const nextBtn = root.querySelector('[data-step-next]') as HTMLButtonElement;
    expect(nextBtn.textContent).toContain('Next');
    c.activeStep.set(4);
    fixture.detectChanges();
    expect(nextBtn.textContent).toContain('Submit for vetting');
  });

  it('Acquisition panel prefills source, location, cost, quantity, deadline, access, skills', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    c.activeStep.set(1);
    fixture.detectChanges();
    expect((root.querySelector('input[data-field="source"]') as HTMLInputElement).value).toBe(
      'Boutique wholesale',
    );
    expect((root.querySelector('input[data-field="location"]') as HTMLInputElement).value).toBe(
      'Boston, MA',
    );
    const costWrap = root.querySelector('[data-field="cost"]') as HTMLElement;
    expect(costWrap.textContent).toContain('$');
    const costInput = costWrap.querySelector('input') as HTMLInputElement;
    expect(costInput.style.paddingLeft).toBe('1.75rem');
    const deadline = root.querySelector('input[data-field="deadline"]') as HTMLInputElement;
    expect(deadline.type).toBe('date');
    expect(deadline.value).toBe('2026-03-28');
    const access = root.querySelector('select[data-field="access"]') as HTMLSelectElement;
    expect(access.value).toBe('Yes — boutique relationship');
    const skills = root.querySelector('input[data-field="skills"]') as HTMLInputElement;
    expect(skills.placeholder).toBe('e.g. authentication, photography');
    expect(c.costN()).toBe(14200);
  });

  it('onNumInput() parses cost/value typed into the dollar inputs', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.onNumInput('cost', { target: { value: '15,000' } } as unknown as Event);
    c.onNumInput('value', { target: { value: '23,000' } } as unknown as Event);
    expect(c.costN()).toBe(15000);
    expect(c.valueN()).toBe(23000);
  });

  it('Resale panel: 4 channel chips, StockX/GOAT/eBay checked, Local unchecked', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    c.activeStep.set(2);
    fixture.detectChanges();
    const boxes = Array.from(root.querySelectorAll('input[data-channel]')) as HTMLInputElement[];
    expect(boxes.length).toBe(4);
    expect(boxes[0].checked).toBe(true);
    expect(boxes[1].checked).toBe(true);
    expect(boxes[2].checked).toBe(true);
    expect(boxes[3].checked).toBe(false);
    expect(c.channelsCount()).toBe(3);
  });

  it('selectType() toggles a channel and updates the Live Preview Channels count', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    c.selectType('Local');
    c.selectType('StockX');
    fixture.detectChanges();
    expect(c.channelsCount()).toBe(3);
    const preview = root.querySelector('[data-testid="live-preview"]') as HTMLElement;
    expect(preview.textContent).toContain('3');
  });

  it('Resale summary cards compute Estimated profit $7,300 and ROI +51.4%', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    c.activeStep.set(2);
    fixture.detectChanges();
    const cards = Array.from(root.querySelectorAll('[data-resale-summary]')) as HTMLElement[];
    expect(cards[0].textContent).toContain('Estimated profit');
    expect(cards[0].textContent).toContain('$7,300');
    expect(cards[1].textContent).toContain('Estimated ROI');
    expect(cards[1].textContent).toContain('+51.4%');
  });

  it('Evidence panel renders hidden file input + upload zone; openFilePicker() clicks it', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    c.activeStep.set(3);
    fixture.detectChanges();
    const input = root.querySelector('input[data-upload-input]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toBe('image/*');
    expect(input.multiple).toBe(true);
    // jsdom cannot open a real file picker; stub the native click.
    // DISCOVERY 2026-08-17: clicking a hidden <input type="file"> throws
    // "not implemented" in jsdom, so the test stubs input.click().
    // Pointer: .agents/skills/tdd/SKILL.md — unit-test file inputs by
    // stubbing click() rather than dispatching a real click.
    const spy = vi.spyOn(input, 'click');
    c.openFilePicker(input);
    expect(spy).toHaveBeenCalled();
  });

  it('onFileChange() surfaces uploaded file names in the emerald line', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.onFileChange({
      target: { files: [{ name: 'pair-a.jpg' }, { name: 'pair-b.png' }] },
    } as unknown as Event);
    fixture.detectChanges();
    expect(c.uploadName()).toBe('pair-a.jpg, pair-b.png');
  });

  it('Evidence panel has 2 prefilled links + addLink() appends an empty one', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    c.activeStep.set(3);
    fixture.detectChanges();
    const before = root.querySelectorAll('#linksBox input').length;
    expect(before).toBe(2);
    c.addLink();
    fixture.detectChanges();
    const after = root.querySelectorAll('#linksBox input');
    expect(after.length).toBe(3);
    expect((after[2] as HTMLInputElement).placeholder).toBe('https://');
  });

  it('Review panel renders summary card, 4 stat cards bound to signals, and the info callout', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    c.activeStep.set(4);
    fixture.detectChanges();
    const panel = root.querySelector('[data-step-panel="4"]') as HTMLElement;
    expect(panel.textContent).toContain('Opportunity');
    expect(panel.textContent).toContain('Travis Scott × Nike Sneakers');
    expect(panel.textContent).toContain('Apparel · Limited-drop resale');
    expect(panel.textContent).toContain('$14,200');
    expect(panel.textContent).toContain('$21,500');
    expect(panel.textContent).toContain('$7,300');
    expect(panel.textContent).toContain('+51.4%');
    expect(panel.textContent).toContain('vote carries weight × 1.4');
  });

  it('saveDraft() shows the "Draft saved" toast', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    c.saveDraft();
    fixture.detectChanges();
    const toast = root.querySelector('ui-toast') as HTMLElement;
    expect(toast).toBeTruthy();
    expect(toast.textContent).toContain('Draft saved — you can resume anytime');
  });

  it('last step submit() fires the success toast, then a 900ms setTimeout navigates to /opportunities', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.useFakeTimers();
    c.activeStep.set(4);
    fixture.detectChanges();
    (root.querySelector('[data-step-next]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const toast = root.querySelector('ui-toast') as HTMLElement;
    expect(toast.textContent).toContain('Signal submitted — auto-checks running');
    expect(nav).not.toHaveBeenCalled();
    vi.advanceTimersByTime(900);
    expect(nav).toHaveBeenCalledWith(['/opportunities']);
    vi.useRealTimers();
  });

  it('Live Preview sidebar rows bind Title/Category/Capital/Profit/ROI/Channels to signals', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const preview = root.querySelector('[data-testid="live-preview"]') as HTMLElement;
    expect(preview.textContent).toContain(c.truncateTitle(c.title()));
    expect(preview.textContent).toContain('Apparel');
    expect(preview.textContent).toContain('$14,200');
    expect(preview.textContent).toContain('$7,300');
    expect(preview.textContent).toContain('+51.4%');
    expect(preview.textContent).toContain('3');
  });

  it('formatUsd()/formatRoi()/truncateTitle() produce the wireframe display strings', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    expect(c.formatUsd(14200)).toBe('$14,200');
    expect(c.formatUsd(7300)).toBe('$7,300');
    expect(c.formatRoi(7300 / 14200)).toBe('+51.4%');
    expect(c.truncateTitle('Travis Scott × Nike Sneakers')).toBe('Travis Scott × Nike Snea…');
    expect(c.truncateTitle('Short')).toBe('Short');
  });

  it('Tips + Auto-checks sidebar cards carry the verbatim copy', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Link real comparable sales');
    expect(root.textContent).toContain('Higher confidence ratings correlate with faster approvals');
    expect(root.textContent).toContain('Run automatically on submit.');
    expect(root.textContent).toContain('pending');
  });
});
