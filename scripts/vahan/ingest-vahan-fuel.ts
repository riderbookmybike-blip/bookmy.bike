import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE credentials in .env.local');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const MH_RTO_NAMES: Record<string, string> = {
    MH01: 'Mumbai Central',
    MH02: 'Mumbai West',
    MH03: 'Mumbai East',
    MH04: 'Thane',
    MH05: 'Kalyan',
    MH06: 'Pen (Raigad)',
    MH07: 'Sindhudurg (Kudal)',
    MH08: 'Ratnagiri',
    MH09: 'Kolhapur',
    MH10: 'Sangli',
    MH11: 'Satara',
    MH12: 'Pune',
    MH13: 'Solapur',
    MH14: 'Pimpri Chinchwad',
    MH15: 'Nashik',
    MH16: 'Ahilyanagar',
    MH17: 'Srirampur',
    MH18: 'Dhule',
    MH19: 'Jalgaon',
    MH20: 'Chhatrapati Sambhajinagar',
    MH21: 'Jalna',
    MH22: 'Parbhani',
    MH23: 'Beed',
    MH24: 'Latur',
    MH25: 'Dharashiv',
    MH26: 'Nanded',
    MH27: 'Amravati',
    MH28: 'Buldhana',
    MH29: 'Yavatmal',
    MH30: 'Akola',
    MH31: 'Nagpur (Urban)',
    MH32: 'Wardha',
    MH33: 'Gadchiroli',
    MH34: 'Chandrapur',
    MH35: 'Gondia',
    MH36: 'Bhandara',
    MH37: 'Washim',
    MH38: 'Hingoli',
    MH39: 'Nandurbar',
    MH40: 'Nagpur (Rural)',
    MH41: 'Malegaon',
    MH42: 'Baramati',
    MH43: 'Navi Mumbai',
    MH44: 'Ambejogai',
    MH45: 'Akluj',
    MH46: 'Panvel (MMR)',
    MH47: 'Mumbai North',
    MH48: 'Vasai-Virar',
    MH49: 'Nagpur (East)',
    MH50: 'Karad',
    MH51: 'Ichalkaranji',
    MH52: 'Chalisgaon',
    MH53: 'Phaltan',
    MH54: 'Bhadgaon',
    MH55: 'Udgir',
    MH56: 'Khamgaon',
    MH57: 'Vaijapur',
    MH58: 'Ulhasnagar/Ambernath',
};

function normalizeMakerKey(value: unknown): string {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
}

function resolveSnapshotDate(): string {
    const override = String(process.env.SNAPSHOT_DATE || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value || String(now.getUTCFullYear());
    const month = parts.find(p => p.type === 'month')?.value || String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = parts.find(p => p.type === 'day')?.value || String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function main() {
    const snapshotDate = resolveSnapshotDate();
    const snapshotYear = Number(snapshotDate.slice(0, 4));
    const snapshotMonth = Number(snapshotDate.slice(5, 7));
    const ingestCurrentMonthOnly = String(process.env.INGEST_CURRENT_MONTH_ONLY || 'true').toLowerCase() !== 'false';
    const writeDailySnapshots = String(process.env.INGEST_WRITE_DAILY_SNAPSHOTS || 'false').toLowerCase() === 'true';
    const filteredYears = new Set(
        String(process.env.INGEST_YEAR || process.env.INGEST_YEARS || '')
            .split(',')
            .map(v => v.trim())
            .filter(Boolean)
    );
    const filteredRtoCodes = new Set(
        String(process.env.INGEST_RTO_CODES || '')
            .split(',')
            .map(v => v.trim())
            .filter(Boolean)
            .map(v => String(Number(v)))
            .filter(v => v && v !== 'NaN')
    );
    const onlyFuelBuckets = new Set(
        String(process.env.FUEL_BUCKETS || '')
            .split(',')
            .map(v => v.trim().toUpperCase())
            .filter(Boolean)
    );
    const ingestScopePath = String(process.env.INGEST_SCOPE_FILE || '').trim();
    const strictScope = String(process.env.INGEST_STRICT_SCOPE || '').toLowerCase() === 'true';
    if (ingestScopePath) {
        try {
            const raw = fs.readFileSync(path.resolve(process.cwd(), ingestScopePath), 'utf-8');
            const scope = JSON.parse(raw) as { rto_numeric_code?: string; years?: string[] };
            const scopeRto = String(scope?.rto_numeric_code || '').trim();
            const scopeYears = Array.isArray(scope?.years)
                ? scope.years.map(v => String(v).trim()).filter(Boolean)
                : [];
            if (scopeRto) {
                filteredRtoCodes.clear();
                filteredRtoCodes.add(String(Number(scopeRto)));
            }
            if (scopeYears.length > 0) {
                filteredYears.clear();
                scopeYears.forEach(y => filteredYears.add(y));
            }
            console.log(
                `🧭 Fuel scope active from ${ingestScopePath}: RTO=${scopeRto || 'ALL'}, YEARS=${scopeYears.join(',') || 'ALL'}`
            );
        } catch (e: any) {
            const msg = `Failed to read INGEST_SCOPE_FILE (${ingestScopePath}): ${e?.message || e}`;
            if (strictScope) throw new Error(msg);
            console.warn(`⚠️ ${msg}`);
        }
    }

    const { data: brandMapData, error: mapErr } = await supabase
        .from('vahan_oem_brand_map')
        .select('row_label_key, brand_name');
    if (mapErr) {
        console.error('Failed to fetch brand map:', mapErr.message);
        process.exit(1);
    }
    const validMakers = new Set<string>();
    const officialBrands = new Map<string, string>();
    (brandMapData || []).forEach((row: any) => {
        const rawKey = normalizeMakerKey(row.row_label_key);
        validMakers.add(rawKey);
        officialBrands.set(rawKey, row.brand_name || rawKey);
    });

    const dir = path.join(process.cwd(), 'scripts', 'vahan');
    const fileRegex = /^vahan_Maker_Month_(\d+)_(\d{4})_([a-z0-9_-]+)\.json$/i;
    const files = fs
        .readdirSync(dir)
        .filter(f => fileRegex.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    let totalUpserted = 0;
    for (const file of files) {
        const m = file.match(fileRegex);
        if (!m) continue;
        const parsedRtoCode = m[1];
        const parsedYear = m[2];
        const fuelBucket = String(m[3] || '').toUpperCase();

        if (filteredYears.size > 0 && !filteredYears.has(parsedYear)) continue;
        if (filteredRtoCodes.size > 0 && !filteredRtoCodes.has(String(Number(parsedRtoCode)))) continue;
        if (onlyFuelBuckets.size > 0 && !onlyFuelBuckets.has(fuelBucket)) continue;
        if (String(Number(parsedRtoCode)) === '99') continue;

        const rtoCodeStr = `MH${parsedRtoCode.padStart(2, '0')}`;
        const rawData = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
        const monthlyPayload: any[] = [];
        const dailyPayload: any[] = [];
        const monthsKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (const record of rawData) {
            if (!Array.isArray(record) || record.length < 3) continue;
            const rawMaker = record[1];
            const normalizedKey = normalizeMakerKey(rawMaker);
            if (!validMakers.has(normalizedKey)) continue;
            const canonicalName = officialBrands.get(normalizedKey) || rawMaker;
            const monthEndIndex = record.length - 1;
            for (let i = 2; i < monthEndIndex; i++) {
                const monthLabel = monthsKeys[i - 2];
                if (!monthLabel) break;
                const monthNo = i - 1;
                const yearNo = parseInt(parsedYear, 10);
                if (ingestCurrentMonthOnly && (yearNo !== snapshotYear || monthNo !== snapshotMonth)) {
                    continue;
                }
                const units = parseInt(record[i] || '0', 10);
                if (!Number.isFinite(units) || units <= 0) continue;
                const base = {
                    state_code: 'MH',
                    state_name: 'Maharashtra',
                    rto_code: rtoCodeStr,
                    rto_name: MH_RTO_NAMES[rtoCodeStr] || rtoCodeStr,
                    year: yearNo,
                    month_no: monthNo,
                    month_label: monthLabel,
                    maker: rawMaker,
                    brand_name: canonicalName,
                    fuel_bucket: fuelBucket,
                    units,
                    source_file_name: file,
                    uploaded_at: new Date().toISOString(),
                };
                monthlyPayload.push(base);
                if (writeDailySnapshots) {
                    dailyPayload.push({ ...base, snapshot_date: snapshotDate });
                }
            }
        }

        for (let i = 0; i < monthlyPayload.length; i += 500) {
            const chunk = monthlyPayload.slice(i, i + 500);
            const { error } = await supabase
                .from('vahan_two_wheeler_monthly_fuel_uploads')
                .upsert(chunk, { onConflict: 'state_code,rto_code,year,month_no,maker,fuel_bucket' });
            if (error) {
                console.error(`Monthly fuel upsert failed for ${file}:`, error.message);
            } else {
                totalUpserted += chunk.length;
            }
        }

        if (writeDailySnapshots) {
            for (let i = 0; i < dailyPayload.length; i += 500) {
                const chunk = dailyPayload.slice(i, i + 500);
                const { error } = await supabase
                    .from('vahan_two_wheeler_fuel_daily_snapshots')
                    .upsert(chunk, { onConflict: 'snapshot_date,state_code,rto_code,year,month_no,maker,fuel_bucket' });
                if (error) {
                    console.error(`Daily fuel snapshot upsert failed for ${file}:`, error.message);
                }
            }
        }
    }

    console.log(`✅ Fuel-segment ingestion complete. Upserted monthly rows: ${totalUpserted}`);
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
