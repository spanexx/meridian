---
name: comment-policy
description: Use when writing or reviewing any code file in the meridian repo. Defines the required comment header, inline-comment rules, and the discovery/mistake/drift convention that captures what an agent learns while writing the code so the next reader sees it without grepping session logs.
---

# Comment Policy — meridian

Code in this repo has two audiences: humans (today) and future agents
(next session). Both must understand it without external context. The
comment policy enforces that.

## 1. File header — every file

Every source file starts with a header comment block that answers:

- **What is this file?** (purpose, role in the system)
- **Who owns it?** (human owner or "agent-maintained")
- **When was it last reviewed?** (YYYY-MM-DD; updated on each review)

### TypeScript / JavaScript (Angular)

```ts
/**
 * <one-line purpose>
 *
 * <paragraph: where it fits, what depends on it, what it depends on>
 *
 * @owner   spanexx (or "agent-maintained")
 * @reviewed YYYY-MM-DD
 */
```

### Go

```go
// Package <name> <one-line purpose>.
//
// <paragraph: where it fits, what depends on it, what it depends on>
//
// @owner   spanexx (or "agent-maintained")
// @reviewed YYYY-MM-DD
package <name>
```

### YAML (workflows, configs)

```yaml
# <one-line purpose>
#
# <paragraph: what triggers this, what depends on the output>
#
# @owner   spanexx (or "agent-maintained")
# @reviewed YYYY-MM-DD
```

### Markdown (skills, workflows, docs)

The first H1 / heading carries the purpose; the front-matter or
"Owner" + "Last reviewed" line below it carries ownership:

```markdown
---
owner: spanexx (or "agent-maintained")
last_reviewed: YYYY-MM-DD
---
```

### Plain text / shell scripts

Header comment block at the top with the same fields. Use the
language's native comment syntax.

## 2. Inline comments — the why, not the what

- **DO**: explain a non-obvious choice, link to the source of truth.
  ```ts
  // The wireframe's .card has border-radius 14px; tailwind's rounded-2xl
  // is 16px and breaks fidelity. Hardcode the value via theme.css.
  ```
- **DON'T**: restate what the code obviously does.
  ```ts
  // Increment i
  i++
  ```

Rule of thumb: if removing the comment makes the code 10% less clear,
keep it. If removing it changes nothing, delete it.

## 3. Discovery / mistake / drift comments — the new ask

When an agent discovers something non-obvious while writing code —
something that the next person opening this file should see but
wouldn't find in docs/ or sessions/decisions.md — it goes inline as a
tagged comment. Three tags, each with a reason:

### `// DISCOVERY:` — facts that contradict assumptions

```ts
// DISCOVERY 2026-08-11: theme.css defines --gradient-violet as a SOLID
// hex color (#a86a2d), not a linear-gradient. Tests asserting
// `background-image contains "gradient"` will fail. The "gradient" name
// is misleading — see wireframe/meridian/kit/theme.css:33.
```

### `// MISTAKE:` — a wrong turn the agent took (and the fix)

```ts
// MISTAKE 2026-08-11: putting [attr.data-tier]="tier" in the template
// attached the attribute to the inner badge, not the component host.
// Tests that queried `ui-tier-badge[data-tier=...]` failed. Moved to
// `host: { '[attr.data-tier]': 'tier' }` in the @Component metadata.
```

### `// DRIFT:` — code that diverges from the docs

```ts
// DRIFT 2026-08-11: this function returns 0 on empty input, but
// docs/02-data-model.md:147 says "no current pool returns null".
// The doc is the source of truth — fix this function or update the doc
// before the next release.
```

Format:
- Tag prefix (DISCOVERY / MISTAKE / DRIFT)
- Date (YYYY-MM-DD)
- One sentence: what was wrong / surprising / drifted
- One sentence: what to do about it (or pointer to the file:line that explains)

These comments stay in the code permanently — git blame shows who
introduced the lesson, and the next person sees it inline without
grepping. Do not delete them when "the issue is fixed"; update the
comment to mark it resolved (`// DISCOVERY 2026-08-11 ... RESOLVED
2026-08-15: see <commit>`).

## 4. Files that don't need headers

- Auto-generated files (`*.d.ts`, `package-lock.json`, generated
  route files) — skip the header; add a single top-of-file marker:
  ```ts
  // AUTO-GENERATED. Do not edit.
  ```
- Pure data files (`*.json`, `*.csv`, fixture data) — no header
  required; metadata lives in the parent dir's README if needed.
- Empty placeholder files — no header required.

## 5. What the pre-commit hook enforces

The hook (`.lefthook/pre-commit`) checks:

1. Every staged source file has a header comment matching the format
   above. If the header is missing or the `@reviewed` field is more
   than 90 days old, the commit fails with a clear message.
2. No `TODO` / `FIXME` / `XXX` in staged code without a paired
   "owner" inline comment. (Allowed if it has a `@todo` JSDoc tag
   with an owner and date.)
3. Every `DISCOVERY` / `MISTAKE` / `DRIFT` comment in staged files
   includes a date and a pointer to a file:line or commit.

Enforcement runs locally AND in CI (the `precommit` job in
`.github/workflows/ci.yml` re-runs the same checks), so a bypass of
the local hook still fails on the server.

## See also

- `.lefthook/pre-commit` — the script that enforces this policy
- `.github/workflows/ci.yml` — CI re-runs the same checks
- `sessions/decisions.md` — the macro-level decision log; this skill
  covers the micro-level comments inside files
- `.agents/skills/visual-fidelity-check/SKILL.md` — a related
  "lessons learned" pattern that this skill extends