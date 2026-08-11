---
topic: shells
severity: critical
---

# gh CLI hangs forever when called from a non-interactive context

**One-line**: `subprocess.run(['gh', 'run', 'list', ...])` from inside a script that runs as a child of `git commit` (no TTY) → `gh` opens an interactive auth prompt, blocks on `read()`, and the parent hangs forever, leaking a zombie per spawn.

## The trap (real example from this session)

You have a pre-commit hook in `scripts/pre-commit.py` that calls a Python helper in `scripts/check_mechanical.py`. The helper has an axis that calls `gh run list` to look at recent CI:

```python
def axis_ci_green() -> dict:
    proc = subprocess.run(
        ["gh", "run", "list", "--limit", "5"],
        cwd=str(REPO_ROOT),
        capture_output=True, text=True,
        timeout=15,
    )
    # parse output...
```

When you run `git commit -m "..."`:

1. git invokes `.git/hooks/pre-commit` → `python3 scripts/pre-commit.py`.
2. pre-commit invokes `check_mechanical.py` (another subprocess).
3. check_mechanical invokes `gh run list` (a third subprocess).
4. `gh` can't find a token in the env. **It tries to open an interactive auth prompt.** The shell has no TTY (`git commit` doesn't allocate one to child processes by default). `gh` blocks on `read(2)` from its controlling terminal.
5. `check_mechanical`'s `subprocess.run(... timeout=15)` fires after 15s. But `subprocess.run` can't kill a hung child that won't unblock its own `read()`. The child stays alive.
6. `pre-commit` finishes on timeout. `git commit` exits non-zero. You think the script crashed. **But the child `gh` process is still alive, blocked.**
7. The next pre-commit invocation runs the same chain → another hung `gh` zombie.
8. After 10 commits: 10 hung `gh` processes, all blocking on `read()` from a TTY that doesn't exist.

**Symptom caught in this session**: ~100 hung processes after one bad pre-commit. `pgrep -af` showed them all, same cmdline.

## Why `timeout=` doesn't save you

`subprocess.run(timeout=N)` raises `TimeoutExpired` after N seconds. It sends SIGKILL to the child process. But the child (`gh`) is in a system call (`read()` on stdin). On Linux, SIGKILL to a process blocked in `read()` doesn't kill it immediately — the kernel keeps the process waiting until the read returns OR until SIGKILL is unmasked. Most modern kernels do kill it, but if the controlling terminal has been closed or the process has set up signal handlers (gh does), the kill is deferred.

`pkill -9` after-the-fact requires a loop because killing one parent doesn't kill the children of children.

## The fix

**Never call `gh` (or any TTY-needing tool: `pass`, `sudo -A`, `aws configure`, `gcloud auth login`) from inside a subprocess chain that starts with `git commit`.**

Two alternatives:

### Option A: capture gh state at a non-hook time
Run `gh auth status >/dev/null 2>&1` once at the user's terminal. If it prompts, the user authenticates. After that, all `gh` calls are non-interactive. Validate the auth state at the start of `pre-commit.py`:

```python
def has_gh_auth() -> bool:
    proc = subprocess.run(
        ["gh", "auth", "status"],
        capture_output=True, text=True, timeout=5,
    )
    return proc.returncode == 0
```

If `not has_gh_auth()`, skip the gh-dependent axis and report `0.0` with reason "gh not authenticated" instead.

### Option B: use `gh api` instead of `gh run list`
`gh api /repos/.../actions/runs` returns the same data as `gh run list` but bypasses the auth-mode detection (it uses your existing `GH_TOKEN` env var or `~/.config/gh/hosts.yml` file directly). **No TTY prompt.**

```python
def gh_list_runs(repo: str, limit: int = 5) -> list[dict]:
    proc = subprocess.run(
        ["gh", "api", f"repos/{repo}/actions/runs",
         "-q", f".workflow_runs[:{limit}]",
         "--jq", '[.[] | {conclusion, databaseId, headBranch}]'],
        capture_output=True, text=True, timeout=15,
    )
    if proc.returncode != 0:
        return []
    return json.loads(proc.stdout)
```

This is the right call when the hook needs CI data without blocking.

### Option C: skip the gh-dependent axes during pre-commit
If the gh-dependent axis is informational only (not a gate), wrap it in a try/except and on failure return `0.0` with reason. The pre-commit still passes; the user sees "gh call failed in pre-commit" in the log; nothing hangs.

## Clean up existing zombies

If you're already in the bad state:

```bash
pkill -9 -f "gh run"
pkill -9 -f "your-script-that-calls-gh"
# verify with: pgrep -af "<your pattern>"
# loop until empty — needs 3-5 iterations because of grandchild processes
```

Loop iteration because the grandchild `gh` processes mask SIGKILL while their `read()` is blocked.

## Real example from this session

The validate-and-score discipline tried to compute `ci_green` axis inside `check_mechanical.py`, which was invoked by `validate_and_score.py`, which was invoked by `pre-commit.py`. One `git commit` → 1 orchestrator + 1 checker + 1 gh = 3 processes. After debugging with multiple test runs, ~100 zombies. Took 4 iterations of `pkill -9 -f` to clean up.

The fix that ships: deleted all the python orchestrator code (per the user's "use opencode as subagent" pivot); the validate-and-score skill now uses `opencode run` for both Validator and Semantic-Judge, no `gh` needed.
