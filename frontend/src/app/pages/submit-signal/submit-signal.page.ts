/**
 * SubmitSignalPageComponent — wireframe-aligned 5-step signal submission wizard.
 *
 * Per wireframe/meridian/submit-signal/index.html. Behavior pins:
 *   - 'Submit Signal' + 'An arbitrage opportunity for the community to vet.'
 *   - 5-step stepper (Details → Acquisition → Resale → Evidence → Review)
 *     with numbers 1-5 + dividers; steps are INDICATORS only (raw markup —
 *     the ui-stepper primitive makes steps clickable, which the wireframe
 *     does not). Only prev/next buttons navigate.
 *   - Two-column grid: lg:col-span-2 step panels + a 3-card sidebar
 *     (Live Preview / Tips / Auto-checks).
 *   - Every editable field is a signal initialized from the wireframe's
 *     demo values; profit/ROI/channels are computed from cost + value.
 *   - Back disabled at step 1; next never disabled; on the last step next
 *     becomes 'Submit for vetting' (toast + 900ms → /opportunities).
 *   - Toast mirrors the ui-toast primitive (rendered in-page via @if).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UiToastComponent, type UiToastVariant } from '../../ui/toast/toast.component';
import { UiIconComponent } from '../../ui/icon/icon.component';

interface ToastState {
  readonly title: string;
  readonly message: string;
  readonly variant: UiToastVariant;
}

@Component({
  selector: 'app-submit-signal-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiToastComponent, UiIconComponent],
  templateUrl: './submit-signal.template.html',
})
export class SubmitSignalPageComponent {
  private readonly router = inject(Router);

  /** The 5 wizard step labels (stepper indicators — not clickable). */
  readonly steps = ['Details', 'Acquisition', 'Resale', 'Evidence', 'Review'];

  // ─── Navigation ────────────────────────────────────────────────────────
  readonly activeStep = signal(0);

  // ─── Step 1: Details ───────────────────────────────────────────────────
  readonly title = signal('Travis Scott × Nike Sneakers');
  readonly category = signal('Apparel');
  readonly risk = signal('Medium');
  readonly description = signal(
    'Limited drop resale — wholesale acquisition from boutique, 8 pairs, 14-day liquidation via StockX, GOAT, eBay.',
  );

  // ─── Step 2: Acquisition ───────────────────────────────────────────────
  readonly source = signal('Boutique wholesale');
  readonly location = signal('Boston, MA');
  readonly costN = signal(14200);
  readonly qty = signal('8 pairs');
  readonly deadline = signal('2026-03-28');
  readonly access = signal('Yes — boutique relationship');
  readonly skills = signal('');

  // ─── Step 3: Resale ────────────────────────────────────────────────────
  readonly channels = [
    { name: 'StockX' },
    { name: 'GOAT' },
    { name: 'eBay' },
    { name: 'Local' },
  ] as const;
  readonly channelChecked = signal<boolean[]>([true, true, true, false]);
  readonly valueN = signal(21500);
  readonly timeToLiquidate = signal('14 days');
  readonly confidence = signal('High');

  // ─── Step 4: Evidence ──────────────────────────────────────────────────
  readonly uploadName = signal('');
  readonly links = signal([
    'https://stockx.com/travis-scott-x-nike-air-jordan-1-low-og',
    'https://www.goat.com/sneakers/travis-scott-x-air-jordan-1-low-og-sp-ps',
  ]);
  readonly notes = signal(
    'Last 30 days: 12 sales on StockX, avg $2,725 (size 9.5). Premium pairs (10+) at $2,900+. Vintage SNKRS release confirmed via boutique.',
  );

  // ─── Derived values ────────────────────────────────────────────────────
  readonly profit = computed(() => this.valueN() - this.costN());
  readonly channelsCount = computed(() => this.channelChecked().filter(Boolean).length);
  readonly navLabel = computed(() =>
    this.activeStep() >= this.steps.length - 1 ? 'Submit for vetting' : 'Next',
  );

  // ─── Toast ─────────────────────────────────────────────────────────────
  readonly toast = signal<ToastState | null>(null);

  next(): void {
    if (this.activeStep() >= this.steps.length - 1) {
      this.submit();
      return;
    }
    this.activeStep.update((s) => s + 1);
  }

  back(): void {
    this.activeStep.update((s) => Math.max(0, s - 1));
  }

  saveDraft(): void {
    this.toast.set({
      title: '',
      message: 'Draft saved — you can resume anytime',
      variant: 'success',
    });
  }

  submit(): void {
    this.toast.set({
      title: '',
      message: 'Signal submitted — auto-checks running',
      variant: 'success',
    });
    setTimeout(() => this.router.navigate(['/opportunities']), 900);
  }

  addLink(): void {
    this.links.update((arr) => [...arr, '']);
  }

  selectType(name: string): void {
    const i = this.channels.findIndex((ch) => ch.name === name);
    if (i >= 0) this.channelChecked.update((arr) => arr.map((v, idx) => (idx === i ? !v : v)));
  }

  onNumInput(field: 'cost' | 'value', event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/[^0-9.]/g, '');
    const parsed = Number(raw);
    const n = Number.isFinite(parsed) ? parsed : 0;
    if (field === 'cost') this.costN.set(n);
    else this.valueN.set(n);
  }

  openFilePicker(input: HTMLInputElement): void {
    input.click();
  }

  onFileChange(event: Event): void {
    const files = (event.target as HTMLInputElement).files ?? [];
    this.uploadName.set(
      Array.from(files)
        .map((f) => f.name)
        .join(', '),
    );
  }

  formatUsd(n: number): string {
    return '$' + n.toLocaleString('en-US');
  }

  formatRoi(ratio: number): string {
    const pct = Math.round(ratio * 1000) / 10;
    return `+${pct.toFixed(1)}%`;
  }

  truncateTitle(t: string): string {
    return t.length > 24 ? t.slice(0, 24) + '…' : t;
  }
}
