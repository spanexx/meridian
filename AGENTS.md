# AGENTS.md — MERIDIAN Project Instructions

This file governs every agent session in this repo. Read it at the start of every session, before any work.

## 1. Skill Routing — Use the Right Tool for the Job (MUST)

**These rules are mandatory.** Follow the routing table and the rules below on every session, without exception.

| Situation | Skill | When |
|---|---|---|
| Starting a new session / resuming work | `situation-awareness` | Run `situ` first: git state, recent commits, and the latest handoff (`sessions/.last-handoff`) |
| Huge chunk of work spanning multiple sessions, route unclear | `wayfinder` | Plan as a map of decision tickets, resolved one at a time. **User-invoked** — the user triggers it, the agent does not self-invoke |
| Big implementation (new capability, full pipeline) | `feature-pipeline` | GRILL → pre-impl sim → PRD-TRD → IMPL → implement → post-impl sim → drift check → reconcile |
| Execute a planned feature pack from the backlog | `execute-pack` | Build the next backlog pack end-to-end (sims, docs, implementation, drift) |
| Small, targeted change (fix, drift repair, locked design) | `surgical-change` | Smallest surface; feature docs updated; no full pipeline |
| Breakpoint / session end / mid-task cutoff | `handoff` | Write `sessions/.last-handoff` + breadcrumb; fresh sessions resume from it |

MUST rules:

1. **Never start a session without `situation-awareness`.** Run `situ` first; read the latest handoff if one exists; read `state` for the operating mode (§2).
2. **Never end a session without a `handoff`** — even mid-task, write a checkpoint handoff listing remaining steps and the command that proves each.
3. **Never do big work with small tools.** Anything spanning multiple sessions starts with `wayfinder` (user-invoked). Anything implementing a new capability runs `feature-pipeline` or `execute-pack`. When in doubt, escalate — do not improvise.
4. **Never improvise small fixes.** If the design is locked and the change is small, use `surgical-change` — not a half-built pipeline.

## 2. Operating Mode — MANUAL / AUTO (MUST)

**The current mode lives in the `state` file at the repo root (`manual` or `auto`). Read it at the start of every session.** This decides who makes decisions.

| Mode | Who decides | When |
|---|---|---|
| **MANUAL** | The user makes every decision. The agent proposes; the user decides | Default — unless the user explicitly switches to AUTO |
| **AUTO** | The agent may decide on the user's behalf | Only after the user explicitly switches ("auto mode", "you decide") |

MUST rules:

1. **Default is MANUAL.** If `state` is missing or unclear, treat it as MANUAL. At every decision point, propose and wait for the user's call.
2. **Only the user switches modes.** MANUAL → AUTO and AUTO → MANUAL are the user's decisions, never the agent's — the `state` file changes only when the user makes the call. When starting to make decisions, state the mode you are operating in.
3. **In AUTO, the agent decides HOW to follow the direction — never WHAT the direction is.** Decisions must follow the locked direction: `docs/` (the design — including `00-goal-analysis.md` and its priority order), `CONTEXT.md` (canonical terms), the engineering philosophy, and locked GRILL/PRD-TRD decisions. Scope changes, money/economics rules, reputation rules, Community-Governed Parameters, and anything that contradicts the docs stay with the user and the Community in every mode.
4. **Every AUTO decision is documented.** Append one line to `sessions/decisions.md`:

   `YYYY-MM-DD | decision | why | direction source (docs/PRD-TRD/CONTEXT.md) | impact`

   If the decision changes docs or code, the docs are updated in the same change — the docs are the truth.
5. **When in doubt, ask.** If a decision is not clearly covered by the locked direction, escalate to the user — even in AUTO.
6. **Note the ending mode in the handoff** (§1), so the next session knows whether it may decide or must ask.

## 3. What This Project Is

MERIDIAN is a **collective arbitrage engine** — a member-owned platform where participants pool capital, signals, and access to execute arbitrage deals and share profits.

**The docs are the truth.** The full design lives in `docs/` (start with `00-system-overview.md`). Code must match the docs; when code and docs diverge, that is drift, not freedom. Never change behavior without updating the affected docs.

## 4. Canonical Terms — See CONTEXT.md

Use the architecture vocabulary exactly as defined in `CONTEXT.md`: **Kernel**, **Engine**, **Provider**, **Contract**, **Event**. Never reintroduce the old "service" language. If a term is missing, add it to `CONTEXT.md` before use — never invent synonyms.

## 5. Learning from Mistakes — Mandatory Skill Updates

After every iteration (feature pack, surgical change, ticket resolution, session), agents must convert the lessons into project skills:

- **Create a new skill** in this repo at `.agents/skills/<name>/SKILL.md` or **update an existing one** whenever the iteration revealed a mistake, a gap, or a repeatable lesson.
- Skills are **project-scoped**, not user-global. They live inside this repo so they travel with the codebase and any other repo can keep its own. Do **not** create skills under `~/.agents/skills/`; that path is for cross-project tooling only and is not picked up by `kit/app.js` or the situation-awareness flow.
- The goal: **the same mistake is never made twice.** If a mistake was made, a skill must exist (or be updated) that prevents it.
- Use the `create-skill` skill to author new skills; follow the standard format (frontmatter: `name` + `description`; body: when to use, steps, checklist).
- Write the `description` so future agents auto-invoke the skill at the right moment — a skill that never triggers is useless.
- Commit the skill update in the same commit as the work that produced the lesson.

## 6. Repetitive Tasks — `.agents/workflows/*.yaml`

Any task that repeats (release, git, validation, scaffolding, etc.) must be codified as a YAML workflow in `.agents/workflows/`:

- Add or update a workflow the moment a task has been done twice.
- Each workflow defines: `name`, `description`, `triggers`, `steps` (ordered), `verify` (how to prove success).
- Workflows are the single source of truth for how a repetitive task is done — never improvise a task that has a workflow.
- See `.agents/workflows/README.md` for the exact format.

## 7. Working Rules

1. TDD where code exists: red → green → refactor. Never write code before its test.
2. Keep files small (≈350 lines); split instead of growing.
3. When new canonical terms emerge, record them in `CONTEXT.md` first — before using them in docs or code.
4. Observability is part of the product: every change must be explainable and auditable.
5. AI recommends; humans decide. Automated checks never make final calls on money or reputation.
6. Validate before claiming done: build, test, lint; run feature-pack sims when they exist.
7. Do not fix unrelated bugs — name them in the final message instead.
