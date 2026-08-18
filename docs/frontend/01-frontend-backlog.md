# Frontend Backlog — Pre-Backend Completion Plan

Date: 2026-08-18
Status: PLAN ONLY — not approved for execution. Reviewed by the user in
chat on 2026-08-18; execution starts only on explicit approval.
Owner: agent-maintained
Last reviewed: 2026-08-18

## Purpose

MERIDIAN is page-complete (all 20 wireframe pages routed and rendering)
but the layer under the pages does not exist: no data layer, no state,
no auth, several interactions are fake. The backend has not started
(no `backend/` directory, no API code — only contract docs). This
document is the day plan: everything the frontend must have before the
backend begins, the order to build it in, and the evidence for each gap.

## Current state (verified 2026-08-18)

| Area | Status |
|---|---|
| Wireframe pages (20 of 21 HTML files; the 21st is the index hub) | All routed via `app.routes.ts` |
| UI primitives (`ui/*`, 19 components) | Done, tested |
| Theme system (copper tokens, light/dark) | Done, but logic copy-pasted in 5 files |
| Unit tests | 843+ green (`vitest`, `--maxWorkers=2`) |
| E2E (Playwright + screenshots) | 157+ green |
| Pre-commit guardrails | 10/10 (YAML, secrets, comments, TSC, vitest, icons, new-page pack, router links, link targets, TDD) |
| HTTP / API layer | **Zero** — `grep HttpClient` = 0 matches in `frontend/src` |
| State management | **None** — every page owns local `signal()`s (18 in submit-signal alone) |
| Auth | **None** — login/register submit = `setTimeout(navigate('/dashboard'), 900)` |
| Environments | **None** — no `src/environments/` |
| Backend | Not started (docs-only: kernel/communities/governance feature docs) |

## Pending work — the gap list

### P1 — Contract layer (frontend must be API-contract-complete before backend)

1. **No API client** — 7 contract docs exist (`docs/apis/*`: conventions,
   auth, capital, opportunity, community, governance, members) but no code
   consumes them. Backend cannot be validated against a real consumer.
2. **No environments** — no `apiUrl` / `wsUrl` / `stripePublicKey` config;
   `docs/frontend/00-frontend-overview.md` §Environment requires them.
3. **No typed domain models** — CONTEXT.md's vocabulary (Member, Pool,
   Opportunity, Execution, Payout, Proposal, Vote) has no canonical TS
   shapes; the only data file in the app is `payouts.data.ts`.
4. **No money/date/error utilities** — API money is decimal strings
   (`"5000.00"`); 8 ad-hoc `toLocaleString`/`Intl.NumberFormat` spots.
   ~30 documented error codes have no frontend message mapping.

### P2 — State & centralization (user-requested theme)

5. **No state management** — no `core/`, no `state/`, no `services/`
   directories. `docs/frontend/00-frontend-overview.md` §State (NgRx)
   unimplemented. Decided 2026-08-18: **signals-based stores, not NgRx**
   (matches the real stack; overview doc rewritten in Pack E).
6. **Theme logic copy-pasted 5×** — `'meridian-theme'` localStorage in
   `app.ts:41`, `shell.component.ts:201-208`, `login.page.ts:189-199`,
   `register.page.ts:173-183`, `landing.page.ts:464-470`,
   `settings.page.ts:82`. One `ThemeService` should own this.
7. **Notification prefs not persisted** — `notifications.page.ts:168`
   `switches = signal([true,true,true,true])`, lost on reload.

### P3 — Auth & session (blocker for any real backend call)

8. **No auth service** — no credentials sent, no token storage, no session.
9. **No route guards** — every app route is public; no role gates
   (VETTER+/OPERATOR per CONTEXT.md).
10. **No interceptors** — no Bearer, no 401→refresh retry, no
    `X-Request-ID` / `X-Idempotency-Key` (required by conventions).
11. **No 2FA surface** — `AUTH_2FA_REQUIRED` + withdrawal journey 2FA
    > $1000 (`docs/journeys/07-withdrawal.md`).
12. **No KYC flow** — `profile.page.ts:140` hardcodes `kyc: 'Verified'`.

### P4 — Interactive flows that are still fake

13. **Deposit / withdraw** — `pool.page.ts:161,215`: modal submit just
    closes. Journey requires Stripe Elements + micro-deposit verification.
14. **Signal submission** — `submit-signal.page.ts:117-123`: submit =
    toast + navigate. No payload vs `03-signal-submission.md`, no evidence
    upload (wizard step 4), no draft.
15. **Governance votes** — `governance.template.html:100`: approve/reject
    bars are fixture data, no vote action.
16. **Vetting** — `docs/journeys/04-vetting-process.md` defines
    `GET /api/v1/vetting/queue`; no queue view; opportunity-detail voting
    is local.
17. **Loading states** — dashboard/pool KPIs render fixtures
    synchronously; `skeleton`/`empty-state` primitives exist but nothing
    loads.

### P5 — Maintainability & docs drift

18. **`docs/frontend/00-frontend-overview.md` fully drifted** — describes
    NgRx + Material + modules + `'' → /dashboard` as current. Real stack:
    standalone + signals + Tailwind + `ui-*`. Rewrite required.
19. **CONTEXT.md route tables stale** — 7 placeholder routes listed
    (governance, payouts, submit-signal, profile, members, settings,
    member-detail) are all real now; recent routes missing (notifications,
    settings, `community/:id`, 404).
20. **Dead code** — `pages/_placeholder/` (component + spec): no route, no
    import, zero references. CONTEXT.md's "Stub" concept obsolete.
21. **Landing template 1109 lines** (submit-signal: 491) vs ~350 guidance
    (AGENTS.md §7.2) — split into partials.
22. **`/showcase` dev page ships in prod routes** (`app.routes.ts:18`).
23. **Screenshot churn** — 7 committed e2e PNGs regenerate on every visual
    change (currently dirty in the tree).
24. **Known sibling bug** — `community-members.template.html:17` still
    `sm:items-center` (fixed on settings + governance; flagged in the
    2026-08-13 handoff).

## The day plan — packs in order

| Pack | Scope | Done when | Depends on |
|---|---|---|---|
| **A — contract layer** | environments/; canonical models from `docs/apis/*`; ApiClient + transport seam (MockTransport for dev, HttpTransport for the real gateway); money/date/error utils; in-memory MockGateway seeded from wireframe fixtures; payouts page as reference consumer | no page imports fixtures directly; transport swap is one env flag; specs green | — |
| **B — state** | ThemeService (kills the 5 copies); signal stores (auth, pool, opportunities, executions, payouts, communities, notifications); all pages consume stores | pages read stores, not fixtures; theme logic in one place | A |
| **C — auth** | AuthService + token storage; AuthGuard + role guard; AuthInterceptor (Bearer, 401→refresh, request-id, idempotency); real login/register; 2FA challenge surface; KYC status flow | app routes protected; login/register submit real payloads | B |
| **D — flows** | deposit/withdraw validation + lifecycle; submit-signal payload + evidence step; governance vote action; vetting queue view; notifications persistence; dashboard/pool loading states | each interaction reaches the ApiClient with validation | C |
| **E — maintainability** | rewrite frontend overview doc; refresh CONTEXT.md routes; delete `_placeholder`; split landing template; gate `/showcase`; screenshot hygiene; community-members header fix | docs match code; dead code gone; suite green | any |

**Backend starts after A–C** — a contract-complete consumer is the
handoff point. D and E can continue in parallel with early backend work
if the user prefers; A–C cannot.

## API contract research — findings the backend pack must resolve

Extracted 2026-08-18 from `docs/apis/*` + `docs/journeys/*` (strict,
only fields actually read):

1. **No executions API doc** — all execution/inventory endpoints and
   shapes come from journey 05; **no `GET /executions` list endpoint
   documented** while the UI renders an executions table.
2. **No payouts API doc** — endpoints from journey 06 only;
   `your_distribution` shape differs by role; no payout response carries
   member info (the wireframe ledger page needs a pool-wide
   `GET /payouts`).
3. **No notifications API doc at all** — only type lists
   (`EXECUTION_STARTED`, `PAYOUT_READY`, …) + one example payload.
4. **GET /opportunities and GET /opportunities/{id} are table-only** —
   no response bodies documented; `description`/`details` appear only in
   the POST request.
5. **Money typing conflict** — 00-conventions: strings `"5000.00"`;
   04 + journeys: numbers (estimates, profits, allocations). Ledger =
   string, analytics = number (as the docs literally render them).
6. **Reputation tier conflict** — `SILVER` (04/06 tier table) vs `T4`
   (05/06 community rows).
7. **contribution_type casing conflict** — auth `["CAPITAL","SIGNAL"]`
   vs community lowercase `capital|signal|access|operator|admin`.
8. **Governance parameter keys disagree** between 06
   (`distribution.shares "60/25/15"`, `reserve_ratio_target`) and 05
   (`distribution.capital_share/signal_share/access_share`, no
   reserve_ratio_target) — the parameter grid must pick a canonical set.
9. **Member id prefix** — members.md uses a plain hex ObjectId; auth +
   conventions use `mem_…`.
10. **Execution participants shape** differs between POST response
    (plain id strings) and GET detail (objects).

These go into the backend pack's GRILL/PRD-TRD as must-document items;
the frontend models annotate each conflict at its call site.

## Work already started (2026-08-18) — PARKED, not approved

Execution began before the plan was approved and was stopped the same
day on the user's instruction. **Nothing was pushed; master untouched.**
All of the following sits on the local branch `feat/frontend-data-layer`
(no upstream):

- **Committed `a18ba19`**: pack docs (`docs/features/frontend-data-layer/`
  PRD-TRD + IMPL), `frontend/src/environments/` (dev/prod + model +
  spec), `frontend/src/app/core/utils/` (money, dates, errors + specs),
  `frontend/angular.json` (production fileReplacements), 2 lines in
  `sessions/decisions.md`. Pre-commit 10/10 green; environments + utils
  specs 22/22 green.
- **Untracked (still in the tree)**: `frontend/src/app/core/api/`
  (api-response, api-transport, mock-gateway, mock-transport + specs —
  specs written but not yet run) and `frontend/src/app/core/models/`
  (6 of 9 files: member, pool, opportunity, execution, payout,
  community; governance, notification, barrel + model spec NOT written).
- **Not started**: ApiClient, gateway seed data, payouts rewiring, and
  all of packs B–E.

Resume rule: this work executes only after this plan is approved; the
PRD-TRD/IMPL docs carry the same status marker.

## Open decisions

- State tech: **signals stores** (user pick, 2026-08-18).
- Today's scope if approved: **all packs A–E** (user pick, 2026-08-18).
- Sequencing of D/E vs early backend: user call when A–C land.

## How to proceed

1. User reviews this plan (and optionally the parked Pack A status).
2. User approves scope + order (any subset of A–E).
3. Resume the execution goal; each pack ships `docs/features/<slug>/` +
   TDD specs + implementation + drift check, merged via PR per
   git-conventions.
4. Backend starts after A–C with a contract-complete consumer.
