/**
 * DashboardPageComponent — the REAL product dashboard.
 *
 * Per the user (2026-08-11): the previous /dashboard route hosted
 * a primitives-pack fixture (renamed to ShowcaseComponent at
 * /showcase). The /dashboard route now renders the real
 * wireframe-shaped product page, content-driven by
 * wireframe/meridian/dashboard/index.html (h1 "Good evening, Alex"
 * + sections: Active Executions, Latest Opportunities, Pool
 * Health).
 *
 * UNTIL the real content ships in a separate pack, this page
 * renders an intentional UiEmptyState placeholder so:
 *   1. The /dashboard URL always resolves to *something*.
 *   2. Future implementers see the wireframe plan, not a forgotten
 *      TODO.
 *   3. The page boundary is pinned by dashboard.page.spec.ts.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiEmptyStateComponent } from '../../ui/empty-state/empty-state.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [UiEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="main">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Planned per wireframe/meridian/dashboard/index.html.</p>

      <ui-empty-state
        title="Real dashboard coming next"
        message="This route is reserved for the product dashboard, driven by the wireframe (Good evening, Alex · Active Executions · Latest Opportunities · Pool Health). The primitives smoke test that used to live here moved to /showcase on 2026-08-11.">
        <a class="btn btn-primary" href="/showcase">See primitive fixtures</a>
      </ui-empty-state>
    </main>
  `,
  styles: [':host { display: block; padding: 2rem; max-width: 1100px; margin: 0 auto; }'],
})
export class DashboardPageComponent {}
