/**
 * Routes registered for the meridian Angular app
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { Routes } from '@angular/router';

export const routes: Routes = [
  // Root renders the shell-less marketing landing (wireframe index.html).
  // /showcase remains reachable directly for the primitives showcase.
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPageComponent),
  },
  {
    path: 'showcase',
    loadComponent: () => import('./pages/showcase/showcase.page').then((m) => m.ShowcaseComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPageComponent),
  },
  {
    path: 'opportunities',
    loadComponent: () =>
      import('./pages/opportunities/opportunities.page').then((m) => m.OpportunitiesPageComponent),
  },
  {
    path: 'executions',
    loadComponent: () =>
      import('./pages/executions/executions.page').then((m) => m.ExecutionsPageComponent),
  },
  {
    path: 'pool',
    loadComponent: () => import('./pages/pool/pool.page').then((m) => m.PoolPageComponent),
  },
  {
    path: 'communities',
    loadComponent: () =>
      import('./pages/communities/communities.page').then((m) => m.CommunitiesPageComponent),
  },
  {
    path: 'communities/:id',
    loadComponent: () =>
      import('./pages/communities/community-detail/community-detail.page').then(
        (m) => m.CommunityDetailPageComponent,
      ),
  },
  {
    path: 'community-detail/:id',
    loadComponent: () =>
      import('./pages/communities/community-detail/community-detail.page').then(
        (m) => m.CommunityDetailPageComponent,
      ),
  },
  {
    path: 'executions/:id',
    loadComponent: () =>
      import('./pages/executions/execution-detail/execution-detail.page').then(
        (m) => m.ExecutionDetailPageComponent,
      ),
  },
  {
    path: 'execution-detail/:id',
    loadComponent: () =>
      import('./pages/executions/execution-detail/execution-detail.page').then(
        (m) => m.ExecutionDetailPageComponent,
      ),
  },
  {
    path: 'opportunities/:id',
    loadComponent: () =>
      import('./pages/opportunities/opportunity-detail/opportunity-detail.page').then(
        (m) => m.OpportunityDetailPageComponent,
      ),
  },
  {
    path: 'opportunity-detail/:id',
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
    loadComponent: () => import('./pages/payouts/payouts.page').then((m) => m.PayoutsPageComponent),
  },
  {
    path: 'submit-signal',
    loadComponent: () =>
      import('./pages/submit-signal/submit-signal.page').then((m) => m.SubmitSignalPageComponent),
  },
  {
    path: 'profile',
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
    loadComponent: () =>
      import('./pages/notifications/notifications.page').then((m) => m.NotificationsPageComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.page').then((m) => m.SettingsPageComponent),
  },
  {
    path: 'community/:id/settings',
    loadComponent: () =>
      import('./pages/communities/community-settings/community-settings.page').then(
        (m) => m.CommunitySettingsPageComponent,
      ),
  },

  {
    path: 'community/:id/members',
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
    loadComponent: () =>
      import('./pages/communities/community-members/member-detail/member-detail.page').then(
        (m) => m.MemberDetailPageComponent,
      ),
  },
];
