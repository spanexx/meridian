---
topic: tooling
severity: low
---

# pre-commit.py modification patterns

**One-line**: when adding or removing a check in `scripts/pre-commit.py`, three things break in predictable ways: orphan helper references, orphan imports, and helper-function scope.

## Pitfall 1: cross-function helper references

`scripts/pre-commit.py` is a single file with multiple `check_xxx()` functions. Each function is defined at module scope, so they can call each other. **But they CAN'T call functions defined inside other functions.**

```python
def check_yaml(files): ...  # module scope — visible everywhere

def check_score(): ...     # module scope
    some_helper()          # NameError if some_helper is defined inside check_yaml()

def main():
    ...
```

Symptom: LSP error `"_git" is not defined` or `"some_helper" is not defined`, even though you see the function right there in the file.

Fix: define helpers at module scope, OR pass values explicitly between functions.

## Pitfall 2: orphan imports when removing a check

If you remove `check_score()` that uses `json.loads(...)`, you must also remove `import json` at the top. Otherwise pre-commit fails at import time before running any check.

```python
# Before
import json
...
def check_score():
    record = json.loads(proc.stdout)

# After — remove BOTH
def check_score():  # ← if you remove this
    ...
# ALSO remove: import json  ← otherwise pre-commit fails at import
```

## Pitfall 3: `from __future__ import annotations` doesn't change scope

If you see `from __future__ import annotations` at the top (the meridian file has it), variable type annotations become strings evaluated lazily. **Runtime scope is unaffected** — a function defined inside another function is still invisible to siblings, even with lazy annotations.

## The fix: read the full file before patching

Use `read_file(path, offset=1, limit=100)` to read in chunks of 100 lines, OR use `grep`-pattern (`search_files`) to find every reference to a symbol before removing it.

Before removing a function:

```bash
grep -n "function_name" scripts/pre-commit.py
# outputs every reference — definition, calls, comments about it
```

Then make a checklist:
- [ ] remove the definition
- [ ] remove every call site
- [ ] remove imports the function needed (e.g. `json`, `subprocess` were they extra?)
- [ ] update the docstring/header comment if it lists the check

## Real example from this session

Added `check_score()` that did `proc = subprocess.run(... json.loads(proc.stdout) ...)`. Added `import json` at top. Later reverted.

When reverting: removed `check_score()` function definition. Removed the call site in `main()`. **Forgot to remove `import json`.** Pre-commit later failed at import time. Caught on first commit attempt.

Fix sequence: read the full diff of pre-commit.py, identify `import json` as orphan, remove it.
