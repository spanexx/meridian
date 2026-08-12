---
topic: git-workflow
severity: high
related-to: partial-staging, reset-hard, icon-regression
---

# Partial staging + `git reset --hard` loses uncommitted work

One-line summary: an icon regression shipped twice because fixes were edited after
`git add`, committed from a stale index, and leftover working-tree changes were
destroyed by `git reset --hard origin/master` after the merge.

## What happened (2026-08-12)

1. PR #20 changed `icon.component.ts` (added `sun`/`cog` paths) but `git add`
   was run for the two shell files only. `pre-commit.py` reported
   "Checking 2 staged file(s)" — the icon changes stayed unstaged.
2. `git commit` snapshots the INDEX, not the working tree — so the commit
   contained the shell referencing `name="sun"` / `name="cog"` while the icon
   dictionary lacked both keys.
3. After merging, `git reset --hard origin/master` destroyed the unstaged icon
   changes. Master rendered invisible icons (0-child SVGs).
4. Tests passed because the spec checked icon NAMES against SUPPORTED_NAMES —
   never that the rendered SVG had children. The broken state was CI-green.

## Guardrails added (same day)

- `scripts/pre-commit.py` block `[6/6] Icon cross-check`: every
  `<ui-icon name="X">` in staged .ts template code must have a matching key in
  `ICON_PATHS`. Negative test: a bogus name fails the check.
- `icon.component.spec.ts`: `it.each(SUPPORTED_NAMES)` asserts each icon SVG
  renders ≥1 child element (path/line/polyline/circle/rect).
- `shell.component.spec.ts`: bottom-row test asserts the three icons render
  actual children, not just names.

## Rules

1. Before `git commit`: run `git status --short` and confirm EVERY changed
   file you intend to ship is staged. If pre-commit says "N staged file(s)",
   N must match your intent.
2. Never `git reset --hard` without first running `git status` — unstaged
   work is gone forever. Use `git stash` if work must be preserved.
3. Any further edit after `git add` requires re-staging the file.
4. Tests that assert on names/attributes are weaker than tests that assert on
   rendered output (child count, geometry). When a silent-visual bug class
   bites twice, strengthen the test to assert rendered output.
