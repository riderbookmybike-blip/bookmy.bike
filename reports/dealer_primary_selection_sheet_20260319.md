# Dealer Primary Branch Selection Sheet

Date: 2026-03-19 (updated 2026-03-19T17:53 IST)  
Phase: 3 execution — HIGH items applied; MEDIUM/LOW pending confirmation  
**Legend**: ✅ Applied | ⏳ Pending confirmation | ❌ Blocked

---

## Confidence Summary

| Slug | Display Name | Legal Entity | Branch Status | SQL Applied? | Confidence |
|------|-------------|--------------|---------------|--------------|------------|
| `udan` | Suzuki - Udan Automotive Company LLP | UDAN AUTOMOTIVE COMPANY LLP | SHOWROOM added (Vasai East) | ✅ | HIGH |
| `dream-suzuki` | Suzuki - Dreambikes Mumbai Sales & Service LLP | Dreambikes Mumbai Sales & Service LLP | SHOWROOM address filled | ✅ | HIGH |
| `autorace` | TVS - Autorace Automotive LLP | Autorace Automotive LLP | SHOWROOM added (Goregaon West) | ✅ | HIGH |
| `arni-tvs` | TVS - Arni Wheels Private Limited | Arni Wheels Private Limited | No branch change | ✅ | HIGH |
| `aher` | Honda - Aher Automobiles Private Limited | AHER AUTOMOBILES PRIVATE LIMITED (CIN U50500MH2020PTC351327) | SHOWROOM added | ✅ | HIGH |
| `automiles-hero` | Hero - Automiles | Automiles (Partnership, GSTIN 27AAYFA8033D1Z9) | No branch change | ✅ | HIGH |
| `suryodaya-bajaj` | Bajaj - Suryodaya Motors Private Limited | SURYODAYA MOTORS PRIVATE LIMITED (CIN U50103MH2000PTC130147) | Address not fabricated | ✅ | HIGH |
| `sahil-yamaha` | Yamaha - Sahil Auto Yamaha | Sahil Auto Yamaha (GSTIN 27ACEPK3508R1Z7) | SHOWROOM address filled | ✅ | MEDIUM |
| `aapli` | Aapli Autofin Private Limited | Aapli Autofin Private Limited (CIN U45100MH2023PTC413294) | No change | ✅ | HIGH |
| `automax-yamaha` | Yamaha - Automax Automotive | Automax Automotive (Partnership) | Vasai vs Goregaon unresolved | ⏳ PENDING_CONFIRMATION | LOW |
| `myscooty` | Myscooty | Unknown | No official source | ❌ manual_verification_required | LOW |

---

## Pending Verification List

### ⏳ Automax Yamaha (`automax-yamaha`)
- **Blocker**: Two distinct "Automax Automotive" Partnership entities registered — one in Vasai (MH48), one in Goregaon West (MH47). Studio code RTO depends on which is primary.
- **Required action**: Confirm correct city → legal name + studio ID locked after.
- **DB state**: `config` tagged `{"legal_name_confidence":"LOW","pending_confirmation":"location_city"}`. No name overwrite applied.

### ⚠️ Suryodaya Bajaj (`suryodaya-bajaj`)
- **Blocker**: BikeDekho confirms Vasai East but no full street address found publicly.
- **Required action**: Provide street address line for `SHOWROOM` row update.
- **DB state**: `config` tagged `needs_address_verification: true`. Legal name applied (HIGH confidence). `address_line_1 = NULL` retained.

### ❌ Myscooty (`myscooty`)
- **Blocker**: No official OEM, website, or aggregator source with reliable data.
- **Required action**: Business to provide: phone number, street address, operating status.
- **DB state**: No changes. `config` tagged `manual_verification_required: true`.
