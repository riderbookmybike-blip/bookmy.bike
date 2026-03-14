#!/usr/bin/env bash
set -euo pipefail

# Hard gate for dual-agent safety:
# Every staged file must be claimed by current AGENT_NAME.
#
# Escape hatch (intentional):
#   SKIP_AGENT_LOCK_CHECK=1 git commit -m "..."

if [[ "${SKIP_AGENT_LOCK_CHECK:-0}" == "1" ]]; then
    exit 0
fi

AGENT_NAME="${AGENT_NAME:-}"
if [[ -z "$AGENT_NAME" ]]; then
    cat <<'EOF'
[agent-lock] BLOCKED: AGENT_NAME is not set.
Set it before commit:
  export AGENT_NAME=codex
or
  export AGENT_NAME=antigravity

Temporary bypass (not recommended):
  SKIP_AGENT_LOCK_CHECK=1 git commit -m "..."
EOF
    exit 1
fi

ROOT="$(git rev-parse --show-toplevel)"
LOCK_ROOT="$ROOT/.agents/locks"

if [[ ! -d "$LOCK_ROOT" ]]; then
    echo "[agent-lock] BLOCKED: lock directory missing at .agents/locks"
    echo "Run claim first:"
    echo "  scripts/agent-file-guard.sh claim $AGENT_NAME <file...>"
    exit 1
fi

staged_count=0
blocked=0

while IFS= read -r -d '' file; do
    staged_count=$((staged_count + 1))
    lock_file="$LOCK_ROOT/${file}.lock"

    if [[ ! -f "$lock_file" ]]; then
        echo "[agent-lock] BLOCKED: $file is staged but unclaimed"
        echo "  claim with: scripts/agent-file-guard.sh claim $AGENT_NAME \"$file\""
        blocked=1
        continue
    fi

    owner="$(awk -F= '/^agent=/{print $2; exit}' "$lock_file")"
    if [[ -z "$owner" ]]; then
        echo "[agent-lock] BLOCKED: $file has invalid lock metadata"
        blocked=1
        continue
    fi

    if [[ "$owner" != "$AGENT_NAME" ]]; then
        echo "[agent-lock] BLOCKED: $file lock owner is '$owner', current agent is '$AGENT_NAME'"
        blocked=1
        continue
    fi
done < <(git diff --cached --name-only -z --diff-filter=ACMR)

if [[ "$staged_count" -eq 0 ]]; then
    exit 0
fi

if [[ "$blocked" -ne 0 ]]; then
    cat <<'EOF'
[agent-lock] Commit blocked to avoid cross-agent overwrite.
Fix:
  1) claim files
  2) commit again
EOF
    exit 1
fi

echo "[agent-lock] OK: all staged files are claimed by '$AGENT_NAME'"

