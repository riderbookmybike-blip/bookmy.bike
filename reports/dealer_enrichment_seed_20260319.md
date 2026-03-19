# Dealer Enrichment Seed (Internet + DB)

Date: 2026-03-19  
Status: Initial seed for business selection; full crawl pending via Antigravity

## Aher Automotive
- DB:
  - `studio_id`: `A42-HAH-13E`
  - pincode: `421301`
  - RTO from `loc_pincodes`: `MH05` -> token `05`
  - area: `Kalyan` -> `K`
  - suggested code: `HON-05K-AHE`
- Net hints (non-authoritative):
  - Hero-era Aher listing (legacy): https://inrdeals.com/dealer/hero-bike/maharashtra/hero-showroom-in-thane/ms-aher-auto-p-ltd-438608

## Arni TVS
- DB:
  - `studio_id`: `T40-VAR-12N`
  - pincode: `401203`
  - RTO: `MH48` -> `48`
  - area: `Nalasopara` -> `N`
  - suggested code: `TVS-48N-ARN`
- Net:
  - Official site: https://arnitvs.com/
  - Main office listed: Shree Prastha, Nalasopara West, Virar, Maharashtra 401203
  - Additional branch/workshop hints: Vasai + Virar on same site

## TVS Autorace
- DB:
  - pincode: `400064`, RTO `MH47`, area `Mumbai` -> `M`
  - suggested: `TVS-47M-TVS`
- Net:
  - Official TVS dealer page: https://dealers.tvsmotor.com/tvs-motors/tvs-autorace-automotive-llp-two-wheeler-dealer-showroom-goregaon-west-mumbai-133973/Home/HI

## Automiles Hero
- DB:
  - pincode: `400097`, RTO `MH47`, area `Mumbai` -> `M`
  - suggested: `HER-47M-AUT`
- Net:
  - Official Hero dealer page: https://dealers.heromotocorp.com/automiles-hero-motocorp-two-wheeler-dealer-malad-east-mumbai-22206/Home
  - Address shown: Malad East, Mumbai 400097
  - Phone shown: `9289922883`

## Dream Suzuki
- DB:
  - pincode: `400060`, RTO `MH02`, area `Jogeshwari East` -> `J`
  - suggested: `SUZ-02J-DRE`
- Net:
  - Official Suzuki dealer page: https://www.suzukimotorcycleandheriwest.com/

## Udan (Udan Suzuki)
- DB:
  - pincode currently in DB context: `401202`, RTO `MH48`, area `Vasai` -> `V`
  - suggested: `SUZ-48V-UDA`
- Net:
  - Official Suzuki dealer page: https://www.suzukimotorcyclevasaieast.com/
  - Address shown: Near Range Office Sativali, Fatherwadi, Golani Naka, Vasai-Virar, Maharashtra 401208
  - Phone shown: `08071963154`
  - Email shown: `mumbai.udanautomotive.sales@suzukidealers.in`

## Automax Yamaha
- DB:
  - pincode: `400062`, RTO `MH47`, area `Mumbai` -> `M`
  - suggested: `YAM-47M-AUT`
- Net:
  - Listing reference: https://bikekharido.in/dealers/automax-automotive-yamaha/
  - One listed address variant: Malad West, Mumbai 400064
  - Needs official Yamaha dealer-page confirmation in full crawl

## Sahil Yamaha
- DB:
  - pincode: `401404`, RTO `MH48`, area `Palghar` -> `P`
  - suggested: `YAM-48P-SAH`
- Net:
  - Listing: https://www.bharatibiz.com/en/sahil-yamaha_1m-092728-88123
  - Address shown: Sahil Arcade, Boisar 401501
  - Phones shown: `09272888123`, `08421177448`
  - Email shown: `sahilyamaha@gmail.com`
  - Needs official Yamaha confirmation in full crawl

## Suryodaya Bajaj
- DB:
  - pincode: `401208`, RTO `MH48`, area `Vasai` -> `V`
  - suggested: `BAJ-48V-SUR`
- Net:
  - Aggregator reference: https://www.bikedekho.com/hi/showrooms/bajaj/mumbai/suryoday-bajaj-vasai-east-50063208
  - Needs official Bajaj page confirmation in full crawl

## Myscooty
- DB:
  - Primary brand currently from `dealer_brands`: `APRILIA`
  - pincode: `401209`, RTO `MH48`, area `Vasai` -> `V`
  - suggested: `APR-48V-MYS`
- Net:
  - No strong official source resolved in initial pass; full crawl needed

## Studio 48C
- DB:
  - Primary brand currently from `dealer_brands`: `APRILIA`
  - pincode: `401203`, RTO `MH48`, area `Nallasopara` -> `N`
  - suggested: `APR-48N-STU`
- Net:
  - No strong official source resolved in initial pass; full crawl needed

## Open Issues For Selection
1. Arni TVS has multi-location presence (Nalasopara/Vasai/Virar). Primary location decision affects area letter.
2. Udan DB pincode and public-site pincode differ (`401202` vs `401208`) -> resolve before final studio code lock.
3. Yamaha/Bajaj/APRILIA dealerships need official-source confirmation for all branch + contact records.
4. For each dealership, one primary location must be selected; all others retained as branch entries.

