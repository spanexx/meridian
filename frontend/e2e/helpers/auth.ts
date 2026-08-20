/**
 * E2E auth helper — seeds a live session before protected-route tests.
 *
 * Pack C (2026-08-19): routes carry authGuard, so every e2e spec that
 * navigates straight to a protected route must seed a token first. The
 * values mirror the dev mock seed (mock-seed.ts TOKEN/REFRESH constants),
 * so the session survives into AuthStore/TokenStore and the guard passes
 * while /auth/me still serves the seeded member.
 *
 * TEST-COUPLED: exercised indirectly by every protected-route e2e spec
 * (dashboard/executions/notifications/opportunities/opportunity-detail/
 * payouts/pool/submit-signal) — no standalone unit spec needed.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import type { Page } from '@playwright/test';

/** Access token issued by the dev MockGateway (mock-seed.ts). */
const ACCESS_TOKEN = 'mock_access_token_2026';
/** Refresh token issued by the dev MockGateway (mock-seed.ts). */
const REFRESH_TOKEN = 'mock_refresh_token_2026';

/**
 * Arrange a signed-in session for the page. Runs before every navigation
 * (addInitScript) so Angular boots with the token already in sessionStorage.
 */
// TEST-COUPLED: exercised indirectly by every protected-route e2e spec
export async function seedSession(page: Page): Promise<void> {
  await page.addInitScript(
    ({ access, refresh }: { access: string; refresh: string }) => {
      sessionStorage.setItem('meridian_access_token', access);
      sessionStorage.setItem('meridian_refresh_token', refresh);
    },
    { access: ACCESS_TOKEN, refresh: REFRESH_TOKEN },
  );
}
