// Routes registered for the meridian Angular app. New pages mount
// here as `loadComponent` lazy entries so initial bundle stays small
// and each route ships its own primitives.
//
// @owner   spanexx
// @reviewed 2026-08-11
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'opportunities',
    loadComponent: () =>
      import('./pages/opportunities/opportunities.page').then(
        (m) => m.OpportunitiesPageComponent,
      ),
  },
];
