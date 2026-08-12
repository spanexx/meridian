---
topic: ui-pages
severity: high
related-to: tdd-enforcement, responsive-design, wireframe-fidelity
---

# New page standards (2026-08-12)

One-line summary: every new routed page follows the new-page pack
recipe — spec-first, wireframe-faithful but more minimal, every
public method tested, every icon registered, responsive from 320
to 1440, pre-commit green.

## The recipe (memorize)

1. **Read the wireframe first.** `wireframe/meridian/<page>/index.html`.
   Note section counts, data shape, and visual density.
2. **Write a spec with a failing RED test.** File:
   `frontend/src/app/pages/<page>/<page>.page.spec.ts`. The first
   test must fail because the component does not exist yet.
3. **Write the minimum component to turn that test green.** File:
   `frontend/src/app/pages/<page>/<page>.page.ts` + `index.ts`
   barrel.
4. **Wireframe section by section.** For every visible behavior,
   add a failing test, then implement. Do not batch.
5. **Test every public method.** The TDD guard at
   `scripts/pre-commit.py` checks for this at commit time and
   will block the commit. Don't rely on a render test alone.
6. **Register the route in `app.routes.ts`** as the *first* green
   commit. Don't ship a page that's unreachable.
7. **Responsive probe at 320, 375, 480, 640, 768, 1024, 1280, 1440.**
   A throwaway `node probe.mjs` script: check
   `document.documentElement.scrollWidth > viewport`, tables
   `scrollWidth > card width`, and `.kpi-number` text overflow.
   Delete the probe after.
8. **E2E spec at `frontend/e2e/<page>.spec.ts`.** One test per
   wireframe section. Mobile-only behaviors get their own test
   with `setViewportSize({ width: 375 })`.
9. **Pre-commit gate clean (7/7)**, then PR, CI green, merge with
   `--squash --delete-branch`. Reset local master to
   `origin/master` after the merge so the dev server reload
   doesn't flash the old version.

## What the user means by "more minimal"

- reduce typography weight (text-sm over text-base, font-light over
  font-medium)
- prefer `currentColor` over hard-coded hex in icons
- drop ornamental gradients — use `--gradient-violet` only for the
  primary CTA, not as a section accent
- compress copy ("Pool health, reserve ratio" not "Pool health,
  reserve ratio, and how much we have stashed away")
- keep the layout one-to-one, but make every element earn its space

## What `clamp()` solved

`.kpi-number` was a fixed `2.25rem`. On 320px the $1,423,580 number
overflowed the card by 100px. Fix in `theme.css`:
`font-size: clamp(1.05rem, 3vw, 2rem)`. This one rule fixes dashboard,
opportunities, pool, and every future page that uses the `.kpi-number`
class.

## What the icon guard saved

PR #22 (the official logo) and PR #24 (the pool page) both shipped
invisible icons because templates referenced `<ui-icon name="X">`
without the path data in ICON_PATHS. The guard now blocks the
commit and prints the exact name to add. Cost of running the guard:
~50ms. Cost of an invisible icon making it to master: another
hotfix PR. The guard wins.

## Anti-patterns to avoid

- Copy the wireframe verbatim. The user wants improvement, not a
  pixel-for-pixel port.
- Re-render an icon by hand from memory. Use a real lucide path
  string; the icon guard will catch you if you invent one.
- "I'll add the test later." The pre-commit guard won't let you
  forget, but you still pay the cost of a wrong commit and a fix.
- Leave a `git reset --hard` for after the PR merge — it loses
  working-tree state for the next reviewer.
