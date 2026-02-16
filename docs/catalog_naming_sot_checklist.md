# Catalog Naming SOT Checklist

Use this checklist in every DB/code/UI PR touching catalog.

## Canonical Terms (must use)
- `Brand`
- `Model`
- `Variant`
- `SKU`
- `Suitable For`

## Banned Aliases (must not use)
- `Product` (use `Model`)
- `Family` (use `Model`)
- `Plan` / `Tier` as hierarchy names (use `Variant` / `SKU`)
- `Fitment` / `Compatibility` (use `Suitable For`)
- `Unit` / `Sub-Variant` / `Colour` as hierarchy names (use `SKU`)

## PR Review Checks
- [ ] DB tables/columns/functions use canonical names only.
- [ ] SQL comments/docs do not introduce banned aliases.
- [ ] TypeScript types/interfaces use canonical names only.
- [ ] UI labels/headers/buttons use canonical names only.
- [ ] API payload keys and response keys use canonical names only.
- [ ] Search complete for banned terms in changed files.

## Quick Search Commands
```bash
rg -n "product|family|plan|tier|fitment|compatibility|unit|sub-variant|colour" src supabase docs .gemini
rg -n "Brand|Model|Variant|SKU|Suitable For" src supabase docs .gemini
```

## Merge Rule
If any banned alias appears in changed scope, block merge until fixed.
