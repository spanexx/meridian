---
name: validate-and-score
description: Use when committing, opening a PR, or ending a session in the meridian repo. Defines the 3 sub-agents (Validator / Semantic-Judge / Scorer) and the orchestration that runs after every commit. Each sub-agent is spawned as `opencode run` with a fresh context; the Scorer is deterministic math (no LLM). All 11 axes roll up into a 0–100 score written to sessions/scores.md. Perfect = all 11 axes at 1.0; on perfect, the agent earns a github-contributor attribution (user-confirmed).
---

# validate-and-score — meridian

Three sub-agents, each run as **`opencode run` with a fresh context**,
work together to evaluate every commit in the meridian repo. The
orchestrator (Hermes main, or a human invocation from the session
end handoff) collects their outputs and writes one row to
`sessions/scores.md`.

`opencode run` is the auto-mode for these agents because each
judgment benefits from a fresh context — no carry-over from prior
runs, no contamination from the agent's other work in the session.
A full validation typically takes 30–90 seconds per agent and
costs tokens; the discipline is "worth it on real work, skip on
chore commits" via the `--skip` flag.

## The 3 sub-agents

### 1. Validator — mechanical, 8 axes

The Validator runs in a fresh shell context, NOT in Hermes main.
It inspects the working tree, the recent CI history, and the HEAD
commit, and emits a JSON object with one entry per axis:

| key | measures |
|---|---|
| `tdd_compliance` | every staged `.ts`/`.tsx` source has matching `.spec.ts` in the same directory |
| `gate_clean` | `scripts/pre-commit.py` passes (or vacuous if no staged files) |
| `ci_green` | recent `gh run list` runs for this branch are mostly green |
| `commit_hygiene` | HEAD subject is conventional-commit + ≤ 72 chars + body explains "why" |
| `header_coverage` | fraction of staged `.ts` carrying `@owner` + `@reviewed` |
| `file_size_discipline` | max staged source ≤ 350 lines (linear penalty beyond) |
| `handoff_current` | `sessions/.last-handoff` exists + ≥ 200 bytes |
| `scope_discipline` | subject keywords overlap with diff paths |

**Invocation template:**

```bash
opencode run "$(cat <<'EOF'
You are the Validator sub-agent for the meridian validate-and-score
discipline. Read /home/spanexx/Shared/Projects/meridian/.agents/skills/
validate-and-score/SKILL.md for the full rules, then for each of the
8 mechanical axes below, inspect the current working tree at
/home/spanexx/Shared/Projects/meridian and emit a JSON object:

{
  "tdd_compliance": {"score": 0.0-1.0, "reason": "<= 200 chars"},
  "gate_clean": ...,
  ...
}

Inspect these directly: staged files (`git diff --cached --name-only`),
pre-commit (run scripts/pre-commit.py), recent CI runs (gh run list),
HEAD commit (`git log -1 --format=...`), session handoff file,
subject vs diff path overlap. Print ONLY the JSON object.
EOF
)"
```

### 2. Semantic Judge — semantic, 3 axes

The Semantic Judge runs in a SECOND fresh context with the validator's
output NOT visible to it. It reads:

- `docs/00-system-overview.md`
- `docs/01-architecture.md`
- `docs/02-data-model.md`
- `CONTEXT.md`
- `AGENTS.md`
- The current diff (`git diff HEAD~1..HEAD --unified=0`)

And emits scores for:

| key | measures |
|---|---|
| `rule_alignment` | respects the locked direction (Kernel before Engines, contract before provider, in-memory before DB, etc.) |
| `philosophy_adherence` | serves the cooperative + AI-recommends-human-decides principles; no silent money moves |
| `code_quality` | correct logic, edge cases handled, no dead code, no copy-paste, KISS+DRY per AGENTS.md §7 |

**Invocation template:**

```bash
opencode run "$(cat <<'EOF'
You are the Semantic Judge sub-agent for the meridian validate-and-score
discipline. Read /home/spanexx/Shared/Projects/meridian/.agents/skills/
validate-and-score/SKILL.md, then read these documents:
  - docs/00-system-overview.md
  - docs/01-architecture.md
  - docs/02-data-model.md
  - CONTEXT.md
  - AGENTS.md
and the diff at HEAD vs HEAD~1. Emit a JSON object with scores 0.0-1.0
for these 3 axes, each with a reason <= 200 chars:
{ "rule_alignment": {...}, "philosophy_adherence": {...}, "code_quality": {...} }
Print ONLY the JSON object.
EOF
)"
```

### 3. Scorer — deterministic math + verdict + reward eligibility

The Scorer is **pure math, no LLM**. Hermes main can compute it
itself, or call a small shell snippet:

```bash
jq -n --argjson axes '{"a":0.95,"b":1.0}' '
  ($axes | to_entries) as $entries
  | {
      total: (($entries | map(.value) | add) / ($entries | length) * 100 | round),
      verdict: (if ($entries | map(.value) | add) / ($entries | length) >= 1.0 and ($entries | length) >= 11 then "perfect"
               elif ((($entries | map(.value) | add) / ($entries | length) * 100 | round)) >= 80 then "good"
               else "needs_work" end),
      perfect: ((($entries | map(.value) | add) / ($entries | length)) >= 1.0 and ($entries | length) >= 11),
      promotion_eligible: ((($entries | map(.value) | add) / ($entries | length)) >= 1.0 and ($entries | length) >= 11)
    }
'
```

Or use `python3 -c "..."` if jq isn't installed. No sub-agent
context needed.

Output is the final record (date, run_id, axes, total, verdict,
perfect, promotion_eligible, notes).

## The reward (perfect = promotion)

On a perfect score, the user adds the orchestrator agent to the
github contributor list with the attribution "a cool walker score"
(per the user, 2026-08-11). This is a **manual** promotion; the
orchestrator surfaces `promotion_eligible` in its output and asks
the user to confirm.

## Score log

The Scorer appends the final record to `sessions/scores.md`. The
file format is a markdown table with one row per run:

| column | description |
|---|---|
| `date` | YYYY-MM-DD |
| `run_id` | opaque id (commit sha, session id, manual note) |
| `total` | 0-100 |
| `verdict` | perfect \| good \| needs_work |
| `perfect` | yes / no |
| `promotion` | yes / no (== perfect) |
| `rule_alignment`, `philosophy_adherence`, `code_quality` | per-axis score (only the 3 semantic axes are in this view; the 8 mechanical axes are recorded in `sessions/.last-handoff` instead) |
| `notes` | free-form |

The score log is **append-only and idempotent** (no overwrite).

## Threshold v1 (equal weights)

| verdict | rule |
|---|---|
| `perfect` | total == 100 AND every axis in mechanical (8) + semantic (3) reported ≥ 1.0 |
| `good` | 80 ≤ total < 100 |
| `needs_work` | total < 80 |

Weights: each axis = `1.0`. Total is the rounded mean over axes
present.

## When to skip

If a commit is purely mechanical (e.g. `chore: bump lockfile`,
`docs: fix typo`), pass `--skip` to the orchestrator invocation.
Default: always run.

## What the score is NOT

- It is **not** a license to skip the user's review — the user
  approves every PR regardless of score.
- It is **not** a measure of importance. A 100 commit fixing one
  typo scores the same as a 100 commit shipping the Kernel.
- It is **not** a guarantee of correctness. The semantic judge is
  reading the diff + docs, not running the code.
- It is **not** the only signal. CI, pre-commit, vitest, and the
  user's review all run independently.

## See also

- `autonomous-ai-agents/opencode` skill — how to spawn `opencode
  run` with prompt templates.
- `.agents/skills/tdd-enforcement/SKILL.md` — the Validator's
  `tdd_compliance` axis depends on this rule.
- `.agents/skills/comment-policy/SKILL.md` — the Validator's
  `header_coverage` axis depends on this rule.
- `sessions/.last-handoff` — where the orchestrator writes the
  per-run summary that includes the 8 mechanical axis breakdown.

