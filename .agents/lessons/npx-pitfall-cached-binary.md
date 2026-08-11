---
topic: tooling
severity: medium
related-to: tdd-enforcement/SKILL.md
---

# npx pitfall: cached version ≠ local version

**One-line**: running `npx <tool>` from outside the directory that owns `node_modules/` silently falls back to npx's install-cache, which can hold a different version than the project's pinned one.

## The trap

Cwd is `/home/user/my-project`. The `frontend/` subdir has a `package.json` pinning `vitest@^3.2.7` and a populated `node_modules/vitest` at 3.2.7. You run:

```bash
npx vitest run
```

**Result**: vitest 4.1.10. Symptom: tests fail with `ReferenceError: describe is not defined`. Why?

1. `npx vitest` from the project root doesn't find `node_modules/.bin/vitest` (it lives in `frontend/node_modules`).
2. npx falls back to checking its install-cache (`~/.npm/_npx/<hash>/node_modules/vitest`).
3. That cache entry has vitest 4.1.10 from a different project run weeks ago.
4. npx uses the cached 4.1.10 silently.

So you get a vitest that doesn't match your project's pinned version. Tests fail in confusing ways (different expected globals, different API surface).

## Why this matters

When you run `npx vitest` and it doesn't match your lockfile, every conclusion you draw — "vitest is broken," "my tests are broken," "my code is broken" — is wrong because the runner is wrong.

## Diagnose

```bash
which -a vitest     # shows all installed binaries on PATH
npx vitest --version    # shows what npx resolves to
./node_modules/.bin/vitest --version  # shows the local pinned version
cat package-lock.json | grep '"node_modules/vitest"' -A 2  # shows the locked version
```

If `npx vitest --version` differs from `./node_modules/.bin/vitest --version`, you're hitting the cached fallback.

## The fix (three options, pick one)

### Option A: always `cd` into the package directory first
```bash
cd frontend/
npx vitest run    # resolves to frontend/node_modules/.bin/vitest
```

Simple. Costs a `cd`. Best for one-off tasks.

### Option B: invoke the local binary directly
```bash
./node_modules/.bin/vitest run    # bypasses npx entirely
# or
(cd frontend && npx vitest run)  # subshell so cwd doesn't persist
```

Bypasses the npx cache completely.

### Option C: pin versions to remove the ambiguity
```json
{
  "devDependencies": {
    "vitest": "3.2.7"     // exact, not ^3.2.7
  }
}
```

An exact pin stops npx from picking a newer cached version (the lockfile forces 3.2.7). But the lockfile-lock happens via `npm install`, which we ALSO have to remember to run.

## When this matters most

- Multi-package monorepos (`frontend/`, `backend/`, etc.) where you might `cd` between roots.
- Long-running shells where the project root and the package root drift apart.
- CI vs local: CI usually has a single `cwd` so it doesn't hit this; local with multiple terminals can.

## Real example from this session

Wrote a vitest spec in `frontend/src/app/pages/opportunities/opportunities.page.spec.ts`. Ran `npx vitest run src/app/pages/opportunities` — got vitest 4.1.10 from cache, ran test, got `describe is not defined`. Re-ran with `cd frontend && npx vitest run src/app/pages/opportunities` — got vitest 3.2.7 (the actual pinned version), test ran.

The 60-second detour ended at "oh, npx cache hit again."
