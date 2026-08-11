Frontend Scaffold - PRD and TRD

Date: 2026-08-11
GRILL: docs/features/frontend-scaffold/GRILL-frontend-scaffold.txt
Status: PRD + TRD locked. IMPL is in progress in the same session.

Replacement note: this PRD-TRD replaces the earlier scaffold PRD-TRD
which produced a broken Angular 19 scaffold with fabricated version
pins and broken templates. The user requested path B (regenerate via
ng new) and this PRD-TRD describes that path.

Goal

Ship a verified Angular 20 scaffold with Tailwind v4 and theme.css
wired correctly. The output is a runnable Angular app at frontend/
that renders a smoke test dashboard matching the wireframe's
design tokens, with a Playwright test that enforces visual fidelity
on every future page port.

Acceptance criteria (all three must be green to ship)

1. npm audit --omit=dev returns 0 vulnerabilities.
2. npm run build exits 0 with no warnings (or only documented
   Sass deprecations).
3. npm run e2e passes all Playwright tests, and a dashboard
   screenshot is captured for human review.

Acceptance is binary: ship or do not ship.

In scope this session

A. Regenerate the Angular workspace using the official ng new CLI.
- npx @angular/cli@20 new meridian --routing --style=scss --strict
  --standalone
- Project lives at frontend/ at the repo root.
- No hand-written package.json. No hand-written angular.json. No
  hand-written tsconfig files. The CLI's output is the canonical
  starting point.

B. Copy theme.css verbatim from the wireframe.
- Source: wireframe/meridian/kit/theme.css (555 lines, 128 CSS
  classes, design tokens for light and dark themes).
- Destination: frontend/src/theme.css.
- Verification: diff -q shows zero difference.

C. Wire Tailwind v4.
- Install: npm install --save-dev tailwindcss @tailwindcss/postcss
  postcss autoprefixer (let npm choose the latest compatible
  versions, never hand-type pins).
- PostCSS config: frontend/.postcssrc.json with @tailwindcss/postcss
  plugin only.
- styles.scss imports theme.css first, then tailwindcss/theme.css
  and tailwindcss/utilities.

D. Install Playwright.
- npm install --save-dev @playwright/test.
- npx playwright install chromium.
- Add frontend/playwright.config.ts with webServer pointed at
  ng serve on a non-conflicting port.

E. Build the smoke test dashboard with a real Playwright test.
- src/app/pages/dashboard/dashboard.component.ts is a tiny smoke
  test: an h1 with class page-title, a p with class page-subtitle,
  one btn-primary, one btn-secondary, one .card.p-5 with a .kpi-label
  and a .kpi-number. Just enough to prove the theme bridge works.
- src/app/app.routes.ts lazy-loads the dashboard component.
- frontend/e2e/dashboard.spec.ts has 7 tests verifying computed
  styles match theme.css tokens.

Out of scope (next sessions)

- The UI primitives library (button, card, badge, etc.). Built in
  the next feature pack, with Playwright tests added per primitive.
- The shell (sidebar, top bar, mobile bar). Same.
- The 19 remaining wireframe pages. Each becomes a per-domain
  feature pipeline pack with its own Playwright spec.
- Backend integration. Not in scope.

Verification

Run in order from frontend/:

```
npm install
npm audit --omit=dev
npm run build
npm run e2e
```

All four must succeed. If any fails, the work is not done.

Risks

- Tailwind v4 Sass deprecation warning. The @import rule Sass
  deprecation will become a hard error in Sass 3.0.0. Migrate
  styles.scss to @use / @forward in a future session.
- Chromium binary install for Playwright required system
  dependencies on the first run. The npx playwright install
  chromium command downloaded the binary but full --with-deps
  install needs sudo. If future machines need --with-deps, the
  failure mode is documented in the skill.
- Playwright tests currently capture only one screenshot. Future
  feature packs should add toHaveScreenshot with checked-in
  baseline PNGs for full visual diff.

No drift vs locked direction.

The locked direction is docs/00-system-overview.md line 63
(Frontend = Angular). This PRD does not change WHAT, only HOW (the
HOW is "use ng new with the official Angular CLI", the WHAT is
"Angular"). All 11 GRILL decisions trace to docs sources.

Open follow-ups (named not fixed)

- Sass @import deprecation migration to @use / @forward.
- Full @tailwindcss/postcss build with --with-deps on machines
  without sudo.
- Icon library integration. The wireframe uses Lucide icons via
  data-lucide attributes. lucide-angular adds runtime SVG
  rendering. The smoke test does not need icons so this is
  deferred to the first feature pack that consumes a data-lucide
  page (probably opportunity-detail).
- Theme variant generation. Tailwind v4 can read the CSS
  variables from theme.css as a theme: section but we have not
  set that up yet. Current setup uses theme.css for primitives
  + Tailwind utilities independently. Future enhancement: connect
  them so utilities like text-text-1 resolve to the theme tokens.

End of PRD-TRD.
