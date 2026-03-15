# Location SoT Contract (v1)

> **BINDING** — No location-related feature may be merged until it is compliant with every rule below.  
> Owner: Antigravity. Last updated: 2026-03-15.

---

## 1. Canonical Key

`pincode` (exactly 6 digits) is the **primary location identifier** for every module.

---

## 2. Canonical Resolver — Only Entry Point

All location resolution **must** go through the canonical resolver.

| Input | Output |
|---|---|
| `{ pincode: string }` | `CanonicalLocation` |
| `{ lat: number, lng: number }` | nearest canonical pincode → `CanonicalLocation` |

**No module may derive state / district / taluka / area independently.**

---

## 3. CanonicalLocation Shape

```ts
type CanonicalLocation = {
  pincode: string;                      // 6-digit canonical key
  state: string;                        // from loc_pincodes / Google Maps
  district: string;                     // from loc_pincodes
  taluka: string;                       // from loc_pincodes
  area?: string;                        // from loc_pincodes
  rto?: string;                         // rto_code from loc_pincodes
  lat: number;                          // from loc_pincodes or GPS
  lng: number;                          // from loc_pincodes or GPS
  serviceability_status: 'serviceable' | 'unserviceable' | 'unknown';
  reason?: 'out_of_state' | 'out_of_range' | 'no_dealer' | 'not_found';
  source: 'GPS' | 'MANUAL' | 'PROFILE' | 'CACHE' | 'IP';
};
```

---

## 4. GPS Flow

```
GPS coords → nearest canonical pincode → loc_pincodes row → CanonicalLocation
```

GPS provides **coordinates only**. Final location data always comes from `loc_pincodes` / service-area.

---

## 5. Serviceability Policy

| Condition | Status | Reason |
|---|---|---|
| `state !== 'Maharashtra'` | `unserviceable` | `out_of_state` |
| `state === 'Maharashtra'` AND `distance_to_hub > 200km` | `unserviceable` | `out_of_range` |
| Otherwise | `serviceable` | — |

Hub coordinates: defined once in `serviceArea.ts` (`HUB_LOCATION`). Not duplicated.

---

## 6. Non-Negotiable Merge Gates

Before any location-related PR is merged:

- [ ] No module-specific district/taluka/state inference
- [ ] No free-form location display on PDP / Catalog / Profile
- [ ] No direct `localStorage` value rendered without canonical resolution
- [ ] All location writes persist **full canonical fields**, not partial blobs
- [ ] `CanonicalLocation` type is imported from shared module (not redefined inline)

---

## 7. Module Compliance Checklist

| Module | Required |
|---|---|
| **Catalog** (`DesktopCatalog`, `MobileCatalog`) | `applyRangeStateContext` returns canonical object end-to-end |
| **PDP** (`ProductClient`, `DesktopPDP`, `MobilePDP`) | `serviceability` prop shaped as `CanonicalLocation` subset |
| **Signup/Login** (`LoginSidebar`, `/api/auth/signup`) | Canonical resolve before account write |
| **Profile** (`ProfileClient`) | pincode/GPS → canonical → save via `updateSelfMemberLocation` |
| **Command Bar / location chips** | Display canonical fields only (no `initialLocation as any` fallback) |
| **Pricing / Offers** | Serviceability derived from canonical `serviceability_status` only |

---

## 8. Mandatory QA Before Push (Manual or Playwright)

1. **Pincode `401203`** — UI fields must exactly match `loc_pincodes` row:
   - State: `Maharashtra`, District: `Palghar`, Taluka: `Vasai`, Area: `Gass B.O`
2. **Delhi pincode `110012`** — `unserviceable` everywhere (Catalog, PDP, Command Bar)
3. **MH in-range pincode** (e.g. `400001`) — `serviceable` everywhere
4. **GPS path parity** — GPS-resolved canonical must match manual pincode path for same location
5. **Profile ↔ Catalog ↔ PDP consistency** — same pincode shows identical state/district/taluka

---

## 9. Current Compliance Status (as of 2026-03-15)

| Module | Status | Gap |
|---|---|---|
| Catalog | ✅ Mostly canonical | `stateCode` normalizer covers known gaps |
| PDP `derivedServiceability` | ✅ Fixed (commit `41141737`) | Was `status:'SET'` legacy |
| Signup API | ✅ Fixed (commit `41141737`) | `INVALID_PINCODE_FORMAT` guard added |
| LoginSidebar `PINCODE_FALLBACK` | ✅ Done (commit `5bd45f34`) | |
| Profile `locationInfo` command bar | ⚠️ Partial | Uses `initialLocation as any` fallback — pending canonical hardening |
| `PdpCommandBar` `locationInfo` prop | ⚠️ Partial | Mixed sources — needs canonical-only feed |
