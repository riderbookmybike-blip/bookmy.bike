# Honda Activa Mapping Audit

Date: 2026-02-10

## Scope
Hierarchy levels checked: `Category -> Brand -> Product(Family) -> Variant -> Unit(Color Def) -> SKU`

Brand: HONDA (`dc9d5b00-f90a-4fd5-ada8-304c765af91d`)
Family: Activa (`5a4bf7b6-6c11-4942-bba6-a185fd5b4bf3`)

## Summary
- Family count: 1
- Variant count: 3 (Deluxe, Smart, Standard)
- Unit (Color Def) count: 0
- SKU count: 18
- SKU code missing: 18/18
- Price base missing: 0/18

## Findings
1. **Unit level missing**
   - No `COLOR_DEF` items exist for Activa variants.
   - All 18 SKUs are directly parented to variants, which bypasses the Unit level.

2. **SKU codes not set**
   - All Activa SKUs have `sku_code = NULL`.

## Variants and SKUs (current state)
### Deluxe (`74e99c9f-e03e-4eae-9092-283965a209a8`)
- Deluxe Decent Blue Metallic
- Deluxe Mat Axis Gray Metallic
- Deluxe Pearl Igneous Black
- Deluxe Pearl Precious White
- Deluxe Pearl Siren Blue
- Deluxe Rebel Red Metallic

### Smart (`ac334bca-a2ed-4b30-b957-c910cc5e4120`)
- Smart Decent Blue Metallic
- Smart Mat Axis Gray Metallic
- Smart Pearl Igneous Black
- Smart Pearl Precious White
- Smart Pearl Siren Blue
- Smart Rebel Red Metallic

### Standard (`31eb82e9-df94-46f4-acd6-3ecb3a8a8d25`)
- Standard Decent Blue Metallic
- Standard Mat Axis Gray Metallic
- Standard Pearl Igneous Black
- Standard Pearl Precious White
- Standard Pearl Siren Blue
- Standard Rebel Red Metallic

## Suggested Fix (next actions)
1. **Create Unit/Color Def items** per variant (6 colors each).
2. **Re-parent SKUs** to their corresponding Color Def items.
3. **Assign `sku_code`** using agreed naming convention (e.g., `HON-ACT-STD-DECENT-BLUE`), or match existing business rules.

## SQL Notes (for reference)
- Families: `type='FAMILY' and brand_id='dc9d5b00-f90a-4fd5-ada8-304c765af91d' and name/slug like 'activa'`
- Variants: `type='VARIANT' and parent_id='5a4bf7b6-6c11-4942-bba6-a185fd5b4bf3'`
- Color Def: `type='COLOR_DEF' and parent_id in (variant ids)`
- SKUs: `type='SKU' and parent_id in (variant ids)`
