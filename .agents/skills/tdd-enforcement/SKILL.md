---
name: tdd-enforcement
description: Use when writing or modifying any code file in the meridian repo. Enforces test-driven development as the default workflow: write a failing test first, watch it fail, write minimum code to pass, watch it pass, refactor. The pre-commit hook blocks commits that introduce new exported functions/methods without matching tests. Triggers: any new component, service, function, method, or behavior change.
---

# TDD Enforcement — meridian

Code in this repo follows strict test-driven development. No
production code lands without a failing test that drove it.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Exceptions (require explicit user permission):
- Throwaway prototypes
- Generated code (e.g. `*.d.ts`, lockfiles)
- Configuration files
- Documentation files

## The Cycle: RED → GREEN → REFACTOR

### RED — Write a failing test

1. Write one minimal test showing the behavior the code should have.
2. Run the test. **Watch it fail** — confirm the failure message is
   "function not defined", "module not found", or similar (NOT a typo
   or import error).
3. If the test passes immediately, you're testing existing behavior
   (or the implementation already exists). Fix the test or skip it.

### GREEN — Write minimum code to pass

1. Write the smallest amount of code that makes the failing test pass.
2. Hardcode return values. Copy-paste. Duplicate. It is OK to cheat.
3. Run the test. **Watch it pass.**

### REFACTOR — Clean up

1. Remove duplication. Improve names. Extract helpers.
2. Keep tests green throughout.
3. If tests fail during refactor: undo and take smaller steps.

### Repeat

One RED→GREEN cycle per behavior. Don't batch.

## What "Tests" Means Here

Tests live in `frontend/src/**/*.spec.ts` (vitest) for the Angular
codebase, and `frontend/e2e/**/*.spec.ts` (playwright) for visual
integration. Backend code will follow the same pattern under
`backend/<package>/<package>_test.go` once it lands.

A "matching test" for a function is one that:
- Lives in the same directory as the function (or one level up for
  shared utilities)
- Calls the function or exercises the behavior it implements
- Will fail if the function is removed or broken
- Is NOT a placeholder (no `expect(true).toBe(true)`)

## Pre-Commit Enforcement

The pre-commit hook (`.github/workflows/ci.yml` `precommit` job +
the local `.git/hooks/pre-commit` script) enforces the rule:

1. Scans staged `.ts` / `.go` files for exported declarations
   (`export function`, `export class`, `export const` of functions,
   public methods on exported classes).
2. For each, looks for a matching test in the same directory or
   sibling `__tests__/` / `*_test.go` files.
3. If a function is exported but has no matching test, the commit is
   blocked with a clear error message pointing at the file:line and
   the expected test path.

Bypass options (use sparingly):
- `--no-verify` on the git commit (still caught by CI's `precommit`
  job, so the PR cannot merge until tests exist).
- Add a comment header `// TEST-COUPLED:` on the function with a
  pointer to its single matching test — exempts it from the scan.

DISCOVERY 2026-08-11: the current implementation in scripts/pre-commit.py
treats one `// TEST-COUPLED:` marker as a coarse "exempt all symbols in
this file" flag — multiple exports need markers >= count to be exempt.
Per-symbol exemption is not yet implemented. Workaround when a class
has one export plus one untested public helper: prefer writing the
unit test over adding the marker. Markers are useful for genuinely-
coupled helpers (Angular lifecycle hooks) but should NOT substitute
for test coverage of helper methods.

DISCOVERY 2026-08-11: page-level specs against existing primitives
must read the primitive's template first. UiButtonComponent (and
similar) project content via `<ng-content>` — the `<ui-button>` host
element and the inner native `<button>` are TWO different elements in
the DOM. The native `<button>` is where click handlers, aria-pressed,
and visible text live. When a page needs behavior the primitive
doesn't expose (e.g. aria-pressed on a filter toggle), prefer raw
`<button class="btn btn-primary">` markup in the page over extending
the primitive's API.

## Retrofit Mode (Existing Code)

Pre-TDD code that exists in the repo (e.g. the 19 primitives shipped
before this policy) gets retrofit tests written for it. These tests
go green immediately — that's the expected outcome for retrofit. The
discipline applies to NEW code only.

When retrofitting tests and discovering bugs (the implementation
doesn't match the test you expected to write), follow AGENTS.md §7
rule 7: do NOT fix the bug as part of the retrofit. Instead:

1. Write the test to pin the **actual** current behavior
2. Add a `// DISCOVERY YYYY-MM-DD:` inline comment explaining the gap
3. Add a TODO entry in `sessions/decisions.md` so the bug is tracked
4. The test acts as a regression guard for when the bug IS fixed

Example of a retrofit test for buggy code:

```ts
// DISCOVERY 2026-08-11: clicking a reject vote should toggle it back
// to null, but the onClick() implementation hardcodes "approve" as
// the next value. Pinning the actual behavior; will need updating
// when the fix lands.
it('clicking a reject vote currently flips to approve (known bug)', () => {
  // ...assertion against the buggy behavior...
});
```

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Already manually tested" | Ad-hoc ≠ systematic. |
| "Deleting X hours is wasteful" | Sunk cost. Keep unverified code = technical debt. |
| "TDD will slow me down" | TDD faster than debugging. |
| "Existing code has no tests" | Retrofit per the policy above. |

## Pitfall: the route-param triple — `input()` + `withComponentInputBinding()` + `name()` in template

When a page reads data from the URL (e.g. `/community/:id/members/:memberId`),
**all three of these must be in place** or the page silently renders the
default values regardless of the URL:

1. **`input()` signal** (not `@Input`) in the component, so the
   `computed()` re-runs when the param changes.
   ```ts
   readonly id = input<string>('alpha');
   readonly memberId = input<string>('dana-voss');
   ```

2. **`withComponentInputBinding()`** in `app.config.ts` so the router
   actually pushes route params into the inputs.
   ```ts
   provideRouter(routes, withComponentInputBinding())
   ```
   Without this, the inputs are declared but never receive values.
   The page will render the default. Tests pass (because `setInput`
   in the testbed does what the router would do), the build passes,
   but the live app silently shows the wrong data.

3. **Read the input via the signal getter** in the template.
   `id` is a function — you must call it.
   ```html
   <a [routerLink]="['/community-detail', id()]">...
   ```
   Forgetting the `()` makes Angular pass the function reference as
   the route param, which renders as the function's string form
   (e.g. `/community-detail/[Input%20Signal:...]`).

**Diagnostic checklist** when a route-param-driven page seems to
ignore the URL:
- `grep "withComponentInputBinding" frontend/src/app/app.config.ts`
- `grep "readonly id = input" frontend/src/app/pages/<page>/<page>.page.ts`
- `grep "id()" frontend/src/app/pages/<page>/<page>.template.html`
- visual probe with playwright-cli at `/<route>/<known-param>` and
  confirm the page renders the expected entity, not the default

This is the gotcha that bit member-detail on 2026-08-13: tests
passed (testbed `setInput` worked), build passed, but navigating
to `/community/alpha/members/mike-rivera` showed Dana Voss (the
default) because the live router had `provideRouter(routes)`
without `withComponentInputBinding()`. Fixed in PR #51.

## See also

- `.github/workflows/ci.yml` — `precommit` job re-runs the policy on
  every PR + master push
- `scripts/pre-commit.py` — local hook that enforces the rule
- `.agents/skills/comment-policy/SKILL.md` — file header + inline
  comment conventions that complement this policy
- `sessions/decisions.md` — log where retrofit-mode bugs are recorded
- The TDD skill itself at `~/.hermes/skills/software-development/test-driven-development/SKILL.md`
  for the full RED→GREEN→REFACTOR discipline