---
index: true
---

# Lessons — searchable knowledge base

This directory is a curated catalog of mistakes, near-misses, and
patterns learned the hard way. Read ONE of these before you start
work that touches the topic; write ONE of these when you discover
something new.

## When to read

- At session start: scan the table below for anything matching
  what you're about to do.
- When stuck on a specific error message: `rg -l "that error"`
  inside `.agents/lessons/`.
- When the user's tone sharpens: they may have hit one of these
  before and want you to avoid it.

## When to write

- After spending 30+ minutes debugging a single root cause.
- After the user corrects your interpretation ("that's not what
  I meant").
- After a guardrail pattern emerges from a real failure (the
  `pre-commit` hook, the type rules, the test convention).
- After a real bug surfaced from a missing test or missing
  spec.

**Don't** write a lesson for something that was just slow but
isn't instructive. The bar is "would the next agent relearn this
the same way if I didn't write it down?"

## Catalog

| topic | severity | file | one-line |
|---|---|---|---|
| tdd | high | [tdd-iron-law-no-stub-fallbacks.md](./tdd-iron-law-no-stub-fallbacks.md) | A test returning a fake shape when the impl is missing passes vacuously. |
| angular | medium | [page-specs-vs-existing-primitives.md](./page-specs-vs-existing-primitives.md) | UiButtonComponent's host and inner button are separate DOM nodes — query carefully. |
| tooling | medium | [npx-pitfall-cached-binary.md](./npx-pitfall-cached-binary.md) | `npx` from outside the package dir pulls a cached version, not the local one. |
| shells | critical | [gh-from-non-interactive-hang.md](./gh-from-non-interactive-hang.md) | `gh` in a non-TTY subprocess blocks forever on auth prompt, leaking zombies. |
| workflow | critical | [take-the-smallest-interpretation.md](./take-the-smallest-interpretation.md) | "use Y" means USE Y, not "write a Y-shaped local script." |
| tooling | low | [pre-commit-py-modification-patterns.md](./pre-commit-py-modification-patterns.md) | orphan imports + cross-function refs break pre-commit.py silently. |
| ui-pages | high | [new-page-standards.md](./new-page-standards.md) | every new routed page follows the new-page pack recipe — TDD, wireframe-faithful but more minimal, public-method tests, icon guard, responsive probe. |

## Naming convention

- **slug-style filenames**: `topic-detail-suffix.md`. The slug is
  what someone would grep for.
- **`topic` field** in the YAML frontmatter: `tdd | angular |
  tooling | shells | workflow | deploy | ci | data | api | etc.`
- **`severity` field**: `critical | high | medium | low`. Critical
  means "if you don't know this, you WILL break production."
- **`related-to` field**: path to a skill or workflow that this
  lesson augments. Linking keeps the knowledge graph traversable.

## Format

Every lesson has:

1. **YAML frontmatter** (`topic`, `severity`, optional
   `related-to`).
2. **One-line summary** as the first body line. This is what
   shows up in grep results. Write it so a stranger scanning
   the catalog can decide "yes this is what I need" from the
   one line alone.
3. **The trap**: a code snippet or repro showing the broken
   behavior. Copy-pasteable so the reader can verify.
4. **Why this matters**: the real-world consequence if you
   ignore the lesson.
5. **The fix**: a worked solution, with code where applicable.
6. **Real example from this codebase**: an actual instance. If
   you can't find one, the lesson is speculation — leave it
   out or add it later.

## When to delete a lesson

A lesson is stale when:
- The trap can no longer occur (tool rewritten, removed, etc.)
- The fix has been permanently replaced (and the replacement
  is documented elsewhere)
- The lesson was wrong or speculative (mark with a `DISCOVERY`
  comment + a "RESOLVED" date in the body, then move to
  `.agents/lessons/_retired/`)

Don't accumulate lessons forever. Aim for a small, current set.
