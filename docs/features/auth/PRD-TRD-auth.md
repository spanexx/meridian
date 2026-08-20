# Pack C — Auth (PRD + TRD)

**Date:** 2026-08-19
**Status:** SHIPPED (2026-08-19)
**Owner:** agent-maintained
**Branch:** `feat/frontend-data-layer` (unpushed)
**Depends on:** Pack A (API layer), Pack B (state stores)

## 1. Goal

Make the frontend **auth-complete for the contract layer** so flipping
`useMock: false` connects the app to the real gateway without changing any
page code. After Pack C, the app:

- protects every app route behind `authGuard` (redirects to /login with
  `?returnUrl=…`)
- composes `roleGuard('VETTER','OPERATOR')` on routes that require
  vetting privileges (community governance, etc.)
- persists the full session (access + refresh + expiry) and auto-refreshes
  on 401 — silent for the user, terminal on hard expiry
- handles a 2FA challenge from /login with a real code-input step
- reads KYC + 2FA status from the session member on /profile (no more
  hardcoded "Verified")
- signs out via `AuthStore.logout()` (clears server + local session)

Safety rails: `docs/money/*`, integrity/non-ponzi, human control over
money. None of these change.

## 2. Scope (in)

1. **Route guards** — `authGuard`, `roleGuard`
2. **Session model** — `TokenStore` (access + refresh + expiry),
   `AuthStore` (login / login2fa / refresh / logout / loadMe)
3. **HTTP interceptors** — auth (Bearer), correlation, error
4. **Protected routes** — every app route carries `canActivate:
   [authGuard]`; per-community governance also carries `roleGuard`
5. **E2E session helper** — `seedSession(page)` so protected-route e2e
   specs boot with a live token
6. **2FA challenge surface** on /login (creds → code → /dashboard)
7. **KYC status display** on /profile (from `auth.member().kyc_status`)
8. **Sign out** on /profile (calls `auth.logout()` + navigates /)
9. **Registration UX** — register issues no token (verify-email flow),
   routes to /login

## 3. Out of scope (deferred)

- **Withdrawal 2FA gate** (`docs/journeys/07-withdrawal.md` says
  withdrawals > $1000 need 2FA) — wireframe hasn't shipped the form yet;
  the data-layer + store seam are ready, the page is Pack D.
- **KYC submission flow** — profile shows status; submitting a KYC
  document is Pack D.
- **Email verification flow** — registration issues no token + the
  register copy points the user to /login; the actual email-link
  consumption is backend-only.

## 4. Contract surface (already documented at docs/apis/01-auth-api.md)

- `POST /auth/login` → `LoginResponse | TwoFactorChallenge`
- `POST /auth/login/2fa` → `TwoFactorLoginResponse` (AuthTokens)
- `POST /auth/register` → `RegisterResponse` (no token)
- `GET /auth/me` → `{ member, session }` (uses `AuthMeMember`)
- `POST /auth/refresh` → `AuthTokens` (rotates pair)
- `POST /auth/logout` → `{ success: true }`
- `POST /auth/2fa/setup|verify|disable` → 2FA enrollment (Pack D)

## 5. Behavioral Spec (testable scenarios)

### B1. Guard — auth

- B1.1 `authGuard` returns `true` when `AuthStore.isAuthenticated()`
- B1.2 `authGuard` fires `loadMe()` (warm member) when authenticated
- B1.3 `authGuard` returns `UrlTree('/login?returnUrl=...')` when not
  authenticated; `returnUrl` equals the requested path

### B2. Guard — role

- B2.1 `roleGuard('VETTER','OPERATOR')` returns `true` when
  `member.roles` includes at least one of the required
- B2.2 redirects to `/` when authenticated but lacking the role
- B2.3 redirects to `/login?returnUrl=...` when member not loaded

### B3. 2FA challenge surface

- B3.1 `submit()` on /login switches to a 6-digit code input when
  `auth.login()` returns a `TwoFactorChallenge` (no token)
- B3.2 the code input calls `auth.login2fa(temp_token, code)` and on
  success navigates to /dashboard
- B3.3 the code input renders an error toast and stays on the step on
  failure (lets the user correct the code)
- B3.4 a "Back" / "Use a different account" link returns the page to
  the credentials step

### B4. KYC + 2FA status display

- B4.1 profile identity card shows `kyc_status` as a human label:
  `VERIFIED` → "Verified", `PENDING` → "Pending", `NOT_STARTED` →
  "Not started", `REJECTED` → "Rejected"
- B4.2 the 2FA row shows "TOTP" when `two_factor_enabled` is true and
  "Not enabled" otherwise

### B5. Sign out

- B5.1 profile "Sign out" button calls `auth.logout()` (best-effort
  server call + local clear) and navigates to `/`
- B5.2 signOut works even when the server is unreachable (offline-safe)

### B6. 401 → refresh retry

- B6.1 a request that returns 401 with a recorded refresh token triggers
  a single `POST /auth/refresh` and retries the original request with
  the new access token
- B6.2 if refresh succeeds, the original request is retried exactly
  once (no retry loop)
- B6.3 if refresh fails (no refresh token, or /auth/refresh 401), the
  session is cleared and the original 401 is propagated; the guard
  handles the redirect on the next navigation
- B6.4 concurrent 401s share a single in-flight refresh (no stampede)

## 6. Constraints

- All auth calls go through `AuthStore` — pages never touch
  `ApiClient.auth` directly (the register page already migrated in
  Pack B; the login + 2FA pages migrate here)
- `AuthStore.isAuthenticated()` is the single source for "is the
  session live" — guards, navigation, and pages read it from there
- Mock and real transports must produce identical wire behavior; the
  same `LoginResponse | TwoFactorChallenge` union flows through both
- 401→refresh must be single-flight (multiple parallel 401s share one
  /auth/refresh) — otherwise N concurrent requests fire N refreshes
- No page reads from a localStorage / sessionStorage token directly;
  `TokenStore` is the only reader

## 7. Verification

| Check | Tool | Acceptance |
|---|---|---|
| Type-check | `npm run build` | exit 0 |
| Unit | `npm test` (vitest) | 100% green, 4 new specs (B1, B2, B3, B4, B5, B6) |
| E2E | `npm run e2e` (playwright) | 100% green, all 9 guarded routes pass with `seedSession` |
| Lint | `npm run lint` | 0 problems |
| Pre-commit | `python scripts/pre-commit.py` | 11/11 checks pass |
| Visual fidelity | per `.agents/skills/visual-fidelity-check` | wireframe-faithful 2FA + KYC + sign-out |

## 8. Files touched

New:
- `frontend/src/app/core/guards/auth.guard.ts`
- `frontend/src/app/core/guards/role.guard.ts`
- `frontend/src/app/core/guards/guards.spec.ts`
- `frontend/e2e/helpers/auth.ts`

Modified:
- `frontend/src/app/app.routes.ts` (guards wired)
- `frontend/src/app/core/api/auth.interceptor.ts` (401 retry)
- `frontend/src/app/core/api/auth.interceptor.spec.ts` (retry tests)
- `frontend/src/app/pages/login/login.page.ts` (2FA step)
- `frontend/src/app/pages/login/login.page.spec.ts` (2FA tests)
- `frontend/src/app/pages/profile/profile.page.ts` (KYC/2FA/signOut)
- `frontend/src/app/pages/profile/profile.page.spec.ts` (B4 + B5)
- `frontend/e2e/{9 specs}.spec.ts` (seedSession)
- `frontend/e2e/landing.spec.ts` (footer relaxed to `/\/(payouts|login)/`)

## 9. Resume rule

SHIPPED 2026-08-19 — this pack is closed. Next packs: **D — flows**
(deposit/withdraw/vote/submit-signal mutations to ApiClient) and
**E — maintainability** (landing template split), from
`docs/frontend/01-frontend-backlog.md`.
