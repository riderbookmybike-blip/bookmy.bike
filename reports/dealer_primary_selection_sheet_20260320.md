# Dealer Primary Selection Sheet (Business-Confirmed) — 2026-03-20

Status: Approved inputs incorporated from business review.

## Final Decisions

| Slug | Canonical Display Name | Legal Name | Confidence | Notes |
|---|---|---|---|---|
| udan | Suzuki - Udan Automotive Company LLP | UDAN AUTOMOTIVE COMPANY LLP | HIGH | MCA LLPIN AAF-3794 |
| dream-suzuki | Suzuki - Dreambikes Mumbai Sales & Service LLP | Dreambikes Mumbai Sales & Service LLP | HIGH | GST + market docs |
| autorace | TVS - Autorace Automotive LLP | Autorace Automotive LLP | HIGH | OEM references |
| arni-tvs | TVS - Arni Wheels Private Limited | Arni Wheels Private Limited | HIGH | OEM + business confirmed |
| aher | Honda - Aher Automobiles Private Limited | AHER AUTOMOBILES PRIVATE LIMITED | HIGH | MCA CIN U50500MH2020PTC351327 |
| automiles-hero | Hero - Automiles | Automiles | HIGH | Partnership + GSTIN |
| suryodaya-bajaj | Bajaj - Suryodaya Motors Private Limited | SURYODAYA MOTORS PRIVATE LIMITED | HIGH | Business confirmed + branch addresses |
| automax-yamaha | Yamaha - Automax Automotive | Automax Automotive | HIGH | Business confirmed city: Vasai |
| sahil-yamaha | Yamaha - Sahil Auto Yamaha | Sahil Auto Yamaha | MEDIUM | Market source + GSTIN |
| myscooty | Myscooty | Myscooty | HIGH | Business confirmed legal name |
| aapli | Aapli Autofin Private Limited | Aapli Autofin Private Limited | HIGH | MCA CIN U45100MH2023PTC413294 |

## Suryodaya Branches (Approved)

1. Vasai East (Primary): Vishant Regency, Near Fatherwadi, Gokhivare, Near Range Office, Vasai East - 401208
2. Vasai West: Vartak Arcade, Near Flyover, Ambadi Road, Vasai West, Palghar - 401202

## Execution Rule

1. Apply HIGH-confidence updates in SQL patch.
2. Preserve history in `config.legal_name_*` metadata.
3. Keep one primary location per tenant.
