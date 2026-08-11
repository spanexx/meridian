## What

<!-- 2-3 sentences: what changed and why. Cite the locked direction
     (which docs/ file, GRILL decision, or PRD-TRD section implements
     this change). If the change has a session/.last-handoff, link it. -->

## Why

<!-- The motivation. What problem or gap drove this. Reference the
     decision log line if applicable (sessions/decisions.md). -->

## Type

- [ ] feat     — new user-facing capability
- [ ] fix      — bug fix
- [ ] chore    — tooling, deps, non-functional
- [ ] docs     — documentation only
- [ ] refactor — code change, no new feature or fix
- [ ] test     — test-only change
- [ ] ci       — CI/CD, workflows, deploy config
- [ ] skill    — adds or updates a repo skill
- [ ] wf       — adds or updates a repo workflow

## Scope

<!-- One of: frontend, backend, kernel, engines/<name>, docs, agents,
     ci, repo. Match the Conventional Commits scope in the PR title. -->

## Gates run

<!-- Run the relevant subset before requesting review. CI will re-run. -->

- [ ] `cd frontend && npm audit --omit=dev` — 0 vulnerabilities
- [ ] `cd frontend && npx ng build` — exit 0
- [ ] `cd frontend && npx playwright test` — all green
- [ ] `cd backend && go vet ./...` — clean
- [ ] `cd backend && go test ./...` — all green
- [ ] `cd backend && go build ./...` — exit 0
- [ ] docs read-through — wording matches code

## Visual fidelity check (UI changes only)

<!-- Per .agents/skills/visual-fidelity-check/SKILL.md. All three stages
     must pass before claiming wireframe parity. -->

- [ ] Stage 1 — DOM structure compared to source
- [ ] Stage 2 — computed styles match theme tokens
- [ ] Stage 3 — visual screenshot reviewed by a human

## Drift check

<!-- If the change touches docs/, run a drift pass. -->

- [ ] No new docs/code contradictions
- [ ] Affected docs/ sections updated in the same commit
- [ ] Decision logged in sessions/decisions.md if AUTO mode

## Follow-ups (named, not fixed)

<!-- List any related issues found during this change that are out of
     scope. AGENTS.md §7 rule 7: do not fix unrelated bugs in the same
     commit — name them here instead. -->

-
-

## Breaking changes

<!-- If yes, document the migration path. -->

- [ ] No breaking changes
- [ ] Breaking change — see notes below

## Checklist

- [ ] PR title follows Conventional Commits (`<type>(<scope>): <subject>`)
- [ ] Branch is `feat/`, `fix/`, `chore/`, etc. — not master
- [ ] Commits are logical units (one logical change per commit)
- [ ] No secrets, no debug logs, no commented-out code left behind
- [ ] Re-ran gates after any force-push or rebase