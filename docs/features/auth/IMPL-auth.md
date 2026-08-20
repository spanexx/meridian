# Pack C — Auth (IMPL Plan)

**Date:** 2026-08-19
**PRD-TRD:** [PRD-TRD-auth.md](./PRD-TRD-auth.md)

## Status

**SHIPPED (2026-08-19).** All phases landed on `feat/frontend-data-layer`
in four commits (guards + e2e seeding → 2FA surface → profile KYC/2FA/
sign-out → interceptor retry). See [PRD-TRD-auth.md](./PRD-TRD-auth.md)
for the behavior spec (B1–B6 all implemented + tested).

- ✅ Phase 1 — Guards (`authGuard`, `roleGuard`) + spec
- ✅ Phase 2 — Routes wiring (`canActivate: [authGuard]`,
  `roleGuard('VETTER','OPERATOR')` for governance)
- ✅ Phase 3 — E2E `seedSession` helper + specs updated
- ✅ Phase 4 — `AuthStore` session (login/login2fa/refresh/logout/loadMe)
- ✅ Phase 5 — 2FA challenge surface on /login (B3)
- ✅ Phase 6 — KYC + 2FA display on /profile (B4)
- ✅ Phase 7 — Sign out on /profile (B5)
- ✅ Phase 8 — 401→refresh retry in interceptor (B6)
- ✅ Phase 9 — Validation (vitest 1048, eslint 0, prod build, playwright 157)
- ✅ Phase 10 — Commit + handoff

## Phase 5 — 2FA challenge surface on /login (B3)

**Files:** `frontend/src/app/pages/login/login.page.ts`,
`login.page.spec.ts`

**Behavior:**
- Add a `step: 'creds' | 'code'` signal; default `'creds'`
- On `submit()` from `'creds'`: if `auth.login()` returns
  `{ requires_2fa: true, temp_token, message }`, set
  `pending2fa = { temp_token, message }` + `step = 'code'`
- Render a 6-digit code input below the creds form when
  `step === 'code'`, with a "Back" / "Use a different account" link
- A new `submitCode()` method calls `auth.login2fa(temp_token, code)`,
  toasts success → navigate /dashboard, on error toasts failure and
  keeps the user on the step

**TDD (one test at a time):**
1. 🔴 spec: `submit() on creds step with 2FA challenge flips step to 'code'`
2. 🟢 implementation: detect 2FA, set signals
3. 🔴 spec: `submitCode() on code step calls login2fa and navigates to /dashboard`
4. 🟢 implementation: form binds to a 6-digit input
5. 🔴 spec: `submitCode() failure toasts and stays on 'code' step`
6. 🟢 implementation: catch + toast
7. 🔴 spec: `Back link on code step returns to 'creds'`
8. 🟢 implementation: back handler resets step

## Phase 6 — KYC + 2FA display on /profile (B4)

**Files:** `frontend/src/app/pages/profile/profile.page.ts`,
`profile.template.html`

**Behavior:**
- Replace hardcoded `identity.kyc: 'Verified'` with a computed from
  `auth.member()?.kyc_status` (KycStatus enum →
  human label + badge variant)
- Replace `identity.twofa: 'TOTP'` with a computed from
  `auth.member()?.two_factor_enabled`
- Add `KycStatusLabels` const map: VERIFIED → "Verified" (success),
  PENDING → "Pending" (warning), NOT_STARTED → "Not started"
  (default), REJECTED → "Rejected" (error)
- Wire the same pattern the existing email() computed uses

**TDD:**
1. 🔴 spec: `identity.kyc reads from auth.member().kyc_status`
2. 🟢 computed
3. 🔴 spec: `identity.twofa reads from auth.member().two_factor_enabled`
4. 🟢 computed

## Phase 7 — Sign out on /profile (B5)

**Files:** `frontend/src/app/pages/profile/profile.page.ts`

**Behavior:**
- `signOut()` calls `auth.logout()` (best-effort) and then
  `router.navigate(['/'])`
- Offline-safe: if the network call fails, the local clear still runs

**TDD:**
1. 🔴 spec: `signOut() calls auth.logout() and navigates to /`
2. 🟢 implementation: logOut first, navigate second

## Phase 8 — 401 → refresh retry in interceptor (B6)

**Files:** `frontend/src/app/core/api/auth.interceptor.ts`,
`auth.interceptor.spec.ts`

**Behavior:**
- Functional interceptor; on 401, attempt refresh via `AuthStore.refresh()`
- Single-flight: a module-level `refreshInFlight: Promise<boolean> |
  null` ensures concurrent 401s share one /auth/refresh call
- If refresh succeeds, clone the original request with the new Bearer
  and re-`next()` it
- If refresh fails, clear the session and propagate the original 401
- Skip the refresh dance for requests to `/auth/refresh` and `/auth/login`
  themselves (avoid infinite loops)

**TDD:**
1. 🔴 spec: `does not add Authorization on /auth/refresh requests`
2. 🟢 skip via `req.url` guard
3. 🔴 spec: `on 401, calls AuthStore.refresh and retries the request with the new token`
4. 🟢 refresh + retry via `next(clone)`
5. 🔴 spec: `on 401 + refresh failure, clears session and propagates the 401`
6. 🟢 error path

**Implementation note:** the existing test file uses a hand-rolled
`next` mock. The new tests need a mock that can return 401 once and
200 on the second call — see `vi.fn().mockImplementationOnce(...)`.

## Phase 9 — Validation

In order:

1. `npm test` — vitest (unit)
2. `npm run lint` — eslint
3. `npm run build` — typecheck + production bundle
4. `npm run e2e` — playwright (smoke + screenshots)
5. `python scripts/pre-commit.py` — full 11-check gate

Fix anything that fails, then re-run.

## Phase 10 — Commit + handoff

Per `.agents/skills/git-conventions/SKILL.md`:

- Single commit, Conventional Commits subject:
  `feat(auth): Pack C — 2FA challenge, KYC display, 401 refresh, signOut`
- Body: enumerate the behavior pins (B1–B6) + verification results
- Then write `sessions/.last-handoff` per `.agents/skills/handoff`
