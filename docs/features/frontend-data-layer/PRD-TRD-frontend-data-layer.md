Frontend Data Layer - PRD and TRD

Date: 2026-08-18
GRILL: none — direction locked by docs/apis/* (seven contract docs),
docs/00-api-conventions.md, and the 2026-08-18 audit (sessions/decisions.md).
Status: PRD + TRD locked. IMPL in progress in the same session.

Goal

Give the Angular frontend a contract-complete data layer so that, the day
the backend gateway exists, every page can point at it without a rewrite.
Today the app has zero HTTP usage, no environments, no typed models, and
every page owns hardcoded fixtures (only payouts.data.ts is extracted).
This pack ships: environments/, canonical typed models matching
docs/apis/*, a small ApiClient + transport seam, money/date/error
utilities, and an in-memory MockGateway that serves the wireframe data
through the SAME client interface the real gateway will use.

Acceptance criteria (all four must be green to ship)

1. `npm run build` exits 0; `npm audit --omit=dev` returns 0.
2. New unit specs (TDD) cover every exported symbol; full `vitest run`
   stays green (843 existing + new).
3. At least one page (payouts) consumes the ApiClient through the
   MockGateway end-to-end; its fixture file moves into the gateway.
   Remaining pages rewire in the state pack (next in sequence).
4. The transport seam is documented so the real gateway swap is a
   one-file change (environment flag), not a page change.

In scope

A. `frontend/src/environments/` — environment.ts (dev) +
   environment.prod.ts (prod) with apiUrl, wsUrl, stripePublicKey,
   useMock flag; angular.json production fileReplacements.
B. `frontend/src/app/core/models/*` — canonical TypeScript models
   (snake_case fields, money as string, ISO-8601 dates, UPPER_SNAKE
   enums) extracted strictly from docs/apis/* and docs/journeys/*.
C. `frontend/src/app/core/api/` — ApiResponse envelope, ApiError +
   error-code map (docs/apis/00-api-conventions.md §Error Codes),
   ApiTransport interface, HttpTransport (fetch-based: Bearer,
   X-Request-ID, X-Idempotency-Key, response unwrap, error mapping),
   MockTransport + MockGateway (in-memory, latency-simulated,
   seeded from the wireframe fixtures collected from every page).
D. `frontend/src/app/core/api/api-client.ts` — typed methods per
   domain (auth, capital, opportunities, executions, payouts,
   communities, governance, members, notifications) returning the
   canonical models.
E. `frontend/src/app/core/utils/` — money.ts (formatApiMoney: string
   cents-safe → display, parse/validate), dates.ts (ISO → display,
   relative), errors.ts (code → user-facing message).
F. Payouts page rewired to consume ApiClient via MockGateway
   (reference consumer proving the seam). payouts.data.ts content
   moves into MockGateway seed data.
G. DSHS-service decision: `provideHttpClient` is NOT introduced; the
   transport is fetch-based so the seam is plain TypeScript and unit
   tests never touch a browser. Recorded as a DRIFT note in the
   transport file (docs/frontend/00-frontend-overview.md still
   describes HttpClient; that doc is rewritten in the maintainability
   pack).

Out of scope (next packs, in order)

- State stores + all-page rewiring (state pack): ThemeService,
  signal-based domain stores, pages consume stores.
- Auth service/guard/interceptor + real login/register (auth pack).
- Interaction completion: deposit/withdraw validation, submit-signal
  payload, governance vote, notification prefs persistence, loading
  states (flows pack).
- Docs maintenance: rewrite docs/frontend/00-frontend-overview.md,
  refresh CONTEXT.md route tables, delete _placeholder, split the
  landing template, gate /showcase, screenshot hygiene (maintain pack).
- Real gateway wiring: happens when the backend exists; no code change
  beyond environment.useMock = false.

Technical decisions (locked)

1. Transport seam: `ApiTransport.request(method, path, body, opts)`
   returning a Promise<unknown> (the raw `data` payload). ApiClient is
   the only place that knows model shapes; transports never do.
2. MockGateway is an in-memory router: path + method → handler;
   handlers return the API envelope; errors are thrown as ApiError
   with codes from the conventions doc. Latency simulated (~120ms) so
   loading states are real during development.
3. Money stays a string end-to-end in models; formatting happens only
   in money.ts at the display edge (matches conventions §Field
   Conventions: money is string, always cents).
4. File layout keeps the repo convention: core/ holds shared
   singleton services; models are plain interfaces + const enums;
   every file gets the comment-policy header.
5. Specs use real MockTransport instances (no test doubles of the
   client itself — the mock IS the test double by design).

Verification

- `cd frontend && npx vitest run` — all green, new specs included.
- `cd frontend && npm run build` — exit 0.
- `npx playwright test` — e2e still green (payouts spec exercises the
  rewired page).
- Pre-commit hook: all blocks pass (comment policy, TDD enforcement,
  tsc, unit tests, icon registry, new-page pack, router links, link
  targets).

Owner: agent-maintained
Last reviewed: 2026-08-18

## Status 2026-08-18 — work started before plan approval; PARKED

The user's day-plan instruction was "plan the day", not "execute".
Implementation of this pack started prematurely and was stopped the
same day. Nothing was pushed; master untouched. State:

- Branch `feat/frontend-data-layer` (local only, no upstream),
  commit `a18ba19` — environments + utils + specs + angular.json +
  pack docs + decisions log. Pre-commit 10/10 green; environments +
  utils specs 22/22 green.
- Untracked (still in the tree): `frontend/src/app/core/api/`
  (api-response, api-transport, mock-gateway, mock-transport + specs;
  specs written, not yet run) and `frontend/src/app/core/models/`
  (6 of 9: member, pool, opportunity, execution, payout, community;
  governance, notification, barrel + model spec NOT written).
- Not started: ApiClient, gateway seed data, payouts rewiring, packs B–E.
- Resume rule: executes only after the user approves the plan in
  docs/frontend/01-frontend-backlog.md. Remaining steps = IMPL 3–7.