---
name: git-conventions
description: Use when creating branches, writing commit messages, opening PRs, or tagging releases in the meridian repo. Enforces master branch + semver tags + Conventional Commits + PR template. Run before any git operation that creates something new (branch, commit, tag, PR).
---

# Git Conventions — meridian

The repo follows a strict set of conventions. Every agent working on this
repo must use them. No improvisation.

## Branch model

- `master` is the only long-lived branch. It tracks what's deployed.
- All work happens on short-lived feature branches named:

  ```
  <type>/<slug>
  ```

  where `<type>` is one of:
  - `feat`     — new user-facing capability
  - `fix`      — bug fix
  - `chore`    — tooling, deps, non-functional
  - `docs`     — documentation only
  - `refactor` — code change that neither fixes a bug nor adds a feature
  - `test`     — test-only change
  - `ci`       — CI/CD, workflows, deploy config
  - `skill`    — adds or updates a repo skill at `.agents/skills/`
  - `wf`       — adds or updates a repo workflow at `.agents/workflows/`

  `<slug>` is lowercase, hyphen-separated, ≤ 60 chars, no trailing
  punctuation. Example: `feat/ui-primitives-pack-1`.

- Branch lifetime target: ≤ 1 week. If a branch lives longer, rebase.

## Commit messages — Conventional Commits

Format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Rules:
- `type` matches the branch type (feat/fix/chore/docs/refactor/test/ci)
- `scope` is the affected area: `frontend`, `backend`, `kernel`,
  `engines/<name>`, `docs`, `agents`, `ci`, etc.
- subject ≤ 72 chars, imperative mood, lowercase, no period
- body explains the why, not the what (the diff shows the what)
- footer references: PR numbers (`Closes #N`), issues (`Refs #N`),
  breaking changes (`BREAKING CHANGE: <description>`)

Examples:

```
feat(frontend): add UI primitives library

19 standalone Angular components at frontend/src/app/ui/, each wrapping
a theme.css class with OnPush + signals. One Playwright spec per
primitive. Dashboard rebuilt as primitives showcase.

Refs: sessions/decisions.md#2026-08-11
```

```
fix(frontend): tier-badge host data-tier

Putting [attr.data-tier] in the template attached the attribute to the
inner badge, not the component host. Tests that query
<ui-tier-badge data-tier="observer"> failed. Moved to host metadata.

BREAKING CHANGE: ui-tier-badge host now has data-tier; consumers
querying ui-tier-badge[data-tier=...] work as expected.
```

## Pull requests

- Every change to master goes through a PR. Direct pushes blocked.
- Branch protection (when set up): 1 approval, CI green, no merge
  commits. Squash-merge preferred.
- PR title matches the commit subject (Conventional Commits format).
- PR body uses `.github/pull_request_template.md` — it asks for:
  - what + why (2-3 sentences)
  - locked direction cited (which docs/ file the change implements)
  - gates run (lint/build/test/e2e) and their result
  - drift + visual fidelity check results
  - follow-ups named, not fixed

## Tags + releases

- Tags follow semver: `vMAJOR.MINOR.PATCH`
- `v0.x.y` until the project is production-ready (community vote per
  `docs/00-goal-analysis.md`)
- Cutting a tag triggers the release workflow (defined in
  `.agents/workflows/release.yaml`)
- Tag annotations are the release notes: bullets of what shipped since
  the last tag

## Forbidden patterns

- ❌ Direct commits to master
- ❌ Merge commits (rebase before merging)
- ❌ Vague commit messages ("fix stuff", "update", "wip")
- ❌ Commits referencing no PR or issue when one exists
- ❌ Force-pushes to shared branches
- ❌ Mixing unrelated changes in one commit (one logical change = one commit)

## Verification before pushing

Before `git push`:

```
git status                              # clean or only intended changes
git log --oneline -5                    # review last commits
git diff master --stat                  # review file footprint
```

Before opening the PR:

```
# In repo root:
./.agents/workflows/git-commit.yaml     # the canonical commit workflow
# Runs lint/build/test for the touched scope
```

If any of those fail, fix before opening the PR. Do not push red.

## Common pitfalls

- "WIP" commits in PR history → squash before merging or use
  `git commit --fixup` + autosquash
- Pushing the merge commit (no FF) → use rebase merge or squash
- Long branches → rebase onto master daily; resolve small conflicts
  fast
- Secrets in commits → `git secrets --scan` if installed; rotate any
  leaked secret immediately

## See also

- `.agents/workflows/git-commit.yaml` — step-by-step commit workflow
- `.agents/workflows/release.yaml` — step-by-step tag + release workflow
- `.github/pull_request_template.md` — PR body template
- AGENTS.md §6 — workflows rule (every repeated task gets a workflow)

## Repo specifics

- Origin: `https://github.com/spanexx/meridian.git`
- Default branch: `master` (note: not `main`)
- Visibility: public
- CI: GitHub Actions (workflows at `.github/workflows/`)
- Frontend deploy: Vercel (via GitHub Actions deploy hook)
- Backend deploy: Fly.io primary, Render fallback, your computer for
  dev/staging if neither is available. Production deferred until
  staging proves reliable.