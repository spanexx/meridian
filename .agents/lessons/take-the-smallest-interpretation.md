---
topic: workflow
severity: critical
---

# Take the smallest interpretation of a user request FIRST

**One-line**: when a user message contains "use Y as Z," treat that as a constraint, not a suggestion. Don't substitute "a local script that mimics Y." Direct sub-agent invocation is both simpler AND more correct.

## The trap

User asks: "we have to develop a validation agent and score agent, the agents will validate and score standard metrics for each run."

You interpret "validation agent" as "a Python script that validates stuff" because you have Python tooling and the existing pre-commit.py is Python. You start building `scripts/check_mechanical.py`, then `scripts/score_log.py`, then `scripts/validate_and_score.py` (the orchestrator). ~600 lines of Python later, you have a clean implementation.

User then says: "use opencode as subagent."

You realize: the user wanted a real LLM-context agent all along. Now you need to delete all 600 lines and replace with a ~5-line skill file that says "run `opencode run ...`."

Cost: 90 minutes of writing + a separate "surgical-cleanup" PR.

## Why this matters

When you substitute "a Y-shaped local script" for "actually using Y," you do the work twice:
- once writing the script
- once deleting it after the user corrects your interpretation

Multiplied across a session, this erodes trust and burns hours.

## The diagnostic question

When you find yourself building infrastructure (a Python orchestrator, a custom DSL, a complex data structure) **before** confirming the user wants that abstraction layer, stop and ask:

> "Is the user asking me to **build** something, or to **use** something?"

- **build**: implement, structure, persist
- **use**: invoke, delegate, wrap

Different verbs in the user's message imply different response shapes:

| User says | Response shape |
|---|---|
| "set up X" / "configure X" | persistent infra (script, config file, schema) |
| "use Y" / "spawn Y" / "delegate to Y" | invocation pattern, not infra |
| "make X happen" / "ensure X" | smallest possible thing that produces X |
| "automate X" | recurring Y invocation, scheduled |
| "validate X" / "score X" | one-shot agent invocation + log |

## The fix: ask first when the verb is ambiguous

"validate and score" is ambiguous. Either of these is reasonable:
- (interpret A) "build me a validator + scorer local tool I can run repeatedly"
- (interpret B) "use a sub-agent to validate + score each run"

If you don't ask, you gamble. ~50% of the time you pick the wrong one.

A 30-second clarifying question — "do you want a local script or a sub-agent?" — saves an hour of writing the wrong thing.

## The fix (when you've already guessed)

If you're mid-implementation and the user corrects you ("use opencode," "actually use Postgres not the in-memory store," "that should be a feature flag"):

1. **Don't try to retrofit.** Don't keep the old code and add the new thing on top.
2. **Delete first, then write the new thing.** Move the old code to `.agents/lessons/_deleted-rejected-attempt-2026-MM-DD/` so it's recoverable if you need to consult it, but stop shipping it.
3. **Commit the deletion as its own commit.** A future maintainer (and the user) reading history shouldn't have to wade through deleted code to find the working code.

## What "smallest thing" looks like for a few common asks

| Ask | Smallest thing |
|---|---|
| "log every commit's lint score" | one line in a script, one row in a markdown table |
| "make X happen on every push" | a github action yml, ~20 lines |
| "validate and score every commit" | `opencode run` invocation + a markdown log |
| "monitor X for changes" | a cron + a watcher script |
| "let agents do X" | `delegate_task` or `opencode run` |

The pattern: invoke a tool that already exists. Don't build new tooling unless the existing tool genuinely can't.

## Real example from this session

User asked: "we have to develop a validation agent and score agent, the agents will validate and score standard metrics."

I built a 600-line Python orchestrator chain. User then said: "use opencode as subagent." I deleted all 600 lines, wrote a 200-line skill file, shipped a 2-file PR.

Lesson cost: 2 hours. Lesson benefit: lifetime.

## Related skill

`.agents/skills/validate-and-score/SKILL.md` — the actual architecture that came out of this lesson. It's a 200-line markdown skill that says "spawn Validator via `opencode run`, spawn Semantic-Judge via `opencode run`, do math for Scorer." No code.
