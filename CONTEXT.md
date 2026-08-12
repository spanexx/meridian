# CONTEXT.md — MERIDIAN Canonical Terms

This file is the canonical glossary for MERIDIAN. GRILL sessions and docs reference these terms by name — never re-ask about terms already defined here. When new canonical terms emerge, record them here first (AGENTS.md §4).

## Architecture Terms

### Kernel
The tiny, domain-blind core: receives events, dispatches work, coordinates execution, records execution. Contains no business logic and knows no domain.

### Engine
A capability owner (Identity & Access, Member, Money, Opportunity, Execution, Payout, Reputation, Notification, Admin). Engines own their data; they never call each other — they publish facts and react to facts.

### Provider
External technology behind a contract (PaymentProvider, MarketplaceProvider, NotificationProvider, StorageProvider, RecommenderProvider). Swapping a provider = adding an adapter, never editing an engine.

### Contract
The stable interface an engine or provider exposes: what can be requested, what can be returned, what errors exist, what guarantees are provided. Everything else is private.

### Event
A recorded fact (`opportunity.approved`, `execution.funded`); the kernel's only data. Engines publish facts; they do not command other components.

## Principles

The engineering philosophy this architecture is built on (details in `docs/01-architecture.md`):

- Replaceability first — every component is temporary behind its interface
- Tiny kernel — the center stays boring and domain-blind
- Capabilities, not features — providers behind contracts, never privileged technology
- Dependencies point inward — inner layers never know outer layers exist
- Complexity lives at the edge — engines and provider adapters carry it
- Observability is mandatory — every event recorded, every action traceable
- AI recommends; humans decide — automated checks never make final calls

## Governance Terms

### Community
The members of a MERIDIAN pool. v1 runs one Community (one pool); the governance model is generic so more can be added later without redesign.

### Community-Governed Parameter
An economic target or threshold decided by the Community through a Governance Vote — never set centrally: ROI floor, win-rate target, distribution shares, reserve ratio target, vetting rules, single-execution cap. Safety rails (integrity, reconciliation, no-ponzi, human control) are never Community-Governed.

### Governance Vote
The reputation-weighted vote by which the Community sets a Community-Governed Parameter. Any member may propose; members with vetting privileges (VETTER+) vote; weight comes from reputation (`vetting_weight`). Proposals may be suggested by the RecommenderProvider, but it never decides. Results apply to future executions only — never retroactively.

## Implementation Vocabulary

These are the **domain objects** that appear in the UI (component fields, page tables, route params). Treat them as reserved words — use them in code, UI copy, and docs exactly as defined. Replace these names with new ones only via a GRILL + docs update.

### Member
A participant in a Community. A Member belongs to a Community — **there is no global Members list**. Members contribute **capital**, **signal**, or **access** (see Member Composition below). Members carry a reputation tier that gates voting weight.

### Pool (Capital Pool)
The aggregate of capital contributed by Members in a Community. v1 runs one pool per Community. The Pool has a target size, a reserve ratio, a liquidity state, and a deployment rate. The Pool is governed by the Community's Community-Governed Parameters.

### Opportunity
A signal submitted by a Member for the Community to vet. An Opportunity has a category, an estimated ROI, a requested capital amount, a submitter, votes, and a status (`pending` / `in_vetting` / `approved` / `executing` / `rejected`). Owned by the OpportunityEngine.

### Execution
A live operation that has consumed capital from the Pool. An Execution has a ref (`E-####`), a target, a deployed capital amount, a current ROI, a stage, and a status (`active` / `completed` / `failed`). An Execution may yield `payouts`. Owned by the ExecutionEngine.

### Submission (Signal Submission)
The act of proposing an Opportunity. Requires VETTER+ reputation tier to submit. Submissions are the entry point to the signal pipeline.

### Payout
A distribution of earnings from an Execution to the Members who contributed. Tied to the ExecutionEngine's payout flows. Members earn in proportion to their contribution type (capital / signal / access).

### Reputation
A numeric score per Member that determines voting weight (`vetting_weight`) in Community-Governed Parameter decisions. Reputation increases with successful contributions and decreases with losses. Reputation tiers: `OBSERVER` < `VETTER` < `OPERATOR` < `GOVERNOR`.

### Vetter Tier
A Member's reputation tier (see Reputation). Only VETTER and above can vote on Governance proposals.

### Operator
A Member with OPERATOR tier or above. Can submit, approve, and execute operational decisions within Community-Governed Parameters.

### Submitter
The Member who submitted an Opportunity. The Submitter's reputation tier is shown on the Opportunity detail page.

### Member Composition
The three ways a Member can contribute to a Community: **Capital** (money into the Pool), **Signal** (submitting Opportunities), **Access** (channels / connections / deals). Each Member contributes in some mix; the Community's Composition visualization shows the ratio.

### Community-Governed Parameters
A named set of economic targets / thresholds within a Community. Set by Governance Vote. Examples: ROI floor, win-rate target, distribution shares, reserve ratio target, vetting rules, single-execution cap. **Safety rails** (integrity, reconciliation, no-ponzi, human control) are *never* Community-Governed.

### Safety Rails
Hard constraints that are NEVER Community-Governed. Example: a Community cannot vote to disable reconciliation or to allow a single Member to bypass the kill-switch. Safety rails ensure the system stays honest even when the Community is wrong.

### Wireframe
The static HTML design at `wireframe/meridian/<page>/index.html`. Pages are built **wireframe-faithful** — same layout, same text, same visual hierarchy. The wireframe is the source of truth for layout. Deviations need a docs update.

### Pack
A self-contained unit of work that ships a complete feature: docs (`docs/features/<slug>/`) + tests + implementation + drift-check. Pack convention: `.agents/features/<slug>/`. Packs may be **new** (a feature with no prior code) or **surgical** (a small change to existing code).

### Stub (Placeholder)
A page that renders a "Coming soon" message in place of a real implementation. Stubs exist so every link on every page resolves to a real route (no 404s). They are tracked by the route registry and the link-audit regression test. When a real pack replaces a stub, remove the stub route and add the real component.

## URL Routes (Canonical)

All routes are registered in `frontend/src/app/app.routes.ts`. The link-audit test on community-detail walks every routerLink and asserts it resolves to a registered route — if you add a new link, add its route too.

### Real routes (have full page implementations)

| Path | Slug | Notes |
|---|---|---|
| `/` | home | shell redirect |
| `/dashboard` | dashboard | KPIs + Active Executions + Latest Opportunities |
| `/showcase` | showcase | primitives-pack showcase (was /dashboard in PR #14) |
| `/opportunities` | opportunities | list, 9-column table, status tabs |
| `/opportunities/:id` | opportunity-detail | detail page, dual-route (see below) |
| `/opportunity-detail/:id` | opportunity-detail | alias for backward compatibility |
| `/executions` | executions | list, 7-column table |
| `/executions/:id` | execution-detail | detail page, dual-route |
| `/execution-detail/:id` | execution-detail | alias for backward compatibility |
| `/pool` | pool | Capital Pool page |
| `/communities` | communities | list of Communities |
| `/communities/:id` | community-detail | detail page |
| `/community-detail/:id` | community-detail | alias for backward compatibility |

### Placeholder routes (stub pages — replace via packs)

| Path | Owned by future pack |
|---|---|
| `/governance` | `governance-pack` |
| `/payouts` | `payouts-pack` |
| `/submit-signal` | `submit-signal-pack` |
| `/profile` | `profile-pack` |
| `/community/:id/members` | `community-members-pack` |
| `/community/:id/settings` | `community-settings-pack` |
| `/members/:name` | `member-detail-pack` |

### Dual-route pattern

Detail pages register **both** `/:parent/:id` and `/:parent-detail/:id` to handle navigation flexibility (e.g. the communities list links to `/communities/:id`, but opportunity-urls in URLs and seed data use `/opportunity-detail/:id`). The first route is the canonical path; the second is an alias.

### Ref formats

- **Opportunity**: `O-####` (e.g. `O-0001`)
- **Execution**: `E-####` (e.g. `E-1042`)
- **Community**: `C-####` (e.g. `C-001`) or named slug (`alpha`, `helia`, etc.)

## The Page Pack (every new routed page)

Every **new routed page** ships these 5 files + 1 route entry + 1 e2e test. The pack is codified in `.agents/features/new-page/` and guarded by pre-commit block `[7/9]`.

1. `frontend/src/app/pages/<slug>/<slug>.page.ts` — the component class
2. `frontend/src/app/pages/<slug>/<slug>.template.html` — the template (or inline `template:`)
3. `frontend/src/app/pages/<slug>/<slug>.page.spec.ts` — **RED spec written first**
4. `frontend/src/app/pages/<slug>/index.ts` — public barrel exporting the component
5. `frontend/src/app/app.routes.ts` — `loadComponent` entry for the new route
6. `frontend/e2e/<slug>.spec.ts` — e2e coverage

The pack requires TDD: spec is written FIRST (RED), then implementation (GREEN), then refactor. Pre-commit `[9/9]` enforces every public method has a test.

### Responsive probe (required before merge)

Every new page must be visually verified at **8 widths**: 320, 375, 480, 640, 768, 1024, 1280, 1440. Use `frontend/_v.mjs` (per-PR probe script) to capture screenshots at each width and vision-analyze them.

## Icon System

Icons are inline SVGs in `frontend/src/app/ui/icon/icon.component.ts`. The `ICON_PATHS` dictionary maps a name to an SVG path string. The component renders `<svg><path d="..."/></svg>` at `[size]` (default 18px).

### Rules

- **Reuse existing names** when possible. Two icons visually-identical-enough should resolve to the same name.
- **Add a new name** by adding an entry to `ICON_PATHS` AND `SUPPORTED_NAMES` in the spec. The pre-commit `[6/9]` icon cross-check verifies this.
- **Real lucide glyphs**, not fonts. The `lucide-static` npm package is a showcase font that renders icon names as text — it is NOT a usable icon source.
- **`<ui-icon>` with Tailwind size classes** (`w-3 h-3`, `w-4 h-4`) does NOT make the inner SVG smaller. The component's `size` input defaults to 18. Always pass `[size]` explicitly when using small icons:
  ```html
  <ui-icon name="map-pin" [size]="12" class="w-3 h-3"></ui-icon>
  ```
- **Cross-references**: never invent a name. If the visual you want isn't in `ICON_PATHS`, add it to the dictionary first.

## Traps (NEVER repeat)

These are mistakes already made at least once and codified. **Do not** undo them. The lesson files live in `.agents/lessons/`.

### TRAP 1: Raw `href="/..."` on internal links

Use `[routerLink]` instead. Raw `href` triggers a **full page reload** (the browser navigates, Angular bootstraps from scratch, all state is lost). Pre-commit `[8/9]` blocks raw `href` on internal routes. Handled: PR #15, #17, #26, #28, #31.

### TRAP 2: `text-slate-N` on overlay backgrounds

Slate-500 ("muted") text becomes invisible on the light-mode card overlays. Use **`text-slate-600 dark:text-slate-400`** for labels and **`text-amber-600 dark:text-amber-400`** for values on top of cards. The merged-opacity stuff doesn't work; use the mode-aware variants. Handled: PR #26.

### TRAP 3: `[size]` not specified on small `<ui-icon>`

See Icon System above. The inner SVG is always 18×18 unless you pass `[size]`. Tailwind classes on the host don't help. Handled: PR #31.

### TRAP 4: `<i>` leftover from the wireframe port

The wireframes contain `<i data-lucide="...">` for icons. When porting, replace each with `<ui-icon name="...">` AND verify the icon name exists in `ICON_PATHS`. Leaving `<i>` renders empty text and breaks the layout. Handled: PR #31.

### TRAP 5: Positioned dropdowns need `position: fixed` + computed offsets

The shared `.menu` CSS is `position: fixed` but provides no top/left. Without inline `[style.top]` and `[style.left]` computed from the trigger button's `getBoundingClientRect()` at click time, the dropdown renders in the wrong location (or above the page). For plain dropdowns, compute position from the trigger. For a system-wide fix, ship a `<ui-dropdown>` component. Handled: PR #31 (local fix).

