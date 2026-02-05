# Protected Files Registry

## How This Works
- Files listed in `LOCKED` section: AI agents MUST NOT modify
- Files listed in `UNLOCKED` section: AI agents CAN modify (owner has granted permission)
- To unlock a file, move it from LOCKED to UNLOCKED section
- After changes are complete, move it back to LOCKED

---

## 🔒 LOCKED (DO NOT MODIFY)

### Core Calculation Engines
```
src/lib/aums/insuranceEngine.ts
src/lib/aums/registrationEngine.ts
```

### Price Publishing System
```
src/actions/publishPrices.ts
```

### Protected Database Tables
```
cat_ins_rules       - Insurance rules (SOT)
cat_reg_rules       - Registration/RTO rules (SOT)
cat_price_state     - Published prices (generated output)
```

---

## 🔓 UNLOCKED (Owner has granted temporary access)

```
(none)
```

---

## Override PIN: `BMB-2026`

When user provides this PIN, agent may modify protected files.
Current session PIN provided: ❌ NO

---

## Governance Rules

1. **All pricing logic changes** must go through AUMS Dashboard UI
2. **No direct code edits** to calculation engines without PIN
3. **Database tables** are read-only for AI agents
4. **publishPrices.ts** generates output from engines - do not modify logic

---

## Last Updated
- 2026-02-06 01:11 IST
- By: Owner (via Gemini)
- Reason: Locked after confirming Simulator = Publisher = DB parity
