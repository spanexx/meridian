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
];
