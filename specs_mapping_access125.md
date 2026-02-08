# Suzuki Access 125: Comprehensive Specs & Features Mapping

This document serves as the authoritative mapping for the Suzuki Access 125, following the **Specs Segregation** mandate. Structural specs are assigned to the **Model (Family)** level, while feature-specific mechanicals are assigned to the **Variant** level.

## 1. Model (Family) Level - Structural Specifications
These specifications are constant across the entire Access 125 family.

| Key | Value | Standardized Key |
| :--- | :--- | :--- |
| **Engine Displacement** | 124 cc | `engine_cc` |
| **Max Power** | 8.3 bhp @ 6750 rpm | `max_power` |
| **Max Torque** | 10.2 Nm @ 5500 rpm | `max_torque` |
| **Fuel Tank Capacity** | 5.3 Litres | `fuel_capacity` |
| **Mileage (Owner Reported)** | 48 kmpl | `mileage` |
| **Seat Height** | 773 mm | `seat_height` |
| **Top Speed** | 90 kmph | `top_speed` |
| **Emission Standard** | BS6 Phase 2B | `emission_standard` |
| **Ground Clearance** | 160 mm | `ground_clearance` |
| **External Fuel Filling** | Yes | `external_fuel_fill` |
| **Under-seat Storage** | 21.8 Litres | `storage_underseat` |

## 2. Variant Level - Feature Segregation
The following features are compared at the variant level to drive the "Comparison Tool".

### Feature Matrix (Comparison List)

| Feature | Key | Value Options |
| :--- | :--- | :--- |
| **Braking System** | `abs_cbs` | CBS (Standard) |
| **Front Brake Type** | `front_brake_type` | Disc / Drum |
| **Rear Brake Type** | `rear_brake_type` | Drum |
| **Wheel Type** | `wheel_type` | Alloy / Steel |
| **Tyre Type** | `tyre_type` | Tubeless |
| **Console Type** | `console_type` | Analogue / Digital / TFT |
| **Connectivity** | `connectivity` | BT / None |
| **App Support** | `app_support` | Suzuki Ride Connect (Yes/No) |
| **USB Charging** | `usb_charging` | Yes / No |
| **Navigation** | `navigation` | Turn-by-Turn (Yes/No) |

## 3. Authoritative Variant Definitions

| Variant Name | Standardized Key Features |
| :--- | :--- |
| **Drum - Steel Wheel** | `front_brake_type`: "Drum", `wheel_type`: "Steel", `console_type`: "Analogue" |
| **Drum - Alloy Wheel** | `front_brake_type`: "Drum", `wheel_type`: "Alloy", `console_type`: "Analogue" |
| **Disc - Alloy Wheel** | `front_brake_type`: "Disc", `wheel_type`: "Alloy", `console_type`: "Analogue" |
| **Special Edition** | `front_brake_type`: "Disc", `wheel_type`: "Alloy", `finish`: "Chrome Mirror", `seat_finish`: "Tan Leather" |
| **Ride Connect Edition**| `front_brake_type`: "Disc", `wheel_type`: "Alloy", `console_type`: "Digital", `connectivity`: "BT" |
| **Ride Connect TFT** | `front_brake_type`: "Disc", `wheel_type`: "Alloy", `console_type`: "TFT", `connectivity`: "BT" |

## 4. Implementation Notes for Extractor
- Always extract `additionalProperty` from JSON-LD as the primary spec source.
- Map `Front Brake Type` to `front_brake_type`.
- If `Ride Connect` is in the name, set `connectivity` to `BT` and `console_type` to `Digital`.
- If `TFT` is in the name, set `console_type` to `TFT`.
