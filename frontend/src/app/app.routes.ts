/**
 * Routes registered for the meridian Angular app
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'showcase' },
  {
    path: 'showcase',
    loadComponent: () =>
      import('./pages/showcase/showcase.page').then(
        (m) => m.ShowcaseComponent,
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then(
        (m) => m.DashboardPageComponent,
      ),
  },
  {
    path: 'opportunities',
    loadComponent: () =>
      import('./pages/opportunities/opportunities.page').then(
        (m) => m.OpportunitiesPageComponent,
      ),
  },
  {
    path: 'executions',
    loadComponent: () =>
      import('./pages/executions/executions.page').then(
        (m) => m.ExecutionsPageComponent,
      ),
  },
  {
    path: 'pool',
    loadComponent: () =>
      import('./pages/pool/pool.page').then((m) => m.PoolPageComponent),
  },
  {
    path: 'communities',
    loadComponent: () =>
      import('./pages/communities/communities.page').then(
        (m) => m.CommunitiesPageComponent,
      ),
  },
  {
    path: 'communities/:id',
    loadComponent: () =>
      import('./pages/community-detail/community-detail.page').then(
        (m) => m.CommunityDetailPageComponent,
      ),
  },
  {
    path: 'community-detail/:id',
    loadComponent: () =>
      import('./pages/community-detail/community-detail.page').then(
        (m) => m.CommunityDetailPageComponent,
      ),
  },
  {
    path: 'executions/:id',
    loadComponent: () =>
      import('./pages/execution-detail/execution-detail.page').then(
        (m) => m.ExecutionDetailPageComponent,
      ),
  },
  {
    path: 'execution-detail/:id',
    loadComponent: () =>
      import('./pages/execution-detail/execution-detail.page').then(
        (m) => m.ExecutionDetailPageComponent,
      ),
  },
  {
    path: 'opportunities/:id',
    loadComponent: () =>
      import('./pages/opportunity-detail/opportunity-detail.page').then(
        (m) => m.OpportunityDetailPageComponent,
      ),
  },
  {
    path: 'opportunity-detail/:id',
    loadComponent: () =>
      import('./pages/opportunity-detail/opportunity-detail.page').then(
        (m) => m.OpportunityDetailPageComponent,
      ),
  },
  // ─── Placeholder routes ────────────────────────────────────────────
  // These pages don't have a real implementation yet. They're wired so
  // every link on every page resolves to a real route (no 404s).
  // When a pack lands that owns one of these, remove the route + add
  // a real component here. The link-audit regression test on
  // community-detail pins the placeholder list.
  {
    path: 'governance',
    loadComponent: () =>
      import('./pages/governance/governance.page').then(
        (m) => m.GovernancePageComponent,
      ),
  },
  {
    path: 'payouts',
    loadComponent: () =>
      import('./pages/_placeholder/_placeholder.page').then(
        (m) => m.PlaceholderPageComponent,
      ),
    data: {
      title: 'Payouts',
      subtitle:
        'Member payouts and distribution ledger. Tied to the Execution engine payout flows.',
      iconName: 'circle-dollar-sign',
      packName: 'payouts-pack',
    },
  },
  {
    path: 'submit-signal',
    loadComponent: () =>
      import('./pages/_placeholder/_placeholder.page').then(
        (m) => m.PlaceholderPageComponent,
      ),
    data: {
      title: 'Submit Signal',
      subtitle:
        'Propose an opportunity for the Community to vet. Requires VETTER+ reputation tier to submit.',
      iconName: 'plus-circle',
      packName: 'submit-signal-pack',
    },
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/_placeholder/_placeholder.page').then(
        (m) => m.PlaceholderPageComponent,
      ),
    data: {
      title: 'Profile',
      subtitle:
        'Your member profile, reputation tier, capital contribution history, and lifetime earnings.',
      iconName: 'user',
      packName: 'profile-pack',
    },
  },
  {
    path: 'community/:id/members',
    loadComponent: () =>
      import('./pages/_placeholder/_placeholder.page').then(
        (m) => m.PlaceholderPageComponent,
      ),
    data: {
      title: 'Members',
      subtitle:
        'Capital / Signal / Access providers in this Community. Members belong to a Community — there is no global members list.',
      iconName: 'users',
      packName: 'community-members-pack',
    },
  },
  {
    path: 'community/:id/settings',
    loadComponent: () =>
      import('./pages/community-settings/community-settings.page').then(
        (m) => m.CommunitySettingsPageComponent,
      ),
  },
  {
    path: 'members/:name',
    loadComponent: () =>
      import('./pages/_placeholder/_placeholder.page').then(
        (m) => m.PlaceholderPageComponent,
      ),
    data: {
      title: 'Member Profile',
      subtitle:
        'Individual member profile — reputation tier, capital contributed, signals submitted, lifetime earnings.',
      iconName: 'user',
      packName: 'member-detail-pack',
    },
  },
];
