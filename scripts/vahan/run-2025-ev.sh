#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

YEAR="${YEAR:-2025}"
BATCH_SIZE="${BATCH_SIZE:-5}"
MAX_BATCHES="${MAX_BATCHES:-30}"
SLEEP_SECS="${SLEEP_SECS:-6}"
LOG_FILE="tmp/vahan_2025_ev_runner.log"

mkdir -p tmp

TARGET_CODES=(
  1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20
  21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40
  41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58
)

pending_count() {
  node - "$YEAR" "${TARGET_CODES[@]}" <<'NODE'
const fs = require('fs');
const path = require('path');
const year = process.argv[2];
const targetCodes = process.argv.slice(3);
const dir = path.join(process.cwd(), 'scripts', 'vahan');
const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
const seen = new Set();
for (const file of files) {
  const m = file.match(/^vahan_Maker_Month_(\d+)_(\d{4})_ev\.json$/i);
  if (!m) continue;
  if (m[2] !== year) continue;
  seen.add(String(Number(m[1])));
}
const pending = targetCodes.filter((c) => !seen.has(String(Number(c))));
console.log(`Pending EV RTOs for ${year}: ${pending.join(', ') || 'NONE'}`);
process.stdout.write(String(pending.length));
NODE
}

echo "===== EV SCRAPING START $(date) =====" | tee -a "$LOG_FILE"
for i in $(seq 1 "$MAX_BATCHES"); do
  echo "===== EV BATCH $i START $(date) =====" | tee -a "$LOG_FILE"

  HEADLESS=true SCRAPE_YEAR="$YEAR" RTO_BATCH_SIZE="$BATCH_SIZE" EXCLUDED_RTO_CODES="99" \
    OUTPUT_SUFFIX="ev" FUEL_FILTERS="ELECTRIC(BOV),PURE EV" \
    npx tsx scripts/vahan/scrape-vahan.ts >> "$LOG_FILE" 2>&1 || true

  INGEST_YEAR="$YEAR" FUEL_BUCKETS="EV" SNAPSHOT_DATE="$(date +%F)" \
    npx tsx scripts/vahan/ingest-vahan-fuel.ts >> "$LOG_FILE" 2>&1 || true

  pending="$(pending_count | tail -1)"
  echo "===== EV BATCH $i END pending=$pending $(date) =====" | tee -a "$LOG_FILE"
  if [ "$pending" = "0" ]; then
    echo "✅ All EV batches done for $YEAR" | tee -a "$LOG_FILE"
    break
  fi
  sleep "$SLEEP_SECS"
done

echo "===== EV SCRAPING COMPLETE $(date) =====" | tee -a "$LOG_FILE"

