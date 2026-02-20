# Hero Passion+ — Source Reference

## Source URL
- Model Page: https://www.heromotocorp.com/en-in/motorcycles/passion-plus.html
- Canonical: https://www.heromotocorp.com/en-in/motorcycles/executive/passion-plus.html
- Buy Now: https://www.heromotocorp.com/en-in/buy-now/executive/passion-plus.html
- Buy Now (alt): https://www.heromotocorp.com/en-in/buy-now/passion-plus.html

## AEM Content Structure (from source code)
- Page Ref: `nRGZOkaSmQr4lE2gW2eqmo-vwRkQB6RV4bhgkTEp0je2z1yImKaRElVbjhB3oY2WGH4bI4S9je_Dw7dz39ykUpS7go2DOAXQLWuru7vbmZuGEWHsyfOpxYFGNiDiicXR`
- Template: `pdp-template`
- Internal Path: `/content/hero-commerce/in/en/products/product-page/executive`
- Category: `executive`
- Page Name: `passion-plus`

## CDN / Asset Paths
- Banner (Web): `/content/dam/hero-commerce/in/en/products/executive/content-fragments/passion-plus/assets/phase-2-assets/banner/banner-passion-web.png`
- Banner (Mob): `/content/dam/hero-commerce/in/en/products/executive/content-fragments/passion-plus/assets/phase-2-assets/banner/banner-passion-mob.png`
- Nav Image: `/content/dam/hero-aem-website/brand/hero-homepage/bike/motorcycles/final-passion-new.png`
- OG Image: `https://www.heromotocorp.com/content/dam/hero-aem-website/brand/logo/hero-logo-og-image.png`
- Base CDN: `https://www.heromotocorp.com/content/dam/hero-commerce/in/en/products/executive/content-fragments/passion-plus/`

## Hero CDN Pattern (Global — applies to ALL models)
```
Base: https://www.heromotocorp.com/content/dam/hero-commerce/in/en/products/
Structure: {category}/content-fragments/{model-slug}/assets/

Categories:
- executive (Passion+, Glamour, Super Splendor)
- practical (Splendor+, HF Deluxe, HF 100)
- performance (Xtreme 125R/160R/160R 4V, XPulse 200 4V, XPulse 210)
- premia (Karizma XMR, Xtreme 250R, Mavrick)
```

## JSON-LD Structured Data (from source)
```json
{
  "@type": "Product",
  "name": "Passion Plus",
  "sku": "passion-plus",
  "brand": {"@type": "Brand", "name": "HeroMotoCorp"},
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "INR",
    "lowPrice": "82451.0",
    "highPrice": "82451.0",
    "offerCount": "1"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "bestRating": "5",
    "ratingCount": "68.0"
  }
}
```

## Google Analytics
- GTM ID: `GTM-NJW8B6`
- Google Maps API Key: `AIzaSyDLGoWGRalSk2SF2L4rEVbMf1g6ksHlOa8`

## Fonts
- TSTAR PRO Medium/Bold/Heavy/Regular (`.ttf`)

## Extracted Specs (from earlier URL scan)
### Engine
- Type: Air cooled, 4 stroke, Single cylinder, OHC
- Displacement: 97.2 cc
- Max Power: 5.9 kW @ 8000 rpm
- Max Torque: 8.05 N·m @ 6000 rpm
- Bore x Stroke: 50.0 x 49.5 mm
- Starting: Self start with i3s & Kick

### Suspension
- Front: Telescopic Hydraulic Shock Absorbers
- Rear: Swingarm with adjustable hydraulic shock absorbers

### Transmission
- Clutch: Multiplate Wet Type
- Transmission: 4 speed Constant Mesh

### Wheels & Tyres
- Front: 80/100-18 - 47 P Tubeless
- Rear: 80/100-18 - 54 P Tubeless

### Brakes
- Front: Drum 130mm / Disc Dia 240mm (variant)
- Rear: Drum 130mm

### Electricals
- Battery: MF : 12V, 4AH
- Headlamp: LED Headlamp

### Dimensions
- Overall Length: 2000 mm
- Overall Width: 720mm (Drum) / 740mm (Disc)
- Overall Height: 1085 mm (Drum) / 1097mm (Disc)
- Seat Height: 795 mm
- Wheelbase: 1230 mm
- Ground Clearance: 165 mm
- Fuel Tank: 11 Litres
- Kerb Weight: 118 Kg / 121 Kg (Disc)

### Key Features
- i3S Technology
- IBS (Integrated Braking System)
- LED Headlamp
- Side Stand Engine Cutoff
- Boot Light
- Hazard Switch
- Multi-Function Switch

## Source Code Status
- ⚠️ Raw source truncated (>1.2MB) — product section (variants, colors, images) not captured
- Header/Navigation captured — contains ALL Hero model nav images + CDN paths
- Product-specific React components load via JS — need DevTools inspection for variant/color data
