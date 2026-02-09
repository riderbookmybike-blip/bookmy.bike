# BookMyBike (BMB) & AUMS CRM: White Paper
**Status:** Live Technical Specification | **Last Updated:** 2026-02-09

## 📌 Executive Summary
BookMyBike is a high-fidelity, hyper-local vehicle marketplace designed to bridge the gap between digital discovery and physical dealership delivery. It consists of two primary ecosystems: **BMB Marketplace** (Consumer-facing) and **AUMS CRM** (Enterprise/Dealer-facing).

---

## 🚲 Ecosystem 1: BMB Marketplace (The Consumer Cockpit)
Targeting zero-friction vehicle discovery and purchase.

### 1. Discovery Home (`/`)
- **Visual Logic**: Dynamic headers with "Monolith" interactive deck.
- **Key Capability**: High-conversion brand entry points and "How It Works" tactile walk-through.
- **Auto-Sync Update**: New brand hero banners are added here as soon as they are ingested.

### 2. Universal Unified Catalog (`/store/catalog`)
- **Visual Logic**: Dual-viewport strategy (Responsive Sidebar on Desktop, Bottom-sheet on Mobile).
- **Key Capability**: Real-time filtering by CC, Price Range, and Style.
- **Dynamic Feature**: Automatic addition of new specific "Series" (e.g., Yamaha R-Series, MT-Series).

### 3. PDP Cinematic Cockpit (`/store/[make]/[model]/[variant]`)
- **Visual Logic**: 360-degree interactive rotators and Cinematic media galleries.
- **Key Capability**: 
    - **Finance Simulator**: Real-time EMI calculation based on dealership region.
    - **Regional RTO Engine**: Localized on-road price resolution.
- **Dynamic Feature**: 360 viewer frames are hot-swappable via local media sovereignty.

---

## 🏢 Ecosystem 2: AUMS CRM (The Dealer Operations)
Enterprise-grade tools for catalog, price, and lead management.

### 1. Product Studio
- **Role**: Source of Truth for the global hierarchy (`Family -> Variant -> Color -> SKU`).
- **Automation**: In-built HTML scraper for direct data extraction from OEM sites.
- **Capability**: Asset localization (360° frames & thumbnails) hosting.

### 2. Dynamic Quote Editor
- **Role**: Real-time price negotiation and financing tool.
- **Automation**: JIT (Just-In-Time) lead conversion.
- **Capability**: Apply lending partner schemes on-the-fly to calculate downpayment and EMIs.

---

## 🛠 Self-Updating Protocol
This White Paper is managed by the **Antigravity AI Agent**. The following rules ensure its accuracy:
1. **Feature Completion**: When a task is marked `[x]` in `bmb_task.md`, its technical spec is added to the relevant section above.
2. **Schema Drift**: Any database changes (migrations) trigger an update to the "Database Context" (coming soon).
3. **Media Sovereignty**: New localized asset paths are logged here to maintain media audit trails.

---
*Generated and Managed by Antigravity Agent.*
