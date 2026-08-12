# New page pack

The standing contract for adding a routed page to the Meridian
frontend. Locked 2026-08-12.

## When to use

Anytime a new `/<page>` route is added. Covers /governance, /members,
/payouts, /notifications, /settings, /profile, and any future page.

## Steps

1. `00-goal-analysis.md` — confirm the pack fits this page.
2. `01-pre-impl-grill.md` — answer the 5 guardrails before any code.
3. `02-impl-phases.md` — run phases 0–8 in order. Each phase ends
   with a green vitest run.
4. `03-checklist.md` — tick every box before opening the PR.

## Locks

- spec-first, TDD red→green→refactor
- wireframe read end-to-end before code
- route registered in the first green commit
- every public method has a unit test (TDD guard enforces)
- every `<ui-icon name>` has a path in ICON_PATHS (icon guard
  enforces)
- responsive probe at 320–1440px before e2e
- pre-commit gate clean (7/7) before commit

## Anti-patterns

- copy-paste from the wireframe verbatim (we are improving on it)
- introduce an icon without registering it
- partial staging (see
  `.agents/lessons/partial-staging-and-reset-hard-lose-work.md`)
- merge with the working tree dirty
