---
title: New page — IMPL phases
slug: new-page
step: impl
status: locked
---

# IMPL — implementation phases

Run these in order. Each phase ends with a green vitest run + a
pre-commit gate. Don't move to the next phase until the previous
one passes.

## Phase 0 — spec file (RED)

Create `frontend/src/app/pages/<page>/<page>.page.spec.ts` with the
TestBed harness, the import list (TestBed, provideRouter, the
component), and a single sentinel test:

```ts
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { <Page>PageComponent } from './<page>.page';

async function renderPage(): Promise<ComponentFixture<<Page>PageComponent>> {
  await TestBed.configureTestingModule({ providers: [provideRouter([])] }).compileComponents();
  return TestBed.createComponent(<Page>PageComponent);
}

describe('<Page>PageComponent', () => {
  it('mounts', async () => {
    const fixture = await renderPage();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

Confirm the test FAILS (no component yet). That is the RED.

## Phase 1 — component skeleton (GREEN mount)

Create `frontend/src/app/pages/<page>/<page>.page.ts` with the
@Component decorator, the empty template, the empty class. Create
`frontend/src/app/pages/<page>/index.ts` re-exporting the component.
Confirm the spec passes.

## Phase 2 — wireframe layout, test-by-test (RED → GREEN)

For each section in the wireframe, write the spec for the next
behavior *before* writing the template code. Examples of behaviors:

- header: title, subtitle, the 3 action buttons (Snapshot /
  Withdraw / Deposit)
- KPI row: every label + value
- chart card: 7d/90d/1y tabs (90d active by default), legend
- reserve ratio gauge: number + status text
- health metrics: 4 progress bars with values
- contributors table: every row
- modals: open/close + balance/rail options

Each test goes RED first, then becomes GREEN. Do not batch.

## Phase 3 — public methods (test them explicitly)

For every public method declared on the component (e.g.
`chartLabel()`, `onStatusChange(event)`, `formatRoi(value)`), add
a unit test that calls the method and pins the result. The TDD
guard at `scripts/pre-commit.py` will block the commit otherwise.

## Phase 4 — route registration

Add the loadComponent entry to `frontend/src/app/app.routes.ts`.
Place it next to peer routes (governance/members/payouts/...). Run
`npx vitest run` to confirm no app-level regressions.

## Phase 5 — responsive probe

Probe the page at 320, 375, 480, 640, 768, 1024, 1280, 1440px using
a one-off `node probe.mjs` (delete after). For each width capture:

- `document.documentElement.scrollWidth > viewport` → page-level
  horizontal scroll, fix
- any `<table>` whose `scrollWidth > parent card width` → fix by
  hiding non-essential columns
- any `.kpi-number` whose `scrollWidth > clientWidth` → fix by
  tuning the `clamp()` in `theme.css` (one fix benefits every page)

Fix the regressions before adding the e2e spec.

## Phase 6 — e2e spec

Create `frontend/e2e/<page>.spec.ts` with one test per wireframe
section. For mobile-only behavior (the filter dropdown), use
`page.setViewportSize({ width: 375, height: 800 })` in that one
test. All assertions should be scoped (`getByRole('heading', ...)`,
`locator('option', { hasText: ... })`) so strict-mode doesn't trip
on repeated substrings.

## Phase 7 — pre-commit + CI

Stage every changed file in the same commit (this is the
lesson: the icon guard exists because partial-staging + reset-hard
silently destroyed committed-elsewhere path data — see
`.agents/lessons/partial-staging-and-reset-hard-lose-work.md`).
Run `python3 scripts/pre-commit.py`. Open the PR, watch CI green,
merge with `--squash --delete-branch`. Per `.agents/workflows/
branch-cleanup.yaml`.

## Phase 8 — screenshot for visual review

Add a `test('screenshot saved', ...)` to the e2e spec. The user
checks the visual against the wireframe, then signs off.
