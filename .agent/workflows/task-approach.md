---
description: Standard approach for any task - understand, plan, get approval, then execute
---

# Task Approach Workflow

## ⚠️ MANDATORY: Before Writing ANY Code

### Step 1: Understand & Clarify
- **Rephrase** the task in my own words
- **Ask clarifying questions** if anything is unclear
- **State assumptions** explicitly

### Step 2: Analyze (For Non-Trivial Tasks)
| Pros | Cons |
|------|------|
| ... | ... |

### Step 3: Implementation Plan
- What files will change
- What approach I'll take
- Estimated complexity

### Step 4: Recommendation
> "Main recommend karta hoon [X] approach kyunki [reason]"

### Step 5: Get Approval
**ASK**: "Shall I proceed with this approach?"

### Step 6: Execute (Only After Approval)
- Write code
- Commit after each logical change
- DO NOT push (until asked)

---

## 🐛 Bug Reports - Special Protocol

When user reports a bug:

### 1. Confirm Understanding
```
"Mujhe ye samajh aaya:
- Bug: [what's happening]
- Expected: [what should happen]
- Location: [where in UI/code]
- Repro: [how to reproduce]

Kya ye sahi hai?"
```

### 2. Investigate First
- Check logs/errors
- Find root cause
- Identify affected files

### 3. Explain Before Fixing
```
"Bug ka root cause:
- File: [path]
- Line: [number]
- Issue: [what's wrong]
- Fix: [what I'll change]

Proceed karun?"
```

---

## ❌ What NOT to Do

- Jump straight to coding without understanding
- Assume I know what user means
- Fix "A" when user meant "B"
- Make changes without explaining
- Push without permission

---

## ✅ Quick Tasks (No Formal Approval Needed)

- Typo fixes
- Simple refactors (renaming)
- Adding console.log for debugging
- Viewing/reading files
