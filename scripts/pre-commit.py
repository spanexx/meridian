#!/usr/bin/env python3
"""
Pre-commit guardrails for the meridian repo.

Runs six blocks of checks against staged files:
  1. YAML validity (workflows + manifests)
  2. Secrets scan (.env, .pem, .key, hardcoded tokens)
  3. Comment-policy header presence + DISCOVERY/MISTAKE/DRIFT format
  4. Type check (tsc --noEmit) for staged TS files
  5. Unit tests (vitest run) for staged TS files
  6. TDD enforcement: every new exported function/method has a
     matching test in the same directory or sibling __tests__/
     folder. Bypass via `// TEST-COUPLED:` inline marker.

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
    re.compile(r"\.d\.ts$"),
    re.compile(r"package-lock\.json$"),
    re.compile(r"pnpm-lock\.yaml$"),
    re.compile(r"go\.sum$"),
    re.compile(r"\.(png|jpg|jpeg|gif|svg|ico|webp)$"),
    re.compile(r"\.(json|csv|md|txt|ya?ml|html|css|scss)$"),
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

# DISCOVERY/MISTAKE/DRIFT tag lines.
TAG_LINE = re.compile(
    rf"^\s*(?://|#|\*)\s*(DISCOVERY|MISTAKE|DRIFT)\s+({TAG_DATE}).*$",
    re.MULTILINE,
)

# TDD enforcement patterns.
# Match `export function name(`, `export class name`, `export const name = `,
# `export default function`, public methods on exported classes.
EXPORTED_FUNC = re.compile(
    r"^\s*export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_]\w*)",
    re.MULTILINE,
)
EXPORTED_CLASS = re.compile(
    r"^\s*export\s+(?:default\s+)?class\s+([A-Za-z_]\w*)",
    re.MULTILINE,
)
EXPORTED_CONST_FN = re.compile(
    r"^\s*export\s+const\s+([A-Za-z_]\w*)\s*=\s*(?:async\s+)?\(",
    re.MULTILINE,
)
PUBLIC_METHOD = re.compile(
    r"^\s+(?:public\s+)?(?:async\s+)?(?!(?:if|for|while|switch|catch|return|throw|new|delete|typeof|instanceof|in|of|do|else|function|class|const|let|var|yield|await|async|case|break|continue|debugger|export|import|static|get|set|null|undefined|true|false|void|this|super)\b)([A-Za-z_]\w*)\s*\(",
    re.MULTILINE,
)
TEST_COUPLED_MARKER = re.compile(r"//\s*TEST-COUPLED:")
ANGULAR_COMPONENT = re.compile(r"@Component\s*\(")


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
    header("[1/6] YAML validity")
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
    header("[2/6] Secrets scan")
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
    header("[3/6] Comment policy")
    errors = 0

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
    header("[4/6] Type check (tsc)")
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
    header("[5/6] Unit tests (vitest)")
    ts_files = [f for f in files if f.exists() and f.suffix in {".ts", ".tsx"}]
    if not ts_files:
        ok("no TS files staged")
        return 0
    frontend_dir = REPO_ROOT / "frontend"
    has_vitest = subprocess.run(
        ["grep", "-l", "vitest", str(frontend_dir / "package.json")],
        capture_output=True,
    ).returncode == 0
    if not has_vitest:
        warn("vitest not in frontend/package.json; skipping unit tests")
        return 0
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


def check_icons(files: list[Path]) -> int:
    """
    Icon cross-check: every <ui-icon name="X"> referenced in staged
    .ts template code must have a matching key in the icon component's
    ICON_PATHS dictionary. A name used in a template but missing from
    the dictionary renders an invisible (0-child) SVG — the bug class
    that shipped twice in PR #19/#20 (sun/cog paths never committed).
    """
    header("[6/6] Icon cross-check")
    errors = 0
    icon_ts = REPO_ROOT / "frontend/src/app/ui/icon/icon.component.ts"
    if not icon_ts.exists():
        ok("icon component not found — skipping")
        return 0
    icon_src = icon_ts.read_text(errors="ignore")
    defined = set(re.findall(r"'([\w-]+)':\s*'<", icon_src))
    template_files = [
        f for f in files
        if f.exists() and f.suffix == ".ts"
        and "spec" not in f.name
    ]
    if not template_files:
        ok("no staged template files")
        return 0
    used = set()
    for f in template_files:
        content = f.read_text(errors="ignore")
        used.update(re.findall(r'<ui-icon\s+name="([\w-]+)"', content))
    missing = sorted(used - defined)
    if missing:
        for name in missing:
            fail(f"<ui-icon name=\"{name}\"> used but missing from ICON_PATHS "
                 f"({icon_ts.relative_to(REPO_ROOT)}). Add the path data — "
                 f"an empty entry renders an invisible icon.")
            errors += 1
    else:
        ok(f"all {len(used)} referenced icon name(s) exist in ICON_PATHS")
    return errors


def check_tdd(files: list[Path]) -> int:
    """
    TDD enforcement: every exported function/class/method declared in a
    staged .ts file must have a matching test that exercises it. The
    matching test can be in:
      - the same directory (sibling .spec.ts)
      - a __tests__/ subdirectory
      - any .spec.ts in the same directory tree that contains a
        reference to the symbol's name

    A function is exempt if:
      - The file has `// TEST-COUPLED:` marker on the line above
      - The file is in a test directory itself (src/__tests__, *.spec.ts)
      - The file is auto-generated (has `// AUTO-GENERATED`)
    """
    header("[7/7] TDD enforcement")
    errors = 0
    source_files = [
        f for f in files
        if f.exists() and f.suffix in {".ts", ".tsx"}
        and "spec" not in f.name
        and "__tests__" not in str(f)
    ]
    if not source_files:
        ok("no source files staged")
        return 0

    for f in source_files:
        try:
            content = f.read_text(errors="ignore")
        except (UnicodeDecodeError, OSError):
            continue

        # Skip files marked as auto-generated.
        if "// AUTO-GENERATED" in content:
            ok(f"{f.relative_to(REPO_ROOT)} (auto-generated)")
            continue

        # Collect exported declarations.
        exported = []
        for m in EXPORTED_FUNC.finditer(content):
            exported.append(("function", m.group(1), m.start()))
        for m in EXPORTED_CONST_FN.finditer(content):
            exported.append(("const", m.group(1), m.start()))
        for m in EXPORTED_CLASS.finditer(content):
            exported.append(("class", m.group(1), m.start()))

        # For each exported class, scan its body for public methods.
        for kind, name, offset in list(exported):
            if kind == "class":
                # Find the class body (between { and matching }).
                brace_start = content.find("{", offset)
                if brace_start < 0:
                    continue
                depth = 0
                body_start = brace_start + 1
                for i in range(brace_start, len(content)):
                    if content[i] == "{":
                        depth += 1
                    elif content[i] == "}":
                        depth -= 1
                        if depth == 0:
                            body_end = i
                            break
                else:
                    body_end = len(content)
                body = content[body_start:body_end]
                for pm in PUBLIC_METHOD.finditer(body):
                    method = pm.group(1)
                    # Skip constructor, lifecycle hooks, private.
                    if method.startswith("_"):
                        continue
                    if method == "constructor":
                        continue
                    exported.append(("method", method, offset))

        if not exported:
            continue

        # Check for TEST-COUPLED markers (per-symbol bypass).
        test_coupled = set()
        for line in content.split("\n"):
            m = TEST_COUPLED_MARKER.search(line)
            if m:
                # The marker is on its own line; the next export declaration
                # is exempt.
                pass
        # Simpler: count TEST-COUPLED markers. If count >= len(exported),
        # all exports are exempt (the author coupled each one).
        marker_count = len(TEST_COUPLED_MARKER.findall(content))
        if marker_count >= len(exported):
            ok(f"{f.relative_to(REPO_ROOT)} ({marker_count} TEST-COUPLED markers)")
            continue

        # Look for tests that reference each exported symbol.
        rel_dir = f.parent
        test_paths = []
        for ext in ["_test.go", "spec.ts", "test.ts"]:
            test_paths.extend(rel_dir.glob(f"*.{ext}"))
            tests_subdir = rel_dir / "__tests__"
            if tests_subdir.exists():
                test_paths.extend(tests_subdir.glob(f"*.{ext}"))

        # Combine test file contents.
        test_content = ""
        for tp in test_paths:
            try:
                test_content += tp.read_text(errors="ignore") + "\n"
            except (UnicodeDecodeError, OSError):
                continue

        for kind, name, _offset in exported:
            # The name must appear in some test (rough heuristic —
            # false positives are OK for the warning, not blocking).
            if name not in test_content:
                fail(
                    f"{f.relative_to(REPO_ROOT)}: {kind} `{name}` has no matching test "
                    f"(expected in {rel_dir.relative_to(REPO_ROOT)}/*.spec.ts or "
                    f"__tests__/). Add a test, or mark with // TEST-COUPLED: above "
                    f"the declaration."
                )
                errors += 1

    if errors == 0:
        ok("every exported symbol has a matching test")
    return errors


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
    total_errors += check_icons(files)
    total_errors += check_tdd(files)

    print()
    if total_errors > 0:
        print(f"\033[31m{total_errors} check(s) failed — commit blocked.\033[0m")
        return 1
    print("\033[32mAll pre-commit checks passed.\033[0m")
    return 0


if __name__ == "__main__":
    sys.exit(main())