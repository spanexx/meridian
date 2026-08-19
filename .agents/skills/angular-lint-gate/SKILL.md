---
name: angular-lint-gate
description: Use whenever pre-commit guardrails are edited, a CI lint/type step is touched, or Angular code is written and must satisfy the repo's strict quality gates. Covers the two hard facts: (1) ESLint with angular-eslint is the strict gate (any error OR warning blocks commit), and (2) plain `tsc --noEmit` is TEMPLATE-BLIND — Angular template type checking only runs in `ng build`. Auto-invokes when the task mentions pre-commit, eslint, ng build, lint, or Angular template errors.
---

# angular-lint-gate — Strict Angular frontend quality gates

## When to use

- Editing `scripts/pre-commit.py` or `.github/workflows/ci.yml` quality steps.
- Running or fixing eslint / ng build failures in the frontend.
- Committing Angular code that touches templates (inline `template:` or `.html`).

## The two hard facts (DISCOVERY 2026-08-19)

1. **`tsc --noEmit` does not type-check Angular templates.** Template type
   checking (strictTemplates → TS2532 "Object is possibly 'undefined'")
   runs ONLY inside the Angular build pipeline (`ng build` / `ng test`).
   Plain tsc sees `template: \`...\`` as an opaque string. The pool page
   shipped with `status()?.health.deployment_ratio` template errors that
   tsc passed and `ng build --configuration production` caught — the
   branch had never built since. Pre-commit check [4/11] therefore runs
   the production build, not bare tsc.
2. **ESLint is strict and total.** eslint 9 + angular-eslint flat config
   (`frontend/eslint.config.js`); pre-commit check [11/11] and the CI
   lint step block on ANY problem — errors and warnings together, no
   `--max-warnings` leniency.

## How to fix template null-chain errors (TS2532 in ng build)

Safe-nav short-circuits at RUNTIME (`a?.b.c` renders nothing when `a` is
null) but the template checker still flags the chain. Fix pattern:

```html
{{ status()?.totals?.total_capital }}   <!-- add ?. after the object -->
{{ (status()?.health?.deployment_ratio ?? 0) }}%  <!-- with fallback for units -->
```

## Angular conventions enforced by the gate (cheat sheet)

- `@Output()` names must not shadow DOM events: `close` → `closed`,
  `select` → `selectChange` (`@angular-eslint/no-output-native`).
- Labels must associate with controls: `for` + `id` on every input/select/
  textarea; group labels point at the first control or restructure.
- Click-to-close scrims/backdrops use `role="presentation"` (the
  rule-sanctioned pattern — see `click-events-have-key-events` rule
  source); real custom buttons use `role="button"` + `tabindex="0"` +
  Enter/Space handlers.
- Prefer field `inject()` over constructor parameter injection
  (`@angular-eslint/prefer-inject`). The two transport classes keep
  constructor injection BY DESIGN for direct construction in specs/factory
  — they carry `eslint-disable-line` + DISCOVERY rationale comments; do
  not "fix" them.
- Spec files may use `as unknown as X` for test doubles — `as any` is an error.

## Checklist

1. After any Angular change, run `npm --prefix frontend run lint` → must
   print zero problems.
2. Run `npx ng build --configuration production` → exit 0 (templates!).
3. Run `npx vitest run` → green; Playwright e2e → green.
4. If a fix targets only one flagged site of a repeated pattern
   (`status()?.a.b`), grep the whole template for siblings and fix them
   all in one pass — the compiler reports in batches but the pattern is
   usually spread.