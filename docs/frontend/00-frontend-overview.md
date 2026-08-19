# MERIDIAN Frontend Overview

Status: rewritten 2026-08-19 to match the REAL standalone + signals
architecture (Pack E item — the previous doc described a module-based
NgRx stack that was never built).

Owner: agent-maintained
Last reviewed: 2026-08-19

## Stack

| Layer | Choice | Where |
|---|---|---|
| Framework | Angular 20 (standalone components, no NgModules) | `frontend/` |
| Language | TypeScript 5.x, strict mode (`strict: true`, `strictTemplates`) | `tsconfig.json` |
| Styling | Tailwind CSS v4 + `theme.css` design tokens (copper system) | `src/styles.css`, `src/theme.css` |
| State | Angular signals (local page state; shared stores planned in Pack B — NO NgRx) | `signal()`/`computed()` |
| Data layer | Typed `ApiClient` over a transport seam | `src/app/core/api/` |
| Dev data | In-memory `MockGateway` seeded from `mock-seed.ts` (`environment.useMock`) | `src/app/core/api/mock-seed.ts` |
| Tests | vitest (unit, jsdom) + Playwright (e2e, screenshots) | `*.spec.ts`, `e2e/` |
| Lint | eslint 9 + angular-eslint flat config — STRICT (errors and warnings block) | `eslint.config.js` |
| Build | `ng build --configuration production` (fileReplacements → `environment.prod.ts`) | `angular.json` |

## Directory map (real)

```
frontend/src/
├── app/
│   ├── app.ts / app.config.ts / app.routes.ts   # bootstrap, DI providers, routes
│   ├── pages/<slug>/                             # one folder per route page
│   │   └── <slug>.page.ts (+ .spec.ts, *.template.html when split)
│   ├── shell/                                    # app shell (sidebar + top bar)
│   ├── ui/                                       # 19 primitives (button, card, badge, …)
│   └── core/
│       ├── api/          # ApiClient, transports, MockGateway, interceptors, http-context
│       ├── auth/         # TokenStore (session token, sessionStorage)
│       ├── models/       # canonical API models (member, pool, opportunity, …)
│       └── utils/        # money / dates / errors (display edge)
├── environments/         # environment.ts / environment.prod.ts / model / spec
└── theme.css, styles.css
```

## Data flow — one source (backend-switch readiness)

```
pages → ApiClient (typed, envelope-unwrapped)
          └─ API_TRANSPORT (InjectionToken, chosen in app.config.ts)
               ├─ dev:  MockTransport → MockGateway (seeded, 31 routes)
               └─ prod: HttpTransport → HttpClient + functional interceptors
                         (auth Bearer, correlation X-Request-ID, error mapping)
```

**Switching to the real backend = flip `environment.useMock` to `false`
and point `apiUrl` at the gateway.** No page changes: pages only ever see
the `ApiClient` surface. Contracts for every endpoint live in
`docs/apis/*` (auth, capital, opportunities, executions, payouts,
communities, governance, notifications, members).

## Cross-cutting conventions

- **Money** is API-string `"2340.80"` end-to-end; display formatting lives
  ONLY in `core/utils/money.ts` (`formatApiMoney`).
- **Auth**: `TokenStore` holds the Bearer token (sessionStorage-backed);
  the auth interceptor attaches it. Login persists the token; guards,
  refresh, and 2FA UI are Pack C work (see `docs/frontend/01-frontend-backlog.md`).
- **Theme**: `theme.css` tokens (`--v-*` copper system); light/dark via
  `documentElement.dataset.theme`. A single `ThemeService` is planned in
  Pack B (currently mirrored in 5 files).
- **Errors**: `ApiError` with conventions-documented codes
  (`docs/apis/00-api-conventions.md`), mapped by the error interceptor.
- **Templates**: wireframe-verbatim Tailwind markup; a11y enforced by
  eslint (`label for/id`, keyboard handlers, `role="presentation"` scrims).

## Quality gates (all enforced)

1. Pre-commit 11 checks incl. **strict ESLint** and **production build**
   (plain `tsc` is template-blind — never substitute it).
2. CI mirrors the gates (lint fails on any problem; build; audit; e2e).
3. TDD: every exported symbol has a spec; new code is RED→GREEN→REFACTOR.

## Remaining packs (see 01-frontend-backlog.md)

B — signal stores (auth/pool/opportunities/executions/payouts/
communities/notifications) + single ThemeService.
C — guards, token refresh, 2FA UI, KYC flow.
D — deposit/withdraw/vote/submit-signal flows to ApiClient.
E — remaining maintainability (landing split, doc refresh).
