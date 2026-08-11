/**
 * ShowcaseComponent — primitives-pack visual-coverage harness (formerly DashboardComponent)
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  UiButtonComponent,
  UiCardComponent,
  UiBadgeComponent,
  UiKpiCardComponent,
  UiProgressComponent,
  UiAvatarComponent,
  UiSkeletonComponent,
  UiEmptyStateComponent,
  UiTierBadgeComponent,
  UiModalComponent,
  UiStepperComponent,
  UiToastComponent,
  UiTabsComponent,
  UiTableComponent,
  UiSwitchComponent,
  UiAccordionItemComponent,
  UiVoteButtonComponent,
  UiSparklineComponent,
  UiStatBarComponent,
  type UiTableColumn,
} from '../../ui';

interface Row {
  asset: string;
  roi: string;
  deployed: string;
}

@Component({
  selector: 'app-showcase',
  standalone: true,
  imports: [
    UiButtonComponent,
    UiCardComponent,
    UiBadgeComponent,
    UiKpiCardComponent,
    UiProgressComponent,
    UiAvatarComponent,
    UiSkeletonComponent,
    UiEmptyStateComponent,
    UiTierBadgeComponent,
    UiModalComponent,
    UiStepperComponent,
    UiToastComponent,
    UiTabsComponent,
    UiTableComponent,
    UiSwitchComponent,
    UiAccordionItemComponent,
    UiVoteButtonComponent,
    UiSparklineComponent,
    UiStatBarComponent,
  ],
  template: `
    <main class="main">
      <h1 class="page-title">UI primitives — smoke test</h1>
      <p class="page-subtitle">Every primitive renders and matches theme.css tokens.</p>

      <ui-card padding="lg" extraClass="mt-6">
        <h2 class="text-base font-semibold mb-3">Buttons</h2>
        <div class="flex flex-wrap items-center gap-2">
          <ui-button variant="primary">Primary</ui-button>
          <ui-button variant="secondary">Secondary</ui-button>
          <ui-button variant="ghost">Ghost</ui-button>
          <ui-button variant="danger">Danger</ui-button>
          <ui-button variant="icon" ariaLabel="Share">↗</ui-button>
          <ui-button variant="secondary" [disabled]="true">Disabled</ui-button>
        </div>
      </ui-card>

      <ui-card [hover]="true" padding="md" extraClass="mt-6">
        <h2 class="text-base font-semibold mb-3">Hover card</h2>
        <p class="text-xs text-slate-500">Hover me to see the .card-hover transition.</p>
      </ui-card>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <ui-kpi-card label="Total Pool" value="$1,423,580" gradient="emerald">
          <div slot="icon" class="text-slate-500">$</div>
        </ui-kpi-card>
        <ui-kpi-card label="Active Capital" value="$487,230">
          <div slot="icon" class="text-slate-500">⚡</div>
        </ui-kpi-card>
        <ui-kpi-card label="Open Opportunities" value="12" gradient="violet">
          <div slot="icon" class="text-slate-500">○</div>
        </ui-kpi-card>
      </div>

      <ui-card padding="md" extraClass="mt-6">
        <div class="flex items-center justify-between mb-3">
          <div class="text-sm font-semibold">Progress + StatBar</div>
          <ui-badge variant="success">+2.4%</ui-badge>
        </div>
        <ui-progress [value]="34" variant="emerald" />
        <ui-stat-bar [value]="62" variant="violet" />
        <ui-stat-bar [value]="88" variant="amber" />
        <ui-stat-bar [value]="12" variant="blue" />
      </ui-card>

      <ui-card padding="md" extraClass="mt-6">
        <div class="text-sm font-semibold mb-3">Sparkline</div>
        <ui-sparkline [values]="[3, 5, 4, 7, 6, 9, 8, 11]" [width]="320" [height]="40" />
      </ui-card>

      <ui-card padding="md" extraClass="mt-6">
        <div class="text-sm font-semibold mb-3">Avatars</div>
        <div class="flex items-center gap-3">
          <ui-avatar name="Alex Park" size="sm" />
          <ui-avatar name="Maya Singh" />
          <ui-avatar name="Jordan Lee" size="lg" />
          <ui-avatar name="Sam Rivera" size="xl" />
        </div>
      </ui-card>

      <ui-card padding="md" extraClass="mt-6">
        <div class="text-sm font-semibold mb-3">Badges + Tiers</div>
        <div class="flex flex-wrap items-center gap-2">
          <ui-badge variant="neutral">Neutral</ui-badge>
          <ui-badge variant="success">Success</ui-badge>
          <ui-badge variant="warning">Warning</ui-badge>
          <ui-badge variant="danger">Danger</ui-badge>
          <ui-badge variant="info">Info</ui-badge>
          <ui-badge variant="premium">Premium</ui-badge>
          <ui-tier-badge tier="observer" />
          <ui-tier-badge tier="contributor" />
          <ui-tier-badge tier="vetted" />
          <ui-tier-badge tier="governor" />
          <ui-tier-badge tier="founder" />
        </div>
      </ui-card>

      <ui-card padding="md" extraClass="mt-6">
        <div class="text-sm font-semibold mb-3">Stepper</div>
        <ui-stepper [steps]="steps" />
      </ui-card>

      <ui-card padding="md" extraClass="mt-6">
        <div class="text-sm font-semibold mb-3">Tabs</div>
        <ui-tabs [tabs]="tabs" [active]="activeTab()" (select)="activeTab.set($event)" />
        <div class="mt-3 text-xs text-slate-500">Active: {{ activeTab() }}</div>
      </ui-card>

      <ui-card padding="md" extraClass="mt-6">
        <div class="text-sm font-semibold mb-3">Table</div>
        <ui-table [columns]="columns" [rows]="rows" />
      </ui-card>

      <ui-card padding="md" extraClass="mt-6">
        <div class="flex items-center justify-between mb-3">
          <div class="text-sm font-semibold">Switch + Vote</div>
          <ui-switch [(checked)]="liveUpdates" ariaLabel="Live updates" />
        </div>
        <div class="flex items-center gap-2">
          <ui-vote-button ariaLabel="Approve">✓ Approve</ui-vote-button>
          <ui-vote-button ariaLabel="Reject" [vote]="'reject'">✗ Reject</ui-vote-button>
        </div>
      </ui-card>

      <ui-card padding="md" extraClass="mt-6">
        <div class="text-sm font-semibold mb-3">Accordion</div>
        <ui-accordion-item title="What is the total pool?">$1,423,580 across 124 members.</ui-accordion-item>
        <ui-accordion-item title="How is capital deployed?">By community vote on each opportunity.</ui-accordion-item>
      </ui-card>

      <ui-card padding="md" extraClass="mt-6">
        <div class="text-sm font-semibold mb-3">Skeleton</div>
        <ui-skeleton width="60%" height="1.25rem" />
        <div class="h-2"></div>
        <ui-skeleton width="80%" height="0.875rem" />
      </ui-card>

      <ui-card padding="md" extraClass="mt-6">
        <div class="text-sm font-semibold mb-3">Toast + Modal</div>
        <div class="flex flex-wrap items-center gap-2">
          <ui-button variant="secondary" (click)="toastOpen.set(true)">Show toast</ui-button>
          <ui-button variant="secondary" (click)="modalOpen.set(true)">Open modal</ui-button>
        </div>
        @if (toastOpen()) {
          <ui-toast title="Saved" message="Your changes have been recorded." variant="success" (dismiss)="toastOpen.set(false)" />
        }
        <ui-modal [open]="modalOpen()" title="Confirm action" (close)="modalOpen.set(false)">
          <p class="text-sm text-slate-400">Are you sure you want to proceed?</p>
          <div class="mt-4 flex justify-end gap-2">
            <ui-button variant="ghost" (click)="modalOpen.set(false)">Cancel</ui-button>
            <ui-button variant="primary" (click)="modalOpen.set(false)">Confirm</ui-button>
          </div>
        </ui-modal>
      </ui-card>

      <div class="mt-6">
        <ui-empty-state title="Nothing here yet" message="When new opportunities land, you'll see them here.">
          <ui-button variant="primary">Browse opportunities</ui-button>
        </ui-empty-state>
      </div>
    </main>
  `,
  styles: [':host { display: block; padding: 2rem; max-width: 1100px; margin: 0 auto; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowcaseComponent {
  toastOpen = signal(false);
  modalOpen = signal(false);
  activeTab = signal('pool');
  liveUpdates = signal(true);

  steps = [
    { label: 'Submit', done: true },
    { label: 'Vetted', done: true },
    { label: 'Voted', active: true },
    { label: 'Funded' },
    { label: 'Settled' },
  ];

  tabs = [
    { id: 'pool', label: 'Pool' },
    { id: 'risk', label: 'Risk' },
    { id: 'flow', label: 'Flow' },
  ];

  columns: UiTableColumn<Row>[] = [
    { key: 'asset', label: 'Asset' },
    { key: 'roi', label: 'ROI', align: 'right' },
    { key: 'deployed', label: 'Deployed', align: 'right' },
  ];

  rows: Row[] = [
    { asset: 'Sneaker Resale', roi: '+12.4%', deployed: '$18,500' },
    { asset: 'Bulk Cards', roi: '+8.1%', deployed: '$9,200' },
    { asset: 'Vinyl Bundle', roi: '-2.3%', deployed: '$4,800' },
  ];
}