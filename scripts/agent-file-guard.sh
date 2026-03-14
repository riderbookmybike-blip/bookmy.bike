#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'USAGE'
Usage:
  scripts/agent-file-guard.sh claim   <agent> <file...> [--force]
  scripts/agent-file-guard.sh check   <agent> <file...>
  scripts/agent-file-guard.sh release <agent> <file...> [--force]
  scripts/agent-file-guard.sh release <agent> --all [--force]
  scripts/agent-file-guard.sh list

Flow (recommended):
  1) claim -> 2) check -> 3) edit -> 4) release
USAGE
}

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
LOCK_ROOT="$REPO_ROOT/.agents/locks"

now_utc() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

normalize_path() {
    local input="$1"
    local abs
    if [[ "$input" = /* ]]; then
        abs="$input"
    else
        abs="$PWD/$input"
    fi

    local dir
    local base
    dir="$(dirname "$abs")"
    base="$(basename "$abs")"

    if [[ -d "$dir" ]]; then
        abs="$(cd "$dir" && pwd)/$base"
    fi

    if [[ "$abs" == "$REPO_ROOT/"* ]]; then
        echo "${abs#$REPO_ROOT/}"
    else
        echo "$input"
    fi
}

lock_file_for() {
    local rel="$1"
    echo "$LOCK_ROOT/${rel}.lock"
}

lock_owner() {
    local lock_file="$1"
    grep -E '^agent=' "$lock_file" | head -n1 | cut -d'=' -f2-
}

is_dirty() {
    local rel="$1"
    [[ -n "$(git status --porcelain -- "$rel")" ]]
}

claim_one() {
    local agent="$1"
    local rel="$2"
    local force="$3"
    local lock_file
    lock_file="$(lock_file_for "$rel")"

    if [[ -f "$lock_file" ]]; then
        local owner
        owner="$(lock_owner "$lock_file")"
        if [[ "$owner" != "$agent" ]]; then
            echo "BLOCKED: $rel is already claimed by '$owner'"
            return 1
        fi
    else
        if is_dirty "$rel" && [[ "$force" != "1" ]]; then
            echo "BLOCKED: $rel has local changes but no claim lock. Inspect first or use --force."
            return 1
        fi
    fi

    mkdir -p "$(dirname "$lock_file")"
    {
        echo "agent=$agent"
        echo "timestamp=$(now_utc)"
        echo "user=${USER:-unknown}"
        echo "host=$(hostname 2>/dev/null || echo unknown)"
        echo "pid=$$"
        echo "path=$rel"
    } >"$lock_file"

    echo "CLAIMED: $rel"
}

check_one() {
    local agent="$1"
    local rel="$2"
    local lock_file
    lock_file="$(lock_file_for "$rel")"

    if [[ -f "$lock_file" ]]; then
        local owner
        owner="$(lock_owner "$lock_file")"
        if [[ "$owner" != "$agent" ]]; then
            echo "BLOCKED: $rel is claimed by '$owner'"
            return 1
        fi
    fi

    if is_dirty "$rel"; then
        if [[ ! -f "$lock_file" ]]; then
            echo "BLOCKED: $rel is dirty and unclaimed"
            return 1
        fi
        local owner
        owner="$(lock_owner "$lock_file")"
        if [[ "$owner" != "$agent" ]]; then
            echo "BLOCKED: $rel is dirty and lock owner is '$owner'"
            return 1
        fi
    fi

    if [[ -f "$lock_file" ]]; then
        echo "OK: $rel (claimed by $agent)"
    else
        echo "WARN: $rel has no lock (still clean)"
    fi
}

release_one() {
    local agent="$1"
    local rel="$2"
    local force="$3"
    local lock_file
    lock_file="$(lock_file_for "$rel")"

    if [[ ! -f "$lock_file" ]]; then
        echo "SKIP: no lock for $rel"
        return 0
    fi

    local owner
    owner="$(lock_owner "$lock_file")"
    if [[ "$owner" != "$agent" && "$force" != "1" ]]; then
        echo "BLOCKED: cannot release $rel, owned by '$owner'"
        return 1
    fi

    rm -f "$lock_file"
    echo "RELEASED: $rel"
}

release_all_owned() {
    local agent="$1"
    local force="$2"

    if [[ ! -d "$LOCK_ROOT" ]]; then
        echo "No lock directory"
        return 0
    fi

    local had=0
    while IFS= read -r lock_file; do
        [[ -z "$lock_file" ]] && continue
        had=1
        local owner
        owner="$(lock_owner "$lock_file")"
        if [[ "$owner" == "$agent" || "$force" == "1" ]]; then
            rm -f "$lock_file"
            echo "RELEASED: ${lock_file#$LOCK_ROOT/}"
        fi
    done < <(find "$LOCK_ROOT" -type f -name '*.lock' 2>/dev/null | sort)

    if [[ "$had" -eq 0 ]]; then
        echo "No locks found"
    fi
}

list_locks() {
    if [[ ! -d "$LOCK_ROOT" ]]; then
        echo "No locks"
        return 0
    fi

    local count=0
    while IFS= read -r lock_file; do
        [[ -z "$lock_file" ]] && continue
        count=$((count + 1))
        local owner
        local ts
        local path
        owner="$(grep -E '^agent=' "$lock_file" | head -n1 | cut -d'=' -f2-)"
        ts="$(grep -E '^timestamp=' "$lock_file" | head -n1 | cut -d'=' -f2-)"
        path="$(grep -E '^path=' "$lock_file" | head -n1 | cut -d'=' -f2-)"
        echo "$count. agent=$owner | time=$ts | path=$path"
    done < <(find "$LOCK_ROOT" -type f -name '*.lock' 2>/dev/null | sort)

    if [[ "$count" -eq 0 ]]; then
        echo "No locks"
    fi
}

cmd="${1:-}"
if [[ -z "$cmd" ]]; then
    usage
    exit 1
fi

case "$cmd" in
claim)
    shift
    agent="${1:-}"
    [[ -z "$agent" ]] && { usage; exit 1; }
    shift
    force=0
    files=()
    for arg in "$@"; do
        if [[ "$arg" == "--force" ]]; then
            force=1
        else
            files+=("$arg")
        fi
    done
    [[ ${#files[@]} -eq 0 ]] && { usage; exit 1; }

    rc=0
    for f in "${files[@]}"; do
        rel="$(normalize_path "$f")"
        claim_one "$agent" "$rel" "$force" || rc=1
    done
    exit $rc
    ;;
check)
    shift
    agent="${1:-}"
    [[ -z "$agent" ]] && { usage; exit 1; }
    shift
    [[ $# -eq 0 ]] && { usage; exit 1; }

    rc=0
    for f in "$@"; do
        rel="$(normalize_path "$f")"
        check_one "$agent" "$rel" || rc=1
    done
    exit $rc
    ;;
release)
    shift
    agent="${1:-}"
    [[ -z "$agent" ]] && { usage; exit 1; }
    shift

    force=0
    files=()
    for arg in "$@"; do
        if [[ "$arg" == "--force" ]]; then
            force=1
        else
            files+=("$arg")
        fi
    done

    if [[ ${#files[@]} -eq 1 && "${files[0]}" == "--all" ]]; then
        release_all_owned "$agent" "$force"
        exit 0
    fi

    [[ ${#files[@]} -eq 0 ]] && { usage; exit 1; }

    rc=0
    for f in "${files[@]}"; do
        rel="$(normalize_path "$f")"
        release_one "$agent" "$rel" "$force" || rc=1
    done
    exit $rc
    ;;
list)
    list_locks
    ;;
*)
    usage
    exit 1
    ;;
esac
