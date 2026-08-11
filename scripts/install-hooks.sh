#!/usr/bin/env bash
#
# Install local git hooks for the meridian repo.
#
# Wires .git/hooks/pre-commit to scripts/pre-commit.py so every commit
# runs the 5-block guardrail check (yaml, secrets, comments, tsc,
# unit tests). Idempotent: re-running overwrites the hook safely.
#
# @owner   spanexx
# @reviewed 2026-08-11
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK_FILE="$REPO_ROOT/.git/hooks/pre-commit"
SCRIPT="$REPO_ROOT/scripts/pre-commit.py"

if [[ ! -d "$REPO_ROOT/.git" ]]; then
  echo "Not a git repo: $REPO_ROOT" >&2
  exit 1
fi

if [[ ! -f "$SCRIPT" ]]; then
  echo "Missing $SCRIPT" >&2
  exit 1
fi

cat > "$HOOK_FILE" <<EOF
#!/usr/bin/env bash
#
# Auto-installed by scripts/install-hooks.sh. Do not edit directly —
# re-run scripts/install-hooks.sh to regenerate.
#
exec python3 "$SCRIPT" "\$@"
EOF
chmod +x "$HOOK_FILE"

echo "Installed pre-commit hook → $HOOK_FILE"
echo "Re-run scripts/install-hooks.sh to update."