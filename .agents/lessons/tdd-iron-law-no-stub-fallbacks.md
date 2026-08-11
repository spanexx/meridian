---
topic: tdd
severity: high
related-to: tdd-enforcement/SKILL.md
---

# TDD iron law: stub fallbacks violate RED

**One-line**: a test that returns a fake shape when the impl is missing passes vacuously — that's the "always green" rationalization the TDD skill warns about.

## The trap

```python
def run_validator() -> dict:
    if not VALIDATOR.exists():
        return {
            "_stub": True,
            "tdd_compliance": {"score": 0.0, "reason": "validator not implemented"},
            # ... every axis at 0.0 with "not implemented" reason
        }
    out = subprocess.check_output([sys.executable, str(VALIDATOR)], text=True)
    return json.loads(out)
```

This looks like a generous default — when the impl doesn't exist, the test returns a "0.0 with reason" shape. But the test that calls `run_validator()` then asserts on `tdd_compliance.score == 1.0` passes... if the test never instantiates the validator stub. In every realistic path, the stub returns 0.0, so the test fails. **It accidentally works.**

Worse: if the test asserts `"score == 1.0"` and the stub returns 0.0, the test fails — but for the wrong reason ("implementation missing"), not for the right reason ("expected behavior is wrong"). The failure message points at the impl, not at the test's own blind spot.

## Why this matters

A test that can't fail when the impl is missing is worse than no test because it gives false confidence. The reviewer reads the green CI and assumes the impl is correct. The next maintainer removes the impl, the test still passes, and a downstream failure surfaces months later.

## The fix

```python
def run_validator() -> dict:
    if not VALIDATOR.exists():
        raise AssertionError(
            "scripts/validate.py missing — RED failure. "
            "Implement the validator to make these tests pass."
        )
    # ... real impl that may also raise
```

Or even simpler — don't wrap at all:

```python
def test_validator_emits_valid_report():
    report = run_validator()  # ImportError if missing
    assert 0.0 <= report["tdd_compliance"]["score"] <= 1.0
```

`ImportError: No module named 'validate'` is the loudest possible RED.

## Also: "watch it fail because of the missing piece"

The TDD skill is explicit: watch the test fail for the right reason. A test that fails because the import doesn't resolve (Test Files 1 failed · no tests) is real RED. A test that fails because it compared against the wrong expected value is a different RED — that's "I tested the wrong thing."

When reviewing a test you wrote, run it ONCE with the impl stubbed out (e.g. comment out the impl function). It should fail. If it passes, the test is broken.

## Real example from this session

`scripts/test_validate.py` (deleted since) had this exact bug:

```python
async def renderStandalone():
    await TestBed.configureTestingModule(...).compileComponents();
    const { MyComp: Comp } = await import('./my.page');  # ← raised ImportError
    const fixture = TestBed.createComponent(Comp);
```

That's a real RED — the import fails because the file doesn't exist. The test legitimately fails.

But a peer file at `scripts/test_score_log.py` had a different shape:

```python
def _run_writer(record: dict) -> dict:
    if not WRITER.exists():
        raise AssertionError("writer missing — RED failure")
```

Also real RED. Both are loud. Stubs that fake the response are silent.
