---
title: New page — implementation checklist
slug: new-page
step: checklist
status: locked
---

# New page checklist

Run through this list before opening a PR. Every box must be
ticked, or the pre-commit gate will block the commit anyway.

- [ ] Wireframe HTML exists at `wireframe/meridian/<page>/index.html`
      and was read end-to-end before any code was written
- [ ] Route registered in `frontend/src/app/app.routes.ts` with
      `loadComponent`
- [ ] Spec file `frontend/src/app/pages/<page>/<page>.page.spec.ts`
      starts with a failing RED test, then every behavior is added
      test-first
- [ ] Component file `frontend/src/app/pages/<page>/<page>.page.ts`
      uses the existing primitives (`.kpi-number`, `.tabs`,
      `.table-scroll`, `.modal`, `.badge-*`, `.progress-fill`) rather
      than hand-rolled equivalents
- [ ] Public barrel `frontend/src/app/pages/<page>/index.ts`
      re-exports the component
- [ ] Every public method on the component class has a unit test
      (TDD guard will check this at commit time)
- [ ] Every `<ui-icon name="X">` in the page template has a
      matching entry in `ICON_PATHS` (icon guard will check this)
- [ ] Responsive probe clean at 320 / 375 / 480 / 640 / 768 / 1024 /
      1280 / 1440 (no page-level horizontal scroll; tables do not
      overflow their card; KPI numbers fit their boxes)
- [ ] E2E spec at `frontend/e2e/<page>.spec.ts` covers header,
      KPI row, chart, gauge, tables, modals, and any mobile-only
      behavior
- [ ] Visual screenshot saved under `frontend/e2e/screenshots/`
      and reviewed by the user against the wireframe
- [ ] `python3 scripts/pre-commit.py` reports `0` (all 7 checks
      pass)
- [ ] CI is green; PR merged with `--squash --delete-branch`

## Anti-patterns — do not

- Don't copy the wireframe verbatim. The user wants *more minimal*.
  Reduce typography weight, remove ornamental gradients, prefer
  currentColor over hard-coded hex, drop empty-state illustrations.
- Don't create a new icon without adding the path to
  `icon.component.ts` *and* the name to `SUPPORTED_NAMES` in the
  spec. The icon guard will fail the commit.
- Don't re-stage partial changes (the lesson that produced
  `.agents/lessons/partial-staging-and-reset-hard-lose-work.md`):
  if a file is touched, stage it.
- Don't merge with the PR branch still in working state. Reset
  local master to `origin/master` after the squash merge so the
  next dev server reload doesn't flash the old version.
