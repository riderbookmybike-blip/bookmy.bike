#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

YEAR="${YEAR:-2026}"
BATCH_SIZE="${BATCH_SIZE:-5}"
MAX_BATCHES="${MAX_BATCHES:-30}"
SLEEP_SECS="${SLEEP_SECS:-3}"
LOG_FILE="${LOG_FILE:-tmp/vahan_batch_runner.log}"

mkdir -p tmp

TARGET_CODES=(
  1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20
  21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40
  41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 99 202 203
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
  const m = file.match(/^vahan_Maker_Month_(\d+)_(\d{4})\.json$/);
  if (!m) continue;
  if (m[2] !== year) continue;
  seen.add(String(Number(m[1])));
}

const pending = targetCodes.filter((c) => !seen.has(String(Number(c))));
process.stdout.write(String(pending.length));
NODE
}

for i in $(seq 1 "$MAX_BATCHES"); do
  echo "===== BATCH $i START $(date) =====" | tee -a "$LOG_FILE"
  HEADLESS=true RTO_BATCH_SIZE="$BATCH_SIZE" npx tsx scripts/vahan/scrape-vahan.ts >> "$LOG_FILE" 2>&1 || true
  npx tsx scripts/vahan/ingest-vahan.ts >> "$LOG_FILE" 2>&1 || true

  pending="$(pending_count)"
  echo "===== BATCH $i END pending=$pending $(date) =====" | tee -a "$LOG_FILE"

  if [ "$pending" = "0" ]; then
    echo "All target RTOs scraped for year $YEAR." | tee -a "$LOG_FILE"
    break
  fi

  sleep "$SLEEP_SECS"
done
