# Vehicle Specifications Template (Standardized)

This template defines the mandatory and optional fields for scraping and storing vehicle data in the BookMyBike catalog. It is divided into **Model (Family)** and **Variant** levels, with specific requirements for **ICE**, **Electric (EV)**, and **CNG** vehicles.

## 1. Model Level (Structural)
These fields are consistent across most variants and defines the core architecture of the vehicle family.

### A. Core Dimensions (All Vehicles)
| Field Key | Label | Value Type | Description |
| :--- | :--- | :--- | :--- |
| `kerb_weight` | Kerb Weight | Numeric (kg) | Total weight with fluids. |
| `seat_height` | Seat Height | Numeric (mm) | Height of the seat from ground. |
| `ground_clearance`| Ground Clearance| Numeric (mm) | Lowest point of chassis. |
| `wheelbase` | Wheelbase | Numeric (mm) | Distance between axle centers. |
| `tyre_type` | Tyre Type | String | e.g., Tubeless, Tube |
| `chassis_type` | Chassis Type | String | e.g., Duplex Cradle, Underbone |

### B. ICE & CNG Specific (Minimum Required)
| Field Key | Label | Value Type | Description |
| :--- | :--- | :--- | :--- |
| `engine_cc` | Displacement | Numeric (cc) | Engine capacity. |
| `max_power` | Max Power | String | e.g., "11.38 PS @ 7500 rpm" |
| `max_torque` | Max Torque | String | e.g., "11.2 Nm @ 6000 rpm" |
| `fuel_capacity` | Fuel Capacity | Numeric (L) | Tank size. |
| `mileage` | Mileage | Numeric (kmpl)| Combined or ARAI mileage. |
| `engine_type` | Engine Type | String | e.g., "Single Cylinder, 3 Valve" |
| `cooling_system` | Cooling System | String | Air/Oil/Liquid Cooled. |
| `transmission_type`| Transmission | String | e.g., "5 Speed Manual", "CVT" |
| `emission_standard`| Emission Norm | String | e.g., BS6 Phase 2 |

### C. Electric (EV) Specific (Minimum Required)
| Field Key | Label | Value Type | Description |
| :--- | :--- | :--- | :--- |
| `battery_capacity`| Battery Capacity| Numeric (kWh)| Energy storage size. |
| `range_per_charge`| Range | Numeric (km) | Range on a full charge. |
| `charging_time` | Charging Time | String | e.g., "5 Hours (0-100%)" |
| `motor_power` | Motor Power | String | e.g., "5 kW (Peak)" |
| `motor_type` | Motor Type | String | e.g., PMSM, Hub Motor |
| `fast_charging` | Fast Charging | Boolean | Support for DC fast charging. |

---

## 2. Variant Level (Features & Mechanicals)
These fields vary by specific SKU (Variant/Color) and drive the comparison logic.

### A. Braking & Safety
| Field Key | Label | Value Type | Description |
| :--- | :--- | :--- | :--- |
| `front_brake_type` | Front Brake | String | Disc / Drum |
| `rear_brake_type` | Rear Brake | String | Disc / Drum |
| `abs_type` | ABS / CBS | String | Single/Dual Channel ABS, CBS. |
| `engine_kill_switch`| Kill Switch | Boolean | Dedicated engine cut-off. |

### B. Features & Tech
| Field Key | Label | Value Type | Description |
| :--- | :--- | :--- | :--- |
| `console_type` | Instrument Console| String | Analog / Digital / TFT. |
| `bluetooth_support`| Bluetooth | Boolean | Smartphone connectivity. |
| `navigation_assist`| Navigation | Boolean | Turn-by-turn or integrated map. |
| `usb_charging` | USB Port | Boolean | Charging port for devices. |
| `riding_modes` | Riding Modes | String | e.g., "Eco, Power, Rain" |

### C. Aesthetics & Lighting
| Field Key | Label | Value Type | Description |
| :--- | :--- | :--- | :--- |
| `headlight_type` | Headlight | String | Halogen / LED. |
| `drl_support` | DRLs | Boolean | Daytime Running Lights. |
| `wheel_type` | Wheel Type | String | Alloy / Spoke. |

---

## 3. Standardization Rules
1. **Deterministic Keys**: Always use `snake_case` for keys.
2. **Unit Stripping**: Numeric fields should store only the value; units should be handled in the UI Layer (using standard metadata).
3. **Boolean Inference**: If a field contains "Yes", "Available", or "Standard", map to `true`. "No", "N/A", "Optional" map to `false` (or keep as string if optional).
4. **Model vs Variant**: If a spec is physical/structural (unlikely to change with a 'Disc' or 'Alloy' variant), it stays at the **Model** level.
