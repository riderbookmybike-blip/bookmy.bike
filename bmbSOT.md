# BookMyBike — Source of Truth (SOT) & AI Development Protocol

This document serves as the absolute Source of Truth and operational rulebook for the `bookmy.bike` project. 
**ALL AI ASSISTANTS MUST READ this document at the start of EVERY new session.**

## 1. Pre-Flight Checklist (Start of Session)
Before writing any new code or starting a new feature, the AI MUST execute the following order of operations:
1. **Check Uncommitted Changes:** Run `git status`. If there are uncommitted files from the previous session, immediately `git commit` them to secure the codebase before starting new work.
2. **Review Pending Tasks:** Ask the user for the current backlog or review existing plans.
3. **Task Prioritization:** Focus on **one prioritized task** at a time.

## 2. Session Guidelines
- **Micro-Sessions:** Each new feature or significant component must be developed in its own isolated session.
- **One Chat, One Focus:** Do not attempt to refactor the entire app in one session unless explicitly requested.

## 3. UI/UX and Theme Strict Rules
- **NO DARK THEME:** By default, never implement, force, or override styles to use dark mode (`dark:bg-xxx` etc.) **UNLESS specifically requested by the user**. Keep the UI light, clean, and consistent.
- **Visual Consistency (Reference First):** 
  - When creating a **new page**, the AI **MUST ASK the user for a reference** to an existing page in the codebase.
  - The new page must perfectly match the layout, padding, typography, and component structures of the referenced page to maintain pixel-perfect consistency across the app.

## 4. Anti-Hallucination & Code Integrity
- **Read Before Write:** Do not guess variable names, file paths, or environment variables. Always use `grep_search` or `view_file` to verify existing code before referencing it.
- **No Dummy Data Without Warning:** If a placeholder or dummy ID is needed, explicitly tell the user. Do not inject fabricated Supabase Project IDs or API keys into actual codebase files.

## 5. Daily Cleanup & Optimization
- **Garbage Collection:** As features evolve rapidly, old unused code, redundant logs, commented-out blocks, or unused Tailwind classes accumulate. Every session should routinely check for and safely remove the "garbage" generated.
- **Optimization:** Refactor long files into smaller components where logical. Ensure Database queries are optimized and not unnecessarily duplicating fetches.

## 6. Commit and Push Protocol
- **When to Commit:** As soon as a logical component or feature works perfectly, **commit it**. This creates a safe restore point.
- **Do NOT Auto-Push:** Commit frequently, but leave `git push` to the user or do it only when explicitly requested at the end of a session.

## 7. AI-Specific Guardrails & Architecture Rules
To prevent compounding errors and maintain a highly scalable codebase, all AI agents must adhere to these technical constraints:
- **No `any` Types:** When creating or modifying TypeScript files, strictly avoid using `any`. Always define explicit interfaces/types for props, DB responses, and state before writing logic.
- **Never Mutate Core Configs Blindly:** Files like `next.config.ts`, `middleware.ts`, and `package.json` must NOT be modified unless the user explicitly requests a configuration change.
- **Additive Database Migrations Only:** Never drop columns or tables. If a schema needs evolution, create an additive migration (e.g., adding a new column) and phase out the old one. Destructive migrations break production.
- **Strict Environment Hygiene:** Never assume an environment variable exists. Always verify `.env.local` first. Provide safe fallbacks or clear server-side logging (`console.error('[Action Name] Missing ENV_VAR')`) instead of causing silent 500 crashes.
- **Console Log Discipline:** Do NOT leave `console.log` statements inside React render methods or UI loops. Use tracking logs strictly inside Server Actions or API routes, and always prefix them with the exact module name (e.g., `console.error('[QuoteEditor] Failed...')`) for easy upstream debugging.
- **Mandatory Pre-Commit Checks:** Before committing any logic, ALWAYS run `npm run typecheck` or `eslint` via background terminal to verify that no "hallucinated" properties or missing imports will break the deployment build.

---
*By reading this document, the AI acknowledges and binds itself to these operating procedures for the duration of the development session.*
