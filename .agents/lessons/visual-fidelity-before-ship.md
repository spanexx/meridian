---
topic: workflow
severity: high
related-to: visual-fidelity-check/SKILL.md
---

# Visual fidelity check is mandatory BEFORE claiming a page done

**One-line**: a passing test suite proves the structure matches the wireframe, NOT that the rendered output looks like the wireframe — always run a rendered-DOM compare vs the wireframe before PR.

## The trap

Wireframe says: "KPI row with 4 tiles spanning full width, sidebar on the left."
You write the page based on the wireframe section. Tests pass. PR is opened.

But the rendered output:
- KPI values like `$1,423,580` clip to `$1,423,5...` because the tile is narrower than expected
- the page is right-aligned in a 1100px center because `.main` has a 260px left margin for a sidebar you never built
- the wireframe's lucide icons in headers/rows are not present (you omitted them)
- the screenshot looks nothing like the wireframe at full page

Tests still pass. Their job was to assert **structure and content presence**. They don't catch the visual layout mismatch.

## Why this matters

You're shipping 8/8 vitest green + 82/82 e2e green. Reviewer opens the page. Spends 30 seconds looking at the wireframe vs your rendered output. Marks the PR "doesn't match the wireframe, please re-do." Hours of work accepted-then-rejected.

## The fix: a 5-step ritual before claiming any page shippable

After the page compiles + tests pass + e2e runs:

1. **Open the wireframe** in one browser tab.
2. **Open your rendered page** in another tab (or `ng serve` running locally).
3. **Side-by-side compare** — both visible at the same time. Sections. Layout. Spacing. Colors.
4. **Diff the missing pieces**: layout shell? Sidebar? Lucide icons? Color palette? Typography weight?
5. **Fix the diffs** before opening the PR.

## Concrete checks to do per page

| aspect | check |
|---|---|
| **Layout shell** | does the wireframe have a sidebar / top-nav / modal that I omitted? |
| **Container constraints** | `max-width`, `margin-left`, `padding` — match the wireframe's outer container |
| **Section ordering** | does my section order match? |
| **Typography size** | same font-family + size for `.page-title`, `.kpi-number`, `.page-subtitle`? |
| **Color tokens** | `.text-gradient-emerald`, `.kpi-label`, etc. — same class names? |
| **Icons** | lucide references in the wireframe — did I include the same icons or omit them? |
| **Empty / loading states** | does the wireframe have skeletons while data loads? |
| **Spacing** | `gap-4`, `mb-8` between sections — same as wireframe? |

## How to compare in this codebase

```bash
# Render the wireframe (it's a static HTML file with no JS, so just serve it)
cd /home/spanexx/Shared/Projects/meridian
python3 -m http.server --directory wireframe 8001 &
# Open http://127.0.0.1:8001/meridian/dashboard/index.html

# Render your app
cd frontend
npx ng serve
# Open http://127.0.0.1:4200/dashboard

# Now split-screen both and compare section by section
```

For automation, use playwright's `toHaveScreenshot()` API with a checked-in baseline. That's the visual-fidelity-check skill's approach.

## Sub-symptom: tests pass but content clips

The first sign that the wireframe-vs-render mismatch is hiding:

- A `.kpi-number` rule says `font-size: 2.25rem` (36px).
- The wireframe expects the value `$1,423,580` to fit in a ~250px wide tile.
- At 36px, `$1,423,580` is roughly 324px wide.
- **The text overflows or clips.**

If the tile is narrower than the wireframe, your content silently clips. Tests won't catch it — they assert presence, not overflow.

## Sub-symptom: missing layout shell (sidebar/top-nav)

The wireframe often assumes a layout shell that wraps every page (sidebar nav, top nav bar, container with `.main .main { margin-left: 260px; }`).

Your test renders your page with `<app-dashboard-page>` directly inside `<app-root>`. The 260px sidebar isn't there. Your `.main .main` CSS — if rendered as-is — would still apply margin-left: 260px because the cascade is the same, **but** your Angular component's `:host` styles may override the global `.main .main` rule.

The fix is to **build the layout shell as part of the page work**, not as a separate "later we'll get to it" item.

## Real example from this session

PR #11 shipped /dashboard with 8/8 tests passing + 82/82 e2e + screenshot rendered. Reviewed against the wireframe:

- No sidebar shell (wireframe has 260px left for one).
- Container width constrains the 4-col KPI grid → values clip on both sides.
- Lucide icons missing in header + KPI rows + opportunity rows.
- Active Executions progress bars render but the icons + per-row layout differ from the wireframe.

Tests pass. Visual doesn't match. PR was open and had to be re-thought before merging.

The fix would have been to open the wireframe in one tab and the running app in another tab, and **look** at the two side-by-side for at least 60 seconds before claiming shippable. Skipped that step → ship-cleanly-rolled-back problem.
