# Task: `cat_price_state_mh` Schema Review (Frozen)

## Goal
Define final canonical MH pricing schema with strict, uniform naming so DB + code keys remain identical.

## Naming Freeze (Final)
1. `snake_case` only.
2. GST amount fields always suffix: `_gst_amount`.
3. Totals always suffix: `_total_amount`.
4. Addon pattern always:
- `addon_<name>_amount`
- `addon_<name>_gst_amount`
- `addon_<name>_total_amount`
- `addon_<name>_default`

## Final Column Sequence
1. `id`
2. `sku_id`
3. `state_code`
4. `hsn_code`
5. `gst_rate`
6. `ex_factory`
7. `ex_factory_gst_amount`
8. `logistics_charges`
9. `logistics_charges_gst_amount`
10. `ex_showroom`
11. `rto_default_type`
12. `rto_registration_fee_state`
13. `rto_registration_fee_bh`
14. `rto_registration_fee_company`
15. `rto_smartcard_charges_state`
16. `rto_smartcard_charges_bh`
17. `rto_smartcard_charges_company`
18. `rto_postal_charges_state`
19. `rto_postal_charges_bh`
20. `rto_postal_charges_company`
21. `rto_roadtax_rate_state`
22. `rto_roadtax_rate_bh`
23. `rto_roadtax_rate_company`
24. `rto_roadtax_amount_state`
25. `rto_roadtax_amount_bh`
26. `rto_roadtax_amount_company`
27. `rto_roadtax_cess_rate_state`
28. `rto_roadtax_cess_rate_bh`
29. `rto_roadtax_cess_rate_company`
30. `rto_roadtax_cess_amount_state`
31. `rto_roadtax_cess_amount_bh`
32. `rto_roadtax_cess_amount_company`
33. `rto_total_state`
34. `rto_total_bh`
35. `rto_total_company`
36. `ins_hsn_code`
37. `ins_gst_rate`
38. `ins_own_damage_premium_amount`
39. `ins_own_damage_tenure_years`
40. `ins_own_damage_gst_amount`
41. `ins_own_damage_total_amount`
42. `ins_liability_only_premium_amount`
43. `ins_liability_only_tenure_years`
44. `ins_liability_only_gst_amount`
45. `ins_liability_only_total_amount`
46. `ins_sum_mandatory_insurance`
47. `ins_sum_mandatory_insurance_gst_amount`
48. `ins_gross_premium`
49. `ins_base_total`
50. `ins_gst_total`
51. `ins_net_premium`
52. `ins_total`
53. `ins_pa`  -- temporary backward compatibility
54. `addon_zero_depreciation_amount`
55. `addon_zero_depreciation_gst_amount`
56. `addon_zero_depreciation_total_amount`
57. `addon_zero_depreciation_default`
58. `addon_engine_protector_amount`
59. `addon_engine_protector_gst_amount`
60. `addon_engine_protector_total_amount`
61. `addon_engine_protector_default`
62. `addon_return_to_invoice_amount`
63. `addon_return_to_invoice_gst_amount`
64. `addon_return_to_invoice_total_amount`
65. `addon_return_to_invoice_default`
66. `addon_consumables_cover_amount`
67. `addon_consumables_cover_gst_amount`
68. `addon_consumables_cover_total_amount`
69. `addon_consumables_cover_default`
70. `addon_roadside_assistance_amount`
71. `addon_roadside_assistance_gst_amount`
72. `addon_roadside_assistance_total_amount`
73. `addon_roadside_assistance_default`
74. `addon_key_protect_amount`
75. `addon_key_protect_gst_amount`
76. `addon_key_protect_total_amount`
77. `addon_key_protect_default`
78. `addon_tyre_protect_amount`
79. `addon_tyre_protect_gst_amount`
80. `addon_tyre_protect_total_amount`
81. `addon_tyre_protect_default`
82. `addon_pillion_cover_amount`
83. `addon_pillion_cover_gst_amount`
84. `addon_pillion_cover_total_amount`
85. `addon_pillion_cover_default`
86. `addon_personal_accident_cover_amount`
87. `addon_personal_accident_cover_gst_amount`
88. `addon_personal_accident_cover_total_amount`
89. `addon_personal_accident_cover_default`
90. `on_road_price`
91. `publish_stage`
92. `published_at`
93. `published_by`
94. `is_popular`
95. `created_at`
96. `updated_at`

## Formula Notes
1. `ex_showroom = ex_factory + ex_factory_gst_amount + logistics_charges + logistics_charges_gst_amount`
2. `ins_sum_mandatory_insurance = ins_own_damage_premium_amount + ins_liability_only_premium_amount`
3. `ins_sum_mandatory_insurance_gst_amount = ins_own_damage_gst_amount + ins_liability_only_gst_amount`
4. `ins_gross_premium = ins_sum_mandatory_insurance + ins_sum_mandatory_insurance_gst_amount`
5. `on_road_price = ex_showroom + rto_total_<default_type> + ins_total + sum(default addon totals)`
6. `ex_showroom` is a stored computed field, calculated at pricing publish/write time.

## Review Checklist
1. Confirm all names are frozen exactly as listed.
2. Confirm temporary compatibility field `ins_pa` retained until full code cutover.
3. Confirm legacy insurance summary fields (`ins_base_total`, `ins_gst_total`, `ins_net_premium`, `ins_total`) retained during transition.
