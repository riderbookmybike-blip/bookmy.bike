# TVS Raider 125: Specs & Features Mapping (BikeDekho)

This document maps the specifications for the **TVS Raider 125** extracted from BikeDekho, segregating them into **Model (Family)** and **Variant** levels.

## 1. Model Level (Structural & Performance)
These attributes are consistent across all variants and are stored at the Family level in the catalog.

| BikeDekho Key | Standardized Key | Value | Rationale |
| :--- | :--- | :--- | :--- |
| Displacement | `engine_cc` | 124.8 cc | Core engine spec. |
| Max Power | `max_power` | 11.38 PS @ 7500 rpm | Performance baseline. |
| Max Torque | `max_torque` | 11.2 Nm @ 6000 rpm | Performance baseline. |
| Fuel Capacity | `fuel_capacity` | 10 Litres | Same tank across all. |
| Engine Type | `engine_type` | Single Cylinder, 3 Valve, Oil Cooled | Structural engine design. |
| Bore x Stroke | `bore_stroke` | 53.5 x 55.5 mm | Structural engine dimensions. |
| Compression Ratio | `compression_ratio` | 10.0:1 | Thermodynamic property. |
| Cooling System | `cooling_system` | Air & Oil Cooled | Engine cooling type. |
| Starting | `starting_method` | Kick and Self Start | Most variants have both. |
| Transmission | `transmission_type` | 5 Speed Manual | Gearbox configuration. |
| Kerb Weight | `kerb_weight` | 123 kg | Physical baseline. |
| Seat Height | `seat_height` | 780 mm | Ergonomic baseline. |
| Ground Clearance| `ground_clearance`| 180 mm | Chassis design. |
| Wheelbase | `wheelbase` | 1326 mm | Chassis design. |

## 2. Variant Level (Features & Options)
These attributes define the specific SKU (Variant) and are used for detailed comparisons.

### Shared Features (All Variants)
*   **Lights:** LED Headlight, LED Tail Light.
*   **Fuel Gauge:** Digital.
*   **Low Fuel Warning:** Yes.
*   **Engine Kill Switch:** Yes.
*   **Under-seat Storage:** Yes (Best-in-class).

### Variant-Specific Diff Points

| Feature | Single Seat | Drum | Disc | iGO (Boost) | SmartXonnect (SX) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Braking (Front)** | Drum | Drum | 240mm Disc | 240mm Disc | 240mm Disc |
| **Console** | Digital | Digital | Digital | Digital + iGO | TFT Color Display |
| **Bluetooth** | No | No | No | Optional/Yes | Yes |
| **NFC** | No | No | No | No | Optional/Yes |
| **Voice Assist** | No | No | No | No | Yes |
| **Seat Type** | Single | Split | Split | Split | Split |
| **USB Charging** | Optional | Optional | Optional | Standard | Standard |

## 3. Standardization Logic

### Keys to Ignore (Non-Deterministic)
*   `user_reviews`: Subjective.
*   `expert_reviews`: Subjective.
*   `images`: Handled by `linkAssets`.
*   `standard_warranty`: Policy-based, not mechanical.

### Semantic Triad Mapping
1.  **`engine_cc`**: Extracted from "Displacement".
2.  **`fuel_capacity`**: Extracted from "Fuel Capacity".
3.  **`mileage`**: Extracted from "Mileage (Overall)".

---
> [!IMPORTANT]
> The `BikedekhoExtractor` will map these keys automatically. Any new keys found in the `additionalProperty` array that are not in the `STRUCTURAL_KEYS` list will fall into the `variantSpecs` of the "Standard" variant created by the scraper.
