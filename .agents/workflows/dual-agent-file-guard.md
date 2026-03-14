# Dual-Agent File Guard (Codex + Antigravity)

Goal: same file par parallel overwrite avoid karna.

## Mandatory env

Set agent identity in shell:

```bash
export AGENT_NAME=codex
# or
export AGENT_NAME=antigravity
```

Pre-commit now runs two automatic checks:
1. `verify-agent-role.sh` (role policy)
2. `verify-agent-locks.sh` (lock ownership)

Role policy:
- `codex` -> audit-only commits (docs/plans/reports only)
- `antigravity` -> implementation commits

Lock check auto-verifies ownership for all staged files.
If any staged file is unclaimed or owned by other agent, commit is blocked.

## Commands

List active locks:

```bash
scripts/agent-file-guard.sh list
```

Claim files before edit:

```bash
scripts/agent-file-guard.sh claim codex path/to/file1 path/to/file2
scripts/agent-file-guard.sh claim antigravity path/to/file1
```

Check safety before touching:

```bash
scripts/agent-file-guard.sh check codex path/to/file1
```

Release after work:

```bash
scripts/agent-file-guard.sh release codex path/to/file1 path/to/file2
```

Release all your locks:

```bash
scripts/agent-file-guard.sh release codex --all
```

## Recommended flow

1. `claim`
2. `check`
3. edit + test
4. commit
5. `release`

## Notes

- Lock files are stored under `.agents/locks/`.
- If file already dirty and unclaimed, `claim` blocks by default.
- Use `--force` only when intentionally taking ownership.
- Emergency bypass (not recommended):
  - `SKIP_AGENT_LOCK_CHECK=1 git commit -m \"...\"`
