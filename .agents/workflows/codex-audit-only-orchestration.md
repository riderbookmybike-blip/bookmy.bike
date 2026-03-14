# Codex Audit-Only Orchestration (with Antigravity + Claude Sonnet)

## Role Contract
- Codex role: `DIRECTOR / MONITOR / AUDITOR` only.
- Antigravity role: `IMPLEMENTATION` only.
- Codex does **not** write product code unless user explicitly gives override keyword:
  - `CODEX_OVERRIDE_IMPLEMENT`

## Mandatory sequence per task
1. Requirement decode (Codex)
2. Plan draft (Codex, simple Hindi + page-wise details)
3. Plan review by Claude Sonnet
4. Plan update with review findings (Codex)
5. Task-by-task implementation assignment to Antigravity
6. Antigravity implementation report + diff summary
7. Codex audit (claims check, logic check, test check, risk check)
8. Approve / reject with exact fixes

## Required artifacts
- `plan.md` (latest approved plan)
- `reports/<task>_audit.md` (Codex audit output)
- `reports/<task>_impl.md` (Antigravity implementation output)

## Handoff prompt template (Codex -> Antigravity)
```text
Task: <name>
Scope: <exact files>
Do not touch: <protected files>
Acceptance checks:
1) ...
2) ...
3) ...
Output required:
- changed files list
- why each change
- test commands + result
```

## Plan review prompt template (Codex -> Claude Sonnet)
```text
Review this implementation plan as strict auditor.
Check for: missing edge-cases, drift risk, source-of-truth violations,
insufficient tests, rollout risk, rollback plan.
Return:
1) findings by severity
2) what to change in plan
3) go/no-go
```

## Automation guards
- Pre-commit `verify-agent-role.sh` enforces `codex = audit-only` commit policy.
- Pre-commit `verify-agent-locks.sh` enforces lock owner parity.
