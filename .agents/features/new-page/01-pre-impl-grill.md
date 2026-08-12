---
title: New page — pre-implementation GRILL
slug: new-page
step: pre-impl-sim
status: locked
---

# GRILL — guardrails before code

Answer each of these before opening an IMPL phase for a new page. The
goal is to make the implicit contract explicit so a future agent
following the feature pack can't accidentally drop a standard.

1. **G — wireframe first.** Paste the wireframe HTML in full under
   `wireframe/meridian/<page>/index.html`. Read it before anything
   else. Note the section counts, the data, and the wireframe's
   visual density.
2. **R — route already exists?** If the new page needs a route, add
   the `loadComponent` entry to `frontend/src/app/app.routes.ts` as
   the very first step in the IMPL phase. Don't ship a page that's
   unreachable.
3. **I — improved, not copied.** Per the user (2026-08-12): the
   implementation must follow the wireframe's *layout* but be a
   *more minimal* design. State explicitly what is more minimal
   (typography, color usage, action density, copy).
4. **L — lock the responsive plan.** Tabs collapse to dropdowns at
   <640px (status filters), KPI numbers use `clamp()` for size, and
   the table drops non-essential columns at sm/md/lg/xl. List any
   *other* responsive behavior the page needs in IMPL.
5. **L — list every public method.** The TDD guard requires every
   exported method to have a matching test. Enumerate them now so
   none are forgotten.

If any of these cannot be answered, the IMPL phase does not start.
