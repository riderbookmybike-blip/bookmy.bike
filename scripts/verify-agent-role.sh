#!/usr/bin/env bash
set -euo pipefail

# Role guard:
# - codex: audit/director mode only (docs/plans/report updates allowed)
# - antigravity: implementation mode (no file-type restrictions here)

if [[ "${SKIP_AGENT_ROLE_CHECK:-0}" == "1" ]]; then
    exit 0
fi

AGENT_NAME="${AGENT_NAME:-}"
if [[ -z "$AGENT_NAME" ]]; then
    cat <<'MSG'
[agent-role] BLOCKED: AGENT_NAME is not set.
Set one of:
  export AGENT_NAME=codex
  export AGENT_NAME=antigravity
MSG
    exit 1
fi

if [[ "$AGENT_NAME" != "codex" ]]; then
    exit 0
fi

# codex can commit only planning/audit docs (not product code)
blocked=0
staged_count=0

is_allowed_for_codex() {
    local file="$1"

    # Markdown anywhere is allowed
    if [[ "$file" == *.md ]]; then
        return 0
    fi

    # Agent workflow and lock metadata are allowed
    if [[ "$file" == .agents/* ]]; then
        return 0
    fi

    # Optional text/json reports are allowed
    if [[ "$file" == reports/* && ( "$file" == *.json || "$file" == *.txt ) ]]; then
        return 0
    fi

    return 1
}

while IFS= read -r -d '' file; do
    staged_count=$((staged_count + 1))
    if ! is_allowed_for_codex "$file"; then
        echo "[agent-role] BLOCKED for codex (audit-only): $file"
        blocked=1
    fi
done < <(git diff --cached --name-only -z --diff-filter=ACMR)

if [[ "$staged_count" -eq 0 ]]; then
    exit 0
fi

if [[ "$blocked" -ne 0 ]]; then
    cat <<'MSG'
[agent-role] Commit blocked.
Codex is in AUDIT_ONLY mode and cannot commit non-doc implementation files.
Use antigravity for code changes.

Emergency bypass (not recommended):
  SKIP_AGENT_ROLE_CHECK=1 git commit -m "..."
MSG
    exit 1
fi

echo "[agent-role] OK: codex staged files comply with audit-only policy"
