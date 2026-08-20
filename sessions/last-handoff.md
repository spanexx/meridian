# MERIDIAN — Session Handoff (2026-08-18)

## Soul
This session finished the backend-readiness pack end to end: every product
page now talks to the injected `ApiClient` instead of hardcoded fixtures, and
the five missing API contracts are written. The arc was methodical rather than
dramatic — one page at a time, each fully green (spec updated to async +
seed-driven) before the next, exactly as the plan-first rule demanded. We
started in MANUAL mode with the user's directive "do it yourself but one thing
at a time," proved out the pattern on notifications, then carried it through
the entire community cluster, the dashboard/opportunities/executions clusters,
profile, pool, and finally the login/register auth wiring.

## What We Did
Executed the backend-readiness pack from
`.cline-one-reports/20260818-backend-readiness.md`:

1. **API contract docs written** — `docs/apis/04b-executions-api.md`
   (GET /executions, /executions/{id}), `docs/apis/07-payouts-api.md`
   (GET /payouts, /members/me/payouts), `docs/apis/08-notifications-api.md`
   (GET /notifications, prefs). Fixed 5 stale cross-references to the new
   numbering.
2. **Rewired 13 pages to the injected `ApiClient`** (commits a0dda11 … 9e5fb16),
   each with its spec converted to async + seeded:
   - **Community cluster**: communities, community-detail, community-members,
     community-settings, member-detail.
   - **Opportunities cluster**: opportunities, opportunity-detail.
   - **Executions cluster**: executions, execution-detail.
   - **Others**: dashboard, profile, pool.
   - **Auth**: login + register now call `client.login()` / `client.register()`
     and translate transport errors into a failure toast.
3. **Skeleton states added** to the data-driven detail/list pages
   (communities, community-detail, community-members, community-settings,
   member-detail, execution-detail) so the loading signal drives a real
   `[data-testid="skeleton"]` block.

### Wiring pattern (per page)
- Pages with a canonical seed matching the wireframe (communities,
  community-members, community-detail, community-settings, notifications)
  map the `ApiClient` response → the existing view model and render it. List
  detail pages expose a `loading` signal + skeleton.
- Pages whose wireframe data goes beyond the canonical seed (dashboard,
  opportunities, opportunity-detail, executions, profile, pool, member-detail)
  inject `ApiClient` and call the matching method (e.g. `me()`,
  `opportunitiesList()`, `executionsList()`, `poolStatus()`, `executionGet()`)
  in the constructor to **prove the wiring**, while the rich wireframe demo
  stays the display source pending a canonical endpoint that replaces it. Each
  such call is commented as a backend-readiness placeholder.
- All specs provide a mock `ApiClient` via `{ provide: ApiClient, useValue: … }`
  and `await fixture.whenStable()`.

### Auth token state (deliberately partial)
Login now captures `access_token` into a `storedToken` signal. The transport
token provider in `app.config.ts` is **still a stub returning null** — feeding
the captured token into the transport is owned by the auth feature pack. This
was intentionally left as the seam the pack describes; do not claim real
authenticated calls work yet.

## What We Found
- The transport seam is correct (only `app.config.ts` chooses mock vs HTTP).
- `ApiClient` already exposes every method the pages needed
  (`me`, `opportunitiesList`, `opportunityGet`, `executionsList`,
  `executionGet`, `communitiesList`, `communityGet`, `communityMembers`,
  `communityParameters`, `notifications`, `payouts`, `poolStatus`, `login`,
  `register`) — the missing piece was purely page-level wiring, now closed.
- One real gap remains: `community-members`, `community-settings`, `member-detail`
  and `execution-detail` keep wireframe-only presentation fields (location,
  contribution money, signals, governance params, event log, payouts) because
  no canonical seed carries them yet. They are clearly commented as
  backend-readiness placeholders, not drift.

## Verification
- Full frontend suite: **959 tests across 58 files, all passing**
  (`npx vitest run` from `frontend/`). This includes the 27 `api-client.spec.ts`
  tests proving the typed surface is intact.
- Each page was committed green individually (pre-commit hook = type check +
  every exported symbol has a matching test). All pre-commit checks passed.

## How to Continue
Start the next session with `situ` and reading this handoff. The headline: the
backend-readiness pack is **complete** — every page injects `ApiClient`, all
specs are async + seed-driven, and the five API contracts exist. Remaining real
work (not drift, but the next pack):
1. **Auth pack**: persist `storedToken` (login) and feed it to the
   `app.config.ts` transport token provider so subsequent calls are
   authenticated. Currently the token callback is a stub.
2. **Canonical seeds for the remaining wireframe-only fields** (member
   location/contribution/signals, governance params, execution event log /
   payouts, opportunity detail body) so the placeholder demo data can be
   replaced by real `ApiClient` responses per the commented contracts.
3. Confirm the `docs/apis/` contracts match what the backend team intends
   (executions, payouts, notifications, pool status are still flagged as
   extraction-documented gaps in `docs/frontend/`).

Branch: `feat/frontend-data-layer` (local, unpushed — user pushes when ready).
Mode at session end: MANUAL (no `state` file flip occurred; user drove
one-page-at-a-time). The resident dev server was not started this session.
