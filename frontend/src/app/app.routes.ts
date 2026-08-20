/**
 * Routes registered for the meridian Angular app
 *
 * Pack C (2026-08-19): protected routes carry `canActivate: [authGuard]`
 * (auth required → redirect to /login with ?returnUrl); the per-community
 * governance route additionally carries `roleGuard('VETTER','OPERATOR')`
 * (voting requires vetting privileges per CONTEXT.md). Landing, login,
 * register and the 404 wildcard stay public.
 *
 * Pack E (2026-08-21): the dev-only /showcase primitives catalog and its
 * dependent primitive e2e specs were REMOVED (user decision) — the page
 * existed solely as a test host; primitives keep their vitest unit specs.
 *
 * @owner   spanexx
 * @reviewed 2026-08-21
 */
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Root renders the shell-less marketing landing (wireframe index.html).
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPageComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPageComponent),
  },
  {
    path: 'opportunities',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/opportunities/opportunities.page').then((m) => m.OpportunitiesPageComponent),
  },
  {
    path: 'executions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/executions/executions.page').then((m) => m.ExecutionsPageComponent),
  },
  {
    path: 'pool',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/pool/pool.page').then((m) => m.PoolPageComponent),
  },
  {
    path: 'communities',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/communities/communities.page').then((m) => m.CommunitiesPageComponent),
  },
  {
    path: 'communities/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/communities/community-detail/community-detail.page').then(
        (m) => m.CommunityDetailPageComponent,
      ),
  },
  {
    path: 'community-detail/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/communities/community-detail/community-detail.page').then(
        (m) => m.CommunityDetailPageComponent,
      ),
  },
  {
    path: 'executions/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/executions/execution-detail/execution-detail.page').then(
        (m) => m.ExecutionDetailPageComponent,
      ),
  },
  {
    path: 'execution-detail/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/executions/execution-detail/execution-detail.page').then(
        (m) => m.ExecutionDetailPageComponent,
      ),
  },
  {
    path: 'opportunities/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/opportunities/opportunity-detail/opportunity-detail.page').then(
        (m) => m.OpportunityDetailPageComponent,
      ),
  },
  {
    path: 'opportunity-detail/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/opportunities/opportunity-detail/opportunity-detail.page').then(
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
    // Governance is per-community (proposals and parameters only matter
    // within a single community). Same pattern as /community/:id/members
    // and /community/:id/settings (PR #45).
    path: 'community/:id/governance',
    canActivate: [authGuard, roleGuard('VETTER', 'OPERATOR')],
    loadComponent: () =>
      import('./pages/communities/community-governance/governance.page').then(
        (m) => m.GovernancePageComponent,
      ),
  },
  {
    // Backwards-compat alias: legacy /governance redirects the user to
    // the default community's governance view. Same pattern as the
    // community/:id alias (PR #45).
    path: 'governance',
    redirectTo: 'community/alpha/governance',
    pathMatch: 'full',
  },
  {
    path: 'payouts',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/payouts/payouts.page').then((m) => m.PayoutsPageComponent),
  },
  {
    path: 'submit-signal',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/submit-signal/submit-signal.page').then((m) => m.SubmitSignalPageComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePageComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPageComponent),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/notifications/notifications.page').then((m) => m.NotificationsPageComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/settings/settings.page').then((m) => m.SettingsPageComponent),
  },
  {
    path: 'community/:id/settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/communities/community-settings/community-settings.page').then(
        (m) => m.CommunitySettingsPageComponent,
      ),
  },

  {
    path: 'community/:id/members',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/communities/community-members/community-members.page').then(
        (m) => m.CommunityMembersPageComponent,
      ),
  },
  {
    // DISCOVERY 2026-08-13: alias for community-detail/:id.
    // See .agents/skills/playwright-cli/SKILL.md.
    // The shell sidebar and several breadcrumb links historically
    // used /community/<ref>, which had no route registered and
    // silently redirected to / on miss — users reached a blank
    // page. Added this alias so both URLs work, matching the
    // dual-route pattern already used for communities/:id +
    // community-detail/:id and executions/:id + execution-detail/:id.
    //
    // Pointer: .agents/skills/playwright-cli/SKILL.md — the
    // route probe found /community/alpha redirected to / because
    // the user typed it without the -detail suffix.
    //
    // Order matters: this entry is placed AFTER
    // /community/:id/{members,settings} so the children still match
    // their own routes (Angular's first-match-wins).
    path: 'community/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/communities/community-detail/community-detail.page').then(
        (m) => m.CommunityDetailPageComponent,
      ),
  },
  {
    // Member is a member of a community, not a global resource.
    // Matches the per-community decision made on 2026-08-12 (Members removed
    // from top-level sidebar nav). The :id binds to MemberDetailPageComponent.id
    // and :memberId binds to .memberId; both default so the page renders
    // before the route binds.
    path: 'community/:id/members/:memberId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/communities/community-members/member-detail/member-detail.page').then(
        (m) => m.MemberDetailPageComponent,
      ),
  },
  {
    // Wildcard — every unknown URL shows the 404 page instead of a blank shell.
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.page').then((m) => m.NotFoundPageComponent),
  },
];
