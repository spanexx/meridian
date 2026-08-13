---
name: visual-fidelity-check
description: Use when claiming a wireframe-to-implementation port is complete, when reviewing a UI scaffold or feature pack with a visual goal, or when a previous claim of "verbatim match" was rejected by the user. Runs a rendered-DOM comparison against the source wireframe and rejects the claim if layout, typography, color, or component structure diverges. Catches the recurring mistake of treating "CSS classes in the bundle" or "build exits 0" as proof of visual fidelity.
---

# Visual Fidelity Check

## When to Use

- Before declaring a UI scaffold, page port, or feature pack complete.
- After any change to a wireframe-derived component.
- When a user has rejected a prior "verbatim match" claim.
- Before merging a PR that touches UI files.
- Any time the task description includes "match X", "like X", "look like X", or "verbatim".

## When NOT to Use

- Pure backend or data work with no rendered output.
- API contract changes.
- Documentation-only changes.
- Internal refactors that don't change rendered output (use `grep` or AST diff instead).

## The Mistake This Skill Prevents

The recurring mistake: claim "the implementation matches the wireframe" based on **green automated checks that don't actually compare rendered output**. Specifically:

- "Build exits 0" only confirms the bundler ran. It does not prove the rendered HTML matches the source.
- "All CSS classes are in the bundle" only confirms the styles were included. It does not prove they were applied to the right elements in the right structure.
- "The TypeScript compiles" only confirms the types resolve. It does not confirm the template renders correctly.
- "The drift check passed" when the drift check was a `grep` for class names — that is a structural check, not a fidelity check.

In MERIDIAN on 2026-08-11 the scaffold claimed "verbatim wireframe match" with these checks passing. The user took a screenshot and the dashboard was visibly broken: KPI cards had no card chrome, values rendered as raw stacked text, the icon column was missing from the sidebar, the sparkline was invisible, the progress bar animation ignored its value input. All green checks, all wrong.

## Process

The fidelity check has three stages. **All three must pass** for the claim to hold.

### Stage 1 — Structural Comparison (DOM vs Source HTML)

Render the implementation in a real browser (or a headless one) and compare the rendered DOM tree to the source wireframe's HTML structure.

What to verify:

- For every section in the source HTML (e.g. KPI Row, Active Executions, Latest Opportunities), the rendered DOM has a matching section with the same children in the same order.
- For every `<div class="card p-5">` in the source, the rendered DOM has an element with the equivalent class set.
- For every data-binding placeholder (`{{ label }}`, `[data]=...`), the rendered DOM has the actual rendered text or attribute.
- For every event-binding attribute (`(click)=...`, `(input)=...`), the rendered DOM has the equivalent event listener attached (verify with `getEventListeners` in DevTools, or by triggering the event in a test).

How to do it:

- **Best**: use Playwright or Puppeteer to load the dev server, navigate, and dump the rendered HTML to a file. Compare side-by-side with `diff -u` against the source wireframe HTML.
- **Acceptable**: open the page in a real browser, use DevTools "Copy outerHTML" on each section, paste into a comparison file, diff against the source.
- **Acceptable but weaker**: install a screenshot library (Playwright, Puppeteer) in the project devDependencies and capture a PNG of the rendered page, eyeball it against the wireframe.

The output of this stage is a **list of structural divergences** with file:line references for both sides.

### Stage 2 — Stylistic Comparison (Computed Styles vs Theme Tokens)

For each rendered element with theme tokens in its class set, capture the computed style and compare to the expected value from `theme.css`.

What to verify:

- Background colors match `var(--bg-base)`, `var(--bg-elevated)`, `var(--bg-overlay)`, etc. for the active theme (light or dark).
- Foreground colors match `var(--text-1)`, `var(--text-2)`, `var(--text-3)`, etc.
- Border colors match `var(--border-subtle)`, `var(--border-default)`, `var(--border-strong)`.
- Typography uses the Inter font family (the wireframe imports Inter from Google Fonts).
- Spacing matches the wireframe (Tailwind utility classes resolve to the same rem values the wireframe's hand-rolled CSS uses).
- Border-radius on cards is 0.875rem (the wireframe's `.card` definition).
- Box-shadow on cards matches `--shadow-card` and on popups `--shadow-pop`.

How to do it:

- In DevTools, inspect an element and compare its computed styles to theme.css.
- Or write a Playwright/Puppeteer test that asserts `getComputedStyle(el).backgroundColor` matches the expected token value.

The output is a **list of style divergences**.

### Stage 3 — Visual Comparison (Screenshot vs Source Screenshot)

This is what the user does by default — they look at it. If the user has to ask "is this right?", the answer is **no**, until proven yes with a side-by-side screenshot comparison.

The fidelity check is only complete when a human (you, the agent, or the user) has actually looked at the rendered output and compared it visually against the source wireframe's expected rendering.

## Checklist

```
[ ] Stage 1: DOM structure compared
[ ] Stage 1: every section in wireframe has a matching rendered section
[ ] Stage 1: every data binding renders the right value or attribute
[ ] Stage 1: every event binding is wired
[ ] Stage 2: computed styles match theme tokens for the active theme
[ ] Stage 2: Inter font is applied (not a system fallback)
[ ] Stage 2: spacing, borders, shadows match
[ ] Stage 3: visual screenshot reviewed by a human
[ ] Stage 3: divergences noted and either fixed or explicitly accepted
[ ] All three stages green before claiming "verbatim match"
```

## Output Format

Append to handoff or PR description:

```
## Visual fidelity check (date)

Stage 1 (DOM structure): PASS / FAIL
- Section X: matched / diverged (see file:line for both)
- Event binding Y: wired correctly / not wired
Stage 2 (computed styles): PASS / FAIL
- Card .card.p-5 background: matches var(--bg-elevated) / diverged
- Inter font: applied / not applied
Stage 3 (visual): PASS / FAIL
- Side-by-side screenshot review: matches / diverges
Divergences accepted (with reason): N
Divergences fixed (with commit): N
```

If any stage is FAIL, the work is not done. Fix the divergences and re-run.

## Why This Skill Exists

"Build passes" feels like proof. "All classes in bundle" feels like proof. Neither is proof of visual fidelity. The only proof of visual fidelity is **a human (or automated browser) looking at the rendered output and comparing it to the source**.

The MERIDIAN scaffold on 2026-08-11 had all the green checks: build 0, classes in bundle, TS clean. The user took a screenshot in under a minute and the layout was visibly broken. This skill exists to make the screenshot comparison part of the standard workflow before any "match the wireframe" claim goes to the user.

## Automation Options

If installing Playwright is acceptable in the project's devDependencies:

```ts
// e2e/visual-fidelity.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard matches wireframe layout', async ({ page }) => {
  await page.goto('http://127.0.0.1:4200/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png', {
    maxDiffPixels: 100,
  });
});
```

This auto-fails the build on any visual divergence. Recommended for projects with a single-page-per-component cadence.

## Pitfalls observed in real use

### 1. CSS variables named `*-gradient` may not be gradients

theme.css at `wireframe/meridian/kit/theme.css:32-35` defines `--gradient-emerald`, `--gradient-violet`, `--gradient-primary`, `--gradient-amber` as **solid hex colors** (#10b981, #a86a2d, #14b8a6, #f59e0b), not linear-gradient() expressions. The `text-gradient-*` utility class then uses `background-clip: text` to make them appear gradient-like for gradient text effects. Tests that assert `background-image contains "gradient"` will fail — read `backgroundColor` and compare exact rgb() values instead.

### 2. Angular standalone component host attributes belong in `host` metadata

Putting `[attr.data-foo]="value"` in the template attaches the attribute to the **inner content element**, not the component selector element. For tests that query `<my-component data-foo="bar">`, declare it in `@Component({ host: { '[attr.data-foo]': 'value' } })`.

## 3. A fixed-position fix at one breakpoint is broken at another

When you change a dropdown / popover / modal's CSS positioning to
fix it at one viewport, **also verify the other breakpoints**. A
positioning fix that works at 1280px can put the element off-screen
at 375px, and vice versa. The community-members tier dropdown in
this repo was "fixed" twice on 2026-08-13 — once with `right-0`
(broke mobile), once with `left-0` (broke desktop) — before
landing on the responsive `left-0 sm:right-0 sm:left-auto`.

Rule of thumb: every positioning fix MUST be visually verified at
**both the breakpoint you fixed AND the breakpoint you broke**.
For dropdowns this is usually 375 (mobile) + 1280 (desktop).
For navigation it is usually 375 + 768 + 1280.

## 4. Grid breakpoints must respect the sidebar — `sm` is too early when a sidebar is at md+

The shell sidebar is hidden on mobile and slides in at `md` (≥768px), eating ~256px of horizontal space. So at `sm` (640px) the content has ~640px, but at `md` (768px) it shrinks to ~512px. A grid that uses `sm:grid-cols-3` will fit fine at 640px and break at 768-1024px (the "death zone") because the cells are too narrow for the KPI labels.

For multi-column content inside the shell, snap horizontal layouts to `lg:grid-cols-*` (≥1024px), not `sm:grid-cols-*`. Below `lg`, fall back to single-column (stacked). The Meridian hero KPI grid in `pages/member-detail/member-detail.template.html` was fixed by changing `grid-cols-1 sm:grid-cols-3` to `grid-cols-1 lg:grid-cols-3` on 2026-08-13.

Verify at all three breakpoints: 375 (mobile, stacked), 768 (tablet, stacked — death zone), 1280 (desktop, horizontal).
