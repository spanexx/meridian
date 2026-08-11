#!/usr/bin/env python3
"""
Pre-commit guardrails for the meridian repo.

Runs five blocks of checks against staged files:
  1. YAML validity (workflows + manifests)
  2. Secrets scan (.env, .pem, .key, hardcoded tokens)
  3. Comment-policy header presence + DISCOVERY/MISTAKE/DRIFT format
  4. Type check (tsc --noEmit) for staged TS files
  5. Unit tests for staged TS files (vitest, falls back to skipping if
     vitest is not installed)

Exit code 0 = pass, 1 = block the commit.

@owner   spanexx
@reviewed 2026-08-11
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

# File extensions that MUST have a comment header.
SOURCE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".go", ".py", ".sh"}

# Files exempt from the header requirement.
HEADER_EXEMPT_PATTERNS = [
    re.compile(r"\.d\.ts$"),                    # generated type defs
    re.compile(r"package-lock\.json$"),          # npm lockfile
    re.compile(r"pnpm-lock\.yaml$"),             # pnpm lockfile
    re.compile(r"go\.sum$"),                     # go module checksum
    re.compile(r"\.(png|jpg|jpeg|gif|svg|ico|webp)$"),
    re.compile(r"\.(json|csv|md|txt|ya?ml|html|css|scss)$"),
    # yaml and md are covered by their own conventions (frontmatter
    # or top-of-file comment) — the script reads them but does not
    # enforce headers there.
]

# Secret patterns. Match-and-warn (block commit on hit).
SECRET_PATTERNS = [
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS access key ID"),
    (re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"), "private key block"),
    (re.compile(r"ghp_[A-Za-z0-9]{36,}"), "GitHub personal access token"),
    (re.compile(r"github_pat_[A-Za-z0-9_]{82,}"), "GitHub fine-grained PAT"),
    (re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"), "Slack token"),
    (re.compile(r"sk-[A-Za-z0-9]{20,}"), "OpenAI API key"),
    (re.compile(r"sk-ant-[A-Za-z0-9-]{20,}"), "Anthropic API key"),
    (re.compile(r"AIza[0-9A-Za-z_-]{35}"), "Google API key"),
    (re.compile(r"(?i)(?:password|passwd|pwd)\s*[:=]\s*['\"][^'\"\s]{6,}['\"]"), "hardcoded password"),
    (re.compile(r"(?i)bearer\s+[A-Za-z0-9._-]{20,}"), "bearer token"),
]

# Comment-policy tag regexes (must include date + pointer).
TAG_DATE = r"\d{4}-\d{2}-\d{2}"
TAG_POINTER = r"(?:see |refs? )?(?:\S+:\d+|commit [0-9a-f]+|\S+\.\S+)"

# Header signature: looks for @owner / @reviewed (or owner:/last_reviewed:).
HEADER_SIG = re.compile(
    rf"@owner|owner:|@reviewed|last_reviewed:",
    re.MULTILINE,
)

# Comment-style detection per extension.
HEADER_DETECT = {
    ".ts": re.compile(r"/\*\*"),                    # JSDoc /** ... */
    ".tsx": re.compile(r"/\*\*"),
    ".js": re.compile(r"/\*\*"),
    ".jsx": re.compile(r"/\*\*"),
    ".go": re.compile(r"// Package "),              # godoc
    ".py": re.compile(r'"""'),                       # docstring
    ".sh": re.compile(r"#"),                         # shell comment
}

# DISCOVERY/MISTAKE/DRIFT tag lines.
TAG_LINE = re.compile(
    rf"^\s*(?://|#)\s*(DISCOVERY|MISTAKE|DRIFT)\s+({TAG_DATE}).*$",
    re.MULTILINE,
)


def fail(msg: str) -> None:
    print(f"  \033[31mFAIL\033[0m  {msg}", file=sys.stderr)


def warn(msg: str) -> None:
    print(f"  \033[33mWARN\033[0m  {msg}", file=sys.stderr)


def ok(msg: str) -> None:
    print(f"  \033[32mOK  \033[0m  {msg}")


def header(title: str) -> None:
    print(f"\n\033[1m{title}\033[0m")


def staged_files() -> list[Path]:
    """Return list of staged files (added/modified/copied)."""
    out = subprocess.check_output(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
        cwd=str(REPO_ROOT),
        text=True,
    )
    return [REPO_ROOT / p for p in out.splitlines() if p]


def is_header_exempt(path: Path) -> bool:
    return any(p.search(str(path)) for p in HEADER_EXEMPT_PATTERNS)


def check_yaml(files: list[Path]) -> int:
    header("[1/5] YAML validity")
    errors = 0
    yaml_files = [f for f in files if f.suffix in {".yml", ".yaml"} and f.exists()]
    if not yaml_files:
        ok("no yaml files staged")
        return 0
    try:
        import yaml
    except ImportError:
        warn("pyyaml not installed; skipping yaml validation")
        return 0
    for f in yaml_files:
        try:
            with f.open() as fh:
                yaml.safe_load(fh)
            ok(f"{f.relative_to(REPO_ROOT)}")
        except yaml.YAMLError as e:
            fail(f"{f.relative_to(REPO_ROOT)}: {e}")
            errors += 1
    return errors


def check_secrets(files: list[Path]) -> int:
    header("[2/5] Secrets scan")
    errors = 0
    candidates = [f for f in files if f.exists() and f.suffix not in {".png", ".jpg", ".gif", ".ico"}]
    for f in candidates:
        try:
            content = f.read_text(errors="ignore")
        except (UnicodeDecodeError, OSError):
            continue
        for pat, label in SECRET_PATTERNS:
            if pat.search(content):
                fail(f"{f.relative_to(REPO_ROOT)}: {label} matched")
                errors += 1
    if errors == 0:
        ok("no secrets detected")
    return errors


def check_comments(files: list[Path]) -> int:
    header("[3/5] Comment policy")
    errors = 0

    # 3a. Every source file has a header.
    source_files = [
        f for f in files
        if f.exists() and f.suffix in SOURCE_EXTENSIONS and not is_header_exempt(f)
    ]
    for f in source_files:
        try:
            content = f.read_text(errors="ignore")
        except (UnicodeDecodeError, OSError):
            continue
        if not HEADER_SIG.search(content):
            fail(f"{f.relative_to(REPO_ROOT)}: missing comment header (need @owner + @reviewed)")
            errors += 1
        else:
            ok(f"{f.relative_to(REPO_ROOT)}")

    # 3b. DISCOVERY/MISTAKE/DRIFT tags must include date + pointer.
    tag_files = [
        f for f in files
        if f.exists() and f.suffix in SOURCE_EXTENSIONS.union({".md"})
    ]
    for f in tag_files:
        try:
            content = f.read_text(errors="ignore")
        except (UnicodeDecodeError, OSError):
            continue
        for m in TAG_LINE.finditer(content):
            line = m.group(0).strip()
            tag = m.group(1)
            date = m.group(2)
            after = content[m.end():m.start() + 400]
            if not re.search(TAG_POINTER, after):
                fail(
                    f"{f.relative_to(REPO_ROOT)}: {tag} {date} missing pointer "
                    f"(file:line, commit, or doc ref)"
                )
                errors += 1
    return errors


def check_types(files: list[Path]) -> int:
    header("[4/5] Type check (tsc)")
    ts_files = [f for f in files if f.exists() and f.suffix in {".ts", ".tsx"}]
    if not ts_files:
        ok("no TS files staged")
        return 0
    frontend_dir = REPO_ROOT / "frontend"
    if not (frontend_dir / "tsconfig.json").exists():
        warn("frontend/tsconfig.json missing; skipping tsc")
        return 0
    result = subprocess.run(
        ["npx", "--no-install", "tsc", "--noEmit", "-p", "tsconfig.app.json"],
        cwd=frontend_dir,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        fail("tsc --noEmit reported errors:")
        print(result.stdout, file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        return 1
    ok("tsc clean")
    return 0


def check_unit_tests(files: list[Path]) -> int:
    header("[5/5] Unit tests")
    ts_files = [f for f in files if f.exists() and f.suffix in {".ts", ".tsx"}]
    if not ts_files:
        ok("no TS files staged")
        return 0
    frontend_dir = REPO_ROOT / "frontend"
    pkg = frontend_dir / "package.json"
    if not pkg.exists():
        warn("frontend/package.json missing; skipping unit tests")
        return 0
    has_vitest = subprocess.run(
        ["grep", "-l", "vitest", str(pkg)],
        capture_output=True,
    ).returncode == 0
    if not has_vitest:
        warn("vitest not in frontend/package.json; skipping unit tests (add later)")
        return 0
    # Run vitest only on changed files' related specs.
    result = subprocess.run(
        ["npx", "--no-install", "vitest", "run", "--reporter=dot"],
        cwd=frontend_dir,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        fail("vitest reported failures:")
        print(result.stdout, file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        return 1
    ok("vitest clean")
    return 0


def main() -> int:
    files = staged_files()
    if not files:
        print("No staged files — nothing to check.")
        return 0

    print(f"Checking {len(files)} staged file(s)")

    total_errors = 0
    total_errors += check_yaml(files)
    total_errors += check_secrets(files)
    total_errors += check_comments(files)
    total_errors += check_types(files)
    total_errors += check_unit_tests(files)

    print()
    if total_errors > 0:
        print(f"\033[31m{total_errors} check(s) failed — commit blocked.\033[0m")
        return 1
    print("\033[32mAll pre-commit checks passed.\033[0m")
    return 0


if __name__ == "__main__":
    sys.exit(main())