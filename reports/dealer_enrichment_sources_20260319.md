# Dealer Enrichment Sources

Date: 2026-03-19  
Phase: 1 – Internet Enrichment Harvest  
Executor: Antigravity

---

## Source Index

| Dealer | Source URL | Type | Confidence | Fetched |
|--------|-----------|------|------------|---------|
| Aher Automotive | https://inrdeals.com/dealer/hero-bike/maharashtra/hero-showroom-in-thane/ms-aher-auto-p-ltd-438608 | AGGREGATOR | LOW | 2026-03-19 |
| Arni TVS | https://arnitvs.com/ | OFFICIAL_SITE | MEDIUM | 2026-03-19 (TLS error – metadata available) |
| TVS Autorace | https://dealers.tvsmotor.com/tvs-motors/tvs-autorace-automotive-llp-two-wheeler-dealer-showroom-goregaon-west-mumbai-133973/Home/HI | OEM_OFFICIAL | HIGH | 2026-03-19 |
| TVS Autorace (Malad branch) | https://dealers.tvsmotor.com/tvs-motors/tvs-autorace-automotive-llp-two-wheeler-dealer-malad-west-mumbai-133972/Home | OEM_OFFICIAL | HIGH | Not fetched (link found on Goregaon page) |
| Automiles Hero | https://dealers.heromotocorp.com/automiles-hero-motocorp-two-wheeler-dealer-malad-east-mumbai-22206/Home | OEM_OFFICIAL | HIGH | 2026-03-19 |
| Dream Suzuki | https://www.suzukimotorcycleandheriwest.com/ | OFFICIAL_SITE | HIGH | 2026-03-19 |
| Udan Suzuki | https://www.suzukimotorcyclevasaieast.com/ | OFFICIAL_SITE | HIGH | 2026-03-19 |
| Sahil Yamaha | https://www.bharatibiz.com/en/sahil-yamaha_1m-092728-88123 | AGGREGATOR | LOW | 2026-03-19 |
| Suryodaya Bajaj | https://www.bikedekho.com/hi/showrooms/bajaj/mumbai/suryoday-bajaj-vasai-east-50063208 | AGGREGATOR | LOW | 2026-03-19 |
| Myscooty | — | NONE | NONE | No source found |
| Studio 48C | — | NONE | NONE | No source found |
| Automax Yamaha | https://bikekharido.in/dealers/automax-automotive-yamaha/ | AGGREGATOR | LOW | Not fetched (seed reference) |

---

## Detailed Findings

### Aher Automotive
- **Brand**: Honda (current primary; legacy Hero listing found on inrdeals)
- **InrDeals listing**: M/S Aher Auto (P) Ltd, Thane (Hero showroom, legacy designation)
  - No phone/email extracted from body (scraper-blocked)
  - Hours: Mon–Sun 10:30am–8:00pm (typical Hero dealer hours shown in listing context)
- **No official Honda dealer page found** in this harvest pass
- **DB has only WAREHOUSE row** – showroom row missing
- **Verdict**: Need official Honda dealer locator page for HIGH confidence

### Arni TVS
- **Official site**: https://arnitvs.com/ (TLS certificate error – could not fetch full body)
  - Site title and OG metadata available from seed: "Shree Prastha, Nalasopara West, Virar, Maharashtra 401203"
  - Site mentions: Vasai + Virar branches hinted
- **DB showroom row**: Nalasopara West, 401203 (matches official site address)
- **Pincode discrepancy**: Tenant pincode=401202 (Vasai/Bassein), SHOWROOM pincode=401203 (Gass B.o/Vasai)
- **Area token options**:
  - If primary pincode = 401202: area=Bassein Road S.O → `B`, RTO=MH48 → code `TVS-48B-ARN`
  - If primary pincode = 401203: area=Gass B.o → `G`, RTO=MH48 → code `TVS-48G-ARN`
  - **Note**: The seed report originally said "Nalasopara → N" – but `loc_pincodes` for both 401202 and 401203 do NOT yield area=N. The N area is from pincode 401209 (Nallosapare E). Seed report area mapping was inaccurate.

### TVS Autorace
- **Official OEM page** (HIGH confidence):
  - Address: SN 9, GR FLR, Goregaon Samruddhi CHS, Sidharth Nagar, Near Goregaon Police Station, Goregaon West, Mumbai, Maharashtra
  - Pincode confirmed: 400104 (matches tenant pincode)
  - Rating: 4.4 stars
- **Second branch found**: Malad West page exists on TVS OEM portal → https://dealers.tvsmotor.com/tvs-motors/tvs-autorace-automotive-llp-two-wheeler-dealer-malad-west-mumbai-133972/Home
  - This corresponds to WAREHOUSE row at Malad West (400064)
- **No SHOWROOM row** in id_locations currently – only WAREHOUSE at 400064
- **Recommended action**: Add Goregaon West SHOWROOM row; keep Malad West as branch

### Automiles Hero
- **Official OEM Hero page** (HIGH confidence):
  - Address: Malad East, Mumbai 400097
  - Phone: 9289922883 (from seed; confirmed by OEM page context)
  - Google Maps review CID linked
- **DB SHOWROOM row**: "Shop No. 1, Radha Krishna Building, Rani Sati Marg, Near W.E. Highway, Malad East" – pincode 400097
- **Tenant pincode**: 400064 (Malad West/Liberty Garden area)
- **Verdict**: Showroom is definitively Malad East (400097). Tenant pincode needs update.

### Dream Suzuki
- **Official dealership site** (HIGH confidence):
  - Brand: Suzuki Motorcycle
  - Address: 332, Swami Vivekananda Rd, near Amboli, Fish Market Area, Navneeth Colony, Andheri West, Mumbai 400058
  - Phone: 7669267821
  - Email: mumbai.dreambikes.ceo@suzukidealers.in
  - GPS: 19.125637, 72.8471476
- **DB SHOWROOM row**: pincode 400060 (Jogeshwari East) – different from official site 400058 (Andheri West)
- **Both pincode MH02** – RTO code unchanged, but area token differs
- **Verdict**: Trust official site: correct pincode = 400058, area = Andheri RS S.O

### Udan (Udan Suzuki)
- **Official dealership site** (HIGH confidence):
  - Brand: Suzuki Motorcycle
  - Full name: Udan Suzuki, Vasai East, Palghar
  - Address: Johnson Motor Compound Bldg, 1–6, Road, near Range Office Sativali, Fatherwadi, Golani Naka, Vasai East, Palghar, Maharashtra **401208**
  - Phone: 08071963154
  - Email: mumbai.udanautomotive.sales@suzukidealers.in
  - GPS: 19.4021268, 72.8480862
- **CRITICAL: Tenant pincode 401028** – no match in loc_pincodes. `rto_code = null` in DB query.
- **WAREHOUSE row pincode**: 401202 (Vasai West / Ambadi Road)
- **Correct pincode**: 401208 (Vasai East/Gokhiware, MH48) – confirmed by official site
- **Verdict**: Tenant pincode must be corrected to 401208 before studio code generation

### Automax Yamaha
- **Aggregator reference only** – no official Yamaha dealer page confirmed
- **DB SHOWROOM row**: Goregaon West (400062), Mumbai Suburban
- **Tenant pincode**: 401202 (Vasai / Bassein)
- **MAJOR CONFLICT**: Showroom location is in Mumbai (MH47 likely) but tenant registered as Vasai (MH48)
- **Action needed**: Official Yamaha dealer locator page must be checked before any code generation

### Sahil Yamaha
- **Aggregator (BharatiBiz)**:
  - Address: Sahil Arcade, Boisar 401501
  - Phones: 09272888123, 08421177448
  - Email: sahilyamaha@gmail.com
- **DB row**: Sahil Yamaha - Palghar, pincode 401404 (Palghar H.O) – but aggregator shows 401501 (Boisar/Dahanu)
- **Tenant pincode**: 401501 (Boisar/Akkarpatti) – matches aggregator
- **Verdict**: Tenant pincode correct (401501). DB showroom row pincode (401404) needs update to 401501. No official Yamaha page found.

### Suryodaya Bajaj
- **BikeDekho** listing found but returned Mumbai Bajaj dealer list, not direct Vasai East page
- **DB SHOWROOM row**: pincode 401208 (Vasai East, Palghar, MH48)
- **Tenant pincode**: 401202 (Vasai West)
- **BikeDekho listing title**: "Suryoday Bajaj @ Vasai East" – confirms Vasai East
- **Conflict**: Tenant pincode 401202 (Vasai West) vs showroom 401208 (Vasai East)
- **No official Bajaj dealer page found** – aggregator only

### Myscooty
- No official source found. Primary brand: APRILIA (Piaggio group).
- DB SHOWROOM: Santosh Bhavan, Wailvpada, 401209 (Nallasopara East), Vasai, Palghar
- Contact fields empty in DB. No phone/email harvested.

### Studio 48C
- No official source found. Primary brand: APRILIA.
- HEAD_OFFICE row (is_active=false): Shop 18/19/20, Panbai Nagar, Nallasopara West, 401203
- WAREHOUSE row (active, address placeholder): 401203
- Contact fields empty in DB.
