# Dealer Primary Branch Selection Sheet

Date: 2026-03-19  
Phase: 3 preview (early, based on Phase 0+1 findings)  
**Business Action Required: Select primary branch for each dealership**

> For each dealer, choose ONE option. That option's pincode drives the studio code.  
> After selection, Antigravity applies `is_primary` to the chosen `id_locations` row and computes final `studio_id`.

---

## 1. Aher Automotive

| | Detail |
|-|--------|
| **Brand** | HONDA → `HON` |
| **Dealer token** | `AHE` |
| **Current studio_id** | `A42-HAH-13E` |

| Option | Location | Pincode | RTO | Area Token | Expected Code | Confidence |
|--------|----------|---------|-----|-----------|---------------|------------|
| ✅ **A (Recommended)** | Kalyan West – Murbad Road (Warehouse/only location) | 421301 | MH05 | K (Kalyan City H.O) | **HON-05K-AHE** | HIGH – pincode confirmed, matches OEM region |

**Notes:**
- Only WAREHOUSE location row exists. No SHOWROOM row. Recommend adding a SHOWROOM row before Phase 4.
- Legacy Hero listing confirms Thane/Kalyan region – consistent with current pincode.
- Official Honda dealer page not found in this harvest pass. May need second pass.

**→ Business decision**: Confirm Option A (default). Add SHOWROOM address if known.

---

## 2. Arni TVS

| | Detail |
|-|--------|
| **Brand** | TVS → `TVS` |
| **Dealer token** | `ARN` |
| **Current studio_id** | `T40-VAR-12N` |

| Option | Location | Pincode | RTO | Area Token | Expected Code | Confidence |
|--------|----------|---------|-----|-----------|---------------|------------|
| **A** | Nalasopara West – Shree Prastha (SHOWROOM row) | 401203 | MH48 | G (Gass B.o) | `TVS-48G-ARN` | MEDIUM – showroom row + official site address |
| **B** | Vasai (Tenant registered pincode) | 401202 | MH48 | B (Bassein Road S.O) | `TVS-48B-ARN` | MEDIUM |
| **C** | Virar branch (not in DB yet) | — | — | — | TBD | Requires new location row |

> ⚠️ **Seed report area correction**: Previous seed said "401203 → N (Nalasopara)" but `loc_pincodes` for 401203 = area "Gass B.o" → `G`. The `N` area code comes from 401209 (Nallasopara East), a different pincode. Official Arni site lists Nalasopara West address at 401203.

**→ Business decision**: Choose A, B, or C (if Virar is intended primary). Recommended: **Option A** (official site matches SHOWROOM row).

---

## 3. TVS Autorace

| | Detail |
|-|--------|
| **Brand** | TVS → `TVS` |
| **Dealer token** | `AUT` |
| **Current studio_id** | `T40-VAU-01T` |

| Option | Location | Pincode | RTO | Area Token | Expected Code | Confidence |
|--------|----------|---------|-----|-----------|---------------|------------|
| ✅ **A (Recommended)** | Goregaon West (OEM confirmed main showroom) | 400104 | MH47 | B (Bangur Nagar S.O) | **TVS-47B-AUT** | HIGH – OEM official page confirms |
| **B** | Malad West (WAREHOUSE row / second OEM branch) | 400064 | MH47 | L (Liberty Garden S.O) | `TVS-47L-AUT` | HIGH |

**Notes:**
- OEM page confirmed: Goregaon West is the main showroom
- Malad West is a secondary branch (warehouse + OEM branch page exists)
- SHOWROOM location row missing in DB – needs to be added for Goregaon West address

**→ Business decision**: Recommend **Option A** (Goregaon West = main showroom).

---

## 4. Automiles Hero

| | Detail |
|-|--------|
| **Brand** | HERO → `HER` |
| **Dealer token** | `AUT` |
| **Current studio_id** | `H40-EAU-00T` |

| Option | Location | Pincode | RTO | Area Token | Expected Code | Confidence |
|--------|----------|---------|-----|-----------|---------------|------------|
| ✅ **A (Recommended)** | Malad East – Radha Krishna Building (SHOWROOM row) | 400097 | MH47* | M* | **HER-47M-AUT** | HIGH – OEM Hero page confirms Malad East |
| **B** | Malad West (tenant pincode) | 400064 | MH47 | L (Liberty Garden) | `HER-47L-AUT` | MEDIUM |

> *Pincode 400097 (Malad East) not in current loc_pincodes query result – but is MH47 by RTO area. Verify `loc_pincodes` for 400097 before locking.  
> Phone confirmed: 9289922883 (OEM page)

**→ Business decision**: Recommend **Option A** (Malad East = OEM-confirmed). Fix tenant pincode from 400064 to 400097.

---

## 5. Dream Suzuki

| | Detail |
|-|--------|
| **Brand** | SUZUKI → `SUZ` |
| **Dealer token** | `DRE` |
| **Current studio_id** | `S40-UDR-00E` |

| Option | Location | Pincode | RTO | Area Token | Expected Code | Confidence |
|--------|----------|---------|-----|-----------|---------------|------------|
| ✅ **A (Recommended)** | Andheri West – Swami Vivekananda Rd (official site) | 400058 | MH02 | A (Andheri Railway Station S.O) | **SUZ-02A-DRE** | HIGH – official site + GPS confirmed |
| **B** | Jogeshwari East (current SHOWROOM row) | 400060 | MH02 | J (Jogeshwari) | `SUZ-02J-DRE` | MEDIUM |

> Phone: 7669267821 | Email: mumbai.dreambikes.ceo@suzukidealers.in | GPS: 19.125637, 72.8471476

**→ Business decision**: Recommend **Option A** (official site address, Andheri West 400058). Update SHOWROOM row pincode from 400060 to 400058.

---

## 6. Udan (Udan Suzuki)

| | Detail |
|-|--------|
| **Brand** | SUZUKI → `SUZ` |
| **Dealer token** | `UDA` |
| **Current studio_id** | `U40-DUD-10A` |

| Option | Location | Pincode | RTO | Area Token | Expected Code | Confidence |
|--------|----------|---------|-----|-----------|---------------|------------|
| ✅ **A (Recommended)** | Vasai East – Johnson Motor Compound, Golani Naka (official site) | **401208** | MH48 | G (Gokhiware B.O) | **SUZ-48G-UDA** | HIGH – official site + GPS confirmed |
| **B** | Vasai West – Ambadi Road (WAREHOUSE row) | 401202 | MH48 | B (Bassein Road) | `SUZ-48B-UDA` | LOW |

> 🔴 **CRITICAL ACTION**: Current tenant pincode 401028 has **no match in loc_pincodes** → rto_code = null → studio code cannot be generated.  
> Phone: 08071963154 | Email: mumbai.udanautomotive.sales@suzukidealers.in | GPS: 19.4021268, 72.8480862  
> Must update tenant pincode to 401208 before Phase 4.

**→ Business decision**: Strongly recommend **Option A** (Vasai East = official site). Correct tenant pincode 401028 → 401208.

---

## 7. Automax Yamaha

| | Detail |
|-|--------|
| **Brand** | YAMAHA → `YAM` |
| **Dealer token** | `AUT` |
| **Current studio_id** | `Y40-AAU-12T` |

| Option | Location | Pincode | RTO | Area Token | Expected Code | Confidence |
|--------|----------|---------|-----|-----------|---------------|------------|
| **A** | Goregaon West – Kumud Nagar, SV Road (SHOWROOM row, 400062) | 400062 | MH47* | ? | `YAM-47?-AUT` | LOW – MH47 likely, area unclear |
| **B** | Malad West – alternate listing (seed ref, 400064) | 400064 | MH47 | L (Liberty Garden) | `YAM-47L-AUT` | LOW |

> ⚠️ **Major conflict**: Tenant registered pincode 401202 (Vasai, MH48) but SHOWROOM row shows Mumbai Suburban address (400062). If Mumbai SHOWROOM is correct, studio code RTO changes from 48 to 47.  
> **Needs official Yamaha dealer locator verification before proceeding.**

**→ Business decision**: Clarify correct location before any code generation. Is this dealer Vasai-based or Mumbai-based?

---

## 8. Sahil Yamaha

| | Detail |
|-|--------|
| **Brand** | YAMAHA → `YAM` |
| **Dealer token** | `SAH` |
| **Current studio_id** | `Y40-ASA-15H` |

| Option | Location | Pincode | RTO | Area Token | Expected Code | Confidence |
|--------|----------|---------|-----|-----------|---------------|------------|
| ✅ **A (Recommended)** | Boisar – Sahil Arcade (tenant pincode + aggregator match) | 401501 | MH48 | A (Akkarpatti B.O) | **YAM-48A-SAH** | MEDIUM |
| **B** | Palghar (current SHOWROOM row) | 401404 | MH48 | P (Palghar H.O) | `YAM-48P-SAH` | LOW |

> Phone: 09272888123 / 08421177448 | Email: sahilyamaha@gmail.com  
> No official Yamaha dealer page found. Recommend Yamaha dealer locator check.

**→ Business decision**: Recommend **Option A** (Boisar/401501 matches tenant pincode + aggregator). Update SHOWROOM row pincode from 401404 to 401501.

---

## 9. Suryodaya Bajaj

| | Detail |
|-|--------|
| **Brand** | BAJAJ → `BAJ` |
| **Dealer token** | `SUR` |
| **Current studio_id** | `B40-ASU-12R` |

| Option | Location | Pincode | RTO | Area Token | Expected Code | Confidence |
|--------|----------|---------|-----|-----------|---------------|------------|
| ✅ **A (Recommended)** | Vasai East (SHOWROOM row + BikeDekho confirms) | 401208 | MH48 | G (Gokhiware B.O) | **BAJ-48G-SUR** | MEDIUM |
| **B** | Vasai West (tenant pincode) | 401202 | MH48 | B (Bassein Road) | `BAJ-48B-SUR` | LOW |

> No official Bajaj dealer page found. BikeDekho listing title confirms Vasai East.

**→ Business decision**: Recommend **Option A** (Vasai East = showroom row). Update tenant pincode from 401202 to 401208.

---

## 10. Myscooty

| | Detail |
|-|--------|
| **Brand** | APRILIA → `APR` |
| **Dealer token** | `MYS` |
| **Current studio_id** | `M40-YMY-12S` |

| Option | Location | Pincode | RTO | Area Token | Expected Code | Confidence |
|--------|----------|---------|-----|-----------|---------------|------------|
| **A** | Wailvpada, Nallasopara East (SHOWROOM row) | 401209 | MH48 | N (Nallosapare E S.O) | `APR-48N-MYS` | LOW – no official source |

> No official source found. Contact fields empty. Needs business to provide address/phone.

**→ Business decision**: Confirm Option A or provide correct details.

---

## 11. Studio 48C

| | Detail |
|-|--------|
| **Brand** | APRILIA → `APR` |
| **Dealer token** | `STU` |
| **Current studio_id** | `S40-TAA-12P` |

| Option | Location | Pincode | RTO | Area Token | Expected Code | Confidence |
|--------|----------|---------|-----|-----------|---------------|------------|
| **A** | Panbai Nagar, Nallasopara West (HEAD_OFFICE row – is_active=false) | 401203 | MH48 | G (Gass B.o) | `APR-48G-STU` | LOW |

> HEAD_OFFICE location is currently `is_active = false`. Warehouse address is placeholder.  
> No official source found. Is this location still operational?

**→ Business decision**: Confirm operational status + correct address. Activate HEAD_OFFICE row or provide SHOWROOM details.

---

## Summary Table (All Dealers)

| Dealer | Recommended Code | Confidence | Critical Blocker? |
|--------|-----------------|------------|-------------------|
| Aher Automotive | `HON-05K-AHE` | HIGH | No SHOWROOM row |
| Arni TVS | `TVS-48G-ARN` | MEDIUM | Pincode conflict: choose A/B/C |
| TVS Autorace | `TVS-47B-AUT` | HIGH | No SHOWROOM row |
| Automiles Hero | `HER-47M-AUT` | HIGH | Tenant pincode needs update |
| Dream Suzuki | `SUZ-02A-DRE` | HIGH | SHOWROOM pincode needs update |
| **Udan** | **`SUZ-48G-UDA`** | HIGH | **🔴 Tenant pincode 401028 invalid – must fix first** |
| Automax Yamaha | TBD | LOW | **🔴 Major location conflict – needs clarification** |
| Sahil Yamaha | `YAM-48A-SAH` | MEDIUM | SHOWROOM pincode mismatch |
| Suryodaya Bajaj | `BAJ-48G-SUR` | MEDIUM | Tenant pincode needs update |
| Myscooty | `APR-48N-MYS` | LOW | No official source |
| Studio 48C | `APR-48G-STU` | LOW | Location is_active=false |
