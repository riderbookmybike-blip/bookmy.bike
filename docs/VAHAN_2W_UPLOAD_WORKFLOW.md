# VAHAN 2W Upload Workflow (Maharashtra)

## Scope
- State: Maharashtra (`MH`)
- Vehicle classes included in totals:
  - `M-Cycle/Scooter`
  - `Moped`
  - `Motorised Cycle (CC > 25cc)`

## Daily process
1. Open `/app/aums/dashboard/vahan-2w`
2. Upload **RTO-wise** Excel file for the target year.
3. Upload **Maker-wise** Excel file for the same year.
4. Charts auto-refresh after upload.

## Required file format
- Source: VAHAN dashboard exported `.xlsx`
- Header title should contain pattern like:
  - `Rto Wise Vehicle Class Data of Maharashtra (2026)`
  - `Maker Wise Vehicle Class Data of Maharashtra (2025)`

## CLI alternatives
- Build seed JSON from local files:
  - `npm run vahan:build-seed -- <file1.xlsx> <file2.xlsx>`
- Import one `.xlsx` directly to Supabase table:
  - `npm run vahan:import -- <file.xlsx>`

## Notes
- Upload mode is intentionally manual-first for reliability.
- Internal sync endpoint is available for future automation hooks:
  - `POST /api/internal/vahan-2w/sync`
