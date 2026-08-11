---
name: engine-coverage-check
description: Use when implementing or extending the wireframe, adding engines to docs/01-architecture.md, or when drift is suspected between a wireframe surface and its backing engine. Auto-runs the cross-reference between every page in the wireframe and the canonical engine list in docs/01-architecture.md. Catches the recurring mistake of building UI on a domain that has no engine owner.
---

# Engine Coverage Check

## When to Use

- Adding a new wireframe page or section.
- Adding a new engine to `docs/01-architecture.md`.
- Suspecting a wireframe surface (page, modal, side panel) has no backing engine.
- Beginning implementation work that consumes a wireframe surface (API surface has TBDs, no collection in `02-data-model.md`).
- After a GRILL session that resolves a new engine boundary.

## When NOT to Use

- Pre-design whiteboarding where no engine or wireframe page exists yet.
- Pure cosmetic changes that don't introduce new data or capabilities.

## The Mistake This Skill Prevents

The recurring mistake: building a UI feature that implies a data owner (a community, a governance proposal, a credential repository) without checking that the owning engine exists in the canonical engine list. The feature then lives as a wireframe-only surface that cannot be implemented without first inventing the engine.

This happened in MERIDIAN on 2026-08-10 when three pages (`communities/index.html`, `community-detail/index.html`, `community-detail/settings/index.html`) and one page (`governance/index.html`) showed up in the wireframe with no collections in `docs/02-data-model.md` and no engines in `docs/01-architecture.md:81-89`.

## Process

1. **List the canonical engines.** Read `docs/01-architecture.md:79-91` for the engine table. Record each engine name, its capability, the collections it owns, and the events it reacts to.
2. **List the wireframe surfaces.** Walk every `wireframe/<repo>/<section>/index.html` (or whatever the equivalent layout is). For each, record: page name, data displayed, mutations triggered, links to other pages.
3. **Build the page-to-engine matrix.** For each page, ask: which engine owns the data this page reads, and which engine handles the mutations this page triggers? For each "none," flag the page.
4. **Build the engine-to-page matrix.** For each canonical engine, ask: which pages read from it? An engine that no page reads from is unused in the wireframe (acceptable for engines like Admin that have no member-facing console); an engine that should appear but doesn't means a page is going to break.
5. **Surface the gaps.** Every page-to-engine "none" and every "wireframe has a field that has no contract" is a gap. Do NOT propose fixes in this skill -- just report them. Fix is a separate decision (add engine vs. defer page vs. fold into existing engine).
6. **Report.** Write a short table back to the user or to your handoff: engine list, page list, matrix, gap list, recommended next GRILL or `feature-pipeline` for each gap.

## Checklist

```
[ ] Canonical engines listed from docs/01-architecture.md
[ ] Wireframe surfaces walked, one per file
[ ] Page-to-engine matrix built (page reads → engine owns)
[ ] Page-to-engine matrix extended (page mutations → engine owns)
[ ] Engine-to-page matrix built (any engine with no wireframe reader flagged)
[ ] Every page has at least one engine, or gap is reported
[ ] Every engine has at least one wireframe reader, or gap is reported
[ ] Drift fields surfaced (wireframe shows X, no contract carries X)
[ ] Output saved to handoff; not just in chat
```

## Where to Look for Drift

- **Field-level drift** — wireframe shows a field that no contract has. Example: community-detail/index.html shows "Last updated: 2mo ago, proposer: @amelia" per parameter; only a join across `system_config` + `governance_proposals` + `members` can serve this.
- **Status drift** — wireframe shows a status badge that isn't in any enum. Example: pages 5 and 17 show filter tabs (active, proposed, archived, pending, vetting, approved, executing, rejected); wireframe statuses must match the engine's enum.
- **Count drift** — docs say "9 engines" but the wireframe surfaces 11 capabilities. This means there are unspoken engines the docs need to formalize, OR the wireframe is over-spec'd for v1.
- **Auth drift** — wireframe shows a button on a public page that hits an authenticated endpoint (e.g., a vote button visible to non-authenticated users). Always sanity-check by inspecting `data-auth-form` / `data-redirect` attributes.

## Output Format

A short markdown section in your handoff or reply:

```
## Engine coverage check

Canonical engines: N (from docs/01-architecture.md:81-91)
  - Identity & Access, Member, Money, Opportunity, Execution, Payout,
    Reputation, Notification, Admin

Wireframe surfaces: M
  - (list of pages)

Pages with no engine: K
  - page X → community concept (new engine?)
  - page Y → governance concept (new engine?)

Pages with field drift: J
  - page Z shows "foo bar baz" but no contract carries it

Recommendation:
  - Add Community engine (GRILL needed)
  - Add Governance engine (GRILL needed)
```

## Why This Skill Exists

Without this check, agents repeatedly ship wireframe pages or design docs that imply ownership without naming the owner. The drift accumulates; later agents discover it during implementation and have to backtrack. Running the check before going to PRD-TRD saves an entire `feature-pipeline` cycle.

The MERIDIAN session that produced this skill found **4 pages** in this state — Communities list/detail/settings and Governance — each of which would have become an implementation dead-end.
