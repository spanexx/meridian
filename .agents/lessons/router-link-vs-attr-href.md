---
topic: angular
severity: critical
related-to: routerLink, full-page-reload, opportunities-page
---

# Raw `[attr.href]` causes full page reloads (routerLink required)

One-line summary: a template `<a [attr.href]="...">` bypasses
Angular's router — the browser does a full document reload, which
looks like "the whole app refreshed" to the user.

## The trap

```ts
// BAD: full page reload every click
<a [attr.href]="'/opportunity-detail/' + opp.ref">
  {{ opp.title }}
</a>
```

```ts
// GOOD: in-app navigation, no reload
<a [routerLink]="['/opportunities', opp.ref]">
  {{ opp.title }}
</a>
```

The browser sees `[attr.href]` as a plain HTML attribute and
performs a full document navigation when clicked. Angular's
`RouterLink` directive intercepts the click event, calls
`event.preventDefault()`, and routes via the Angular router
(no document reload).

## Why this matters

The Meridian user reported (2026-08-12) that "the whole application
refreshes when I click on one opportunity to go to the detail
page." The cause was the opportunities list page using
`[attr.href]` for every row link. The opportunities page was
shipped in PR #15 with the bug; it survived until the user noticed
when the new opportunity-detail route was added.

## The fix in three parts

1. Add `RouterLink` to the `@Component({ imports: [RouterLink, ...] })`
   array. Without this, the template's `[routerLink]` directive
   raises an NG0950 / template-parse error.
2. Change every `[attr.href]` for navigation to `[routerLink]`. Use
   `[routerLink]="['/path', param]"` for parameterised routes.
3. Add a regression test that asserts the rendered `href` matches
   the route path (e.g. `/opportunities/O-####`). A bare
   `[attr.href]` renders the path, but `routerLink` also patches
   the click handler. The href alone is not enough — the test
   should also click and assert no full page reload.

## Detecting the bug programmatically

```ts
import { chromium } from '@playwright/test';
const page = await ctx.newPage();
let fullReloads = 0;
page.on('load', () => fullReloads++);
await page.goto('/opportunities');
const before = fullReloads;
await page.locator('tbody a').first().click();
expect(fullReloads).toBe(before);  // no reload
```

## Real example from this codebase

`frontend/src/app/pages/opportunities/opportunities.page.ts` had
3 instances of `[attr.href]` (one for the Ref column, one for
the Title column, one for the Submitter column). All 3 were
replaced with `[routerLink]`. The component was missing the
`imports: []` array entirely — the bare-bones `@Component({...})`
without imports worked because there were no directives being
used. The new page pack's route check would have caught the
missing route, but the missing `RouterLink` import was only
visible when the new opportunity-detail route was added.

## Related

- `wireframe/meridian/opportunities/index.html` uses
  `<a href="../opportunity-detail/index.html">` because the
  wireframe is a static HTML demo. In the SPA, this pattern
  translates to `routerLink`, never `[attr.href]`.
- The icon guard (`scripts/pre-commit.py [6/8]`) catches a
  different class of regression: missing icon paths. A similar
  guard for raw `[attr.href]` patterns is worth adding — see
  the "follow-up" in PR #25.
