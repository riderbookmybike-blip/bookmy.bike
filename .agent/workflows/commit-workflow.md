---
description: Git commit workflow - when and how to commit changes
---

# Commit Workflow

## Rules

1. **Auto-commit** after every logical change (fix, feature, refactor)
2. **DO NOT push** unless user explicitly asks
3. **Commit message format**: `type: short description`

## Commit Types

| Type | When to Use |
|------|-------------|
| `fix:` | Bug fixes |
| `feat:` | New features |
| `refactor:` | Code restructuring |
| `style:` | Formatting, no logic change |
| `docs:` | Documentation only |
| `chore:` | Build, config, deps |

## When to Commit

- ✅ Single file fix complete
- ✅ Related multi-file change complete
- ✅ Before switching to different work
- ❌ Mid-change with broken code

## Command

```bash
// turbo
git add -A && git commit -m "type: description"
```

## Push (Only on Request)

```bash
git push origin main
```
