# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2026-03-23]

### Added
- Mono-brand dealer offer pipeline now supports end-to-end pricing for vehicles, accessories, and services.
- Dealer catalog pricing now includes compatibility-driven accessory visibility for mono-brand dealerships.
- OCircle member hub expanded with richer profile management, contacts, addresses, and image crop upload flow.

### Changed
- Canonical member identity path moved to `id_members` across authentication/profile/analytics surfaces.
- PDP pricing context resolution strengthened to derive dealer context from explicit dealer, studio, or lead selection.
- Store PDP and registration surfaces refined for clearer pricing and personalization UX.

### Fixed
- Pricing ledger category switching no longer causes blank Accessories/Service tab due to stale render-phase state.

### Notes
- Release includes these commits:
  - `ad290a17`
  - `c7ee13c1`
  - `2ddf4663`
  - `fcfcf6fd`
  - `fcbd87c1`
  - `7b35391a`
