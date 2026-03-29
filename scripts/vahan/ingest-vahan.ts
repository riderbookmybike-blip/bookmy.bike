import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables manually since this is a naked script out of next runtime context
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to bypass RLS

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
    MH99: 'TC Office',
    MH202: 'Chiplun Track',
    MH203: 'Mira Bhayandar Fitness Track',
};

// Normalize the OEM name consistently
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

async function ingest() {
    console.log('🚀 Starting Maharashtra VAHAN JSON Data Ingestion...');
    const snapshotDate = resolveSnapshotDate();
    console.log(`🗓️ Snapshot Date: ${snapshotDate}`);
    const snapshotYear = Number(snapshotDate.slice(0, 4));
    const snapshotMonth = Number(snapshotDate.slice(5, 7));
    const ingestCurrentMonthOnly = String(process.env.INGEST_CURRENT_MONTH_ONLY || 'true').toLowerCase() !== 'false';
    const writeDailySnapshots = String(process.env.INGEST_WRITE_DAILY_SNAPSHOTS || 'false').toLowerCase() === 'true';
    console.log(
        `⚙️ Mode: ${ingestCurrentMonthOnly ? 'current-month-only' : 'all-months'} | daily-snapshots=${writeDailySnapshots ? 'on' : 'off'}`
    );
    const filteredYears = new Set(
        String(process.env.INGEST_YEAR || process.env.INGEST_YEARS || '')
            .split(',')
            .map(v => v.trim())
            .filter(Boolean)
    );
    const filteredRtoCodes = new Set(
        String(process.env.INGEST_RTO_CODES || '')
            .split(',')
            .map(v => String(Number(v.trim())))
            .filter(v => v && v !== 'NaN')
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
                `🧭 Scope filter active from ${ingestScopePath}: RTO=${scopeRto || 'ALL'}, YEARS=${scopeYears.join(',') || 'ALL'}`
            );
        } catch (e: any) {
            const msg = `Failed to read INGEST_SCOPE_FILE (${ingestScopePath}): ${e?.message || e}`;
            if (strictScope) {
                throw new Error(msg);
            }
            console.warn(`⚠️ ${msg}`);
        }
    }
    if (filteredYears.size > 0) {
        console.log(`🎯 Year filter active: ${Array.from(filteredYears).join(', ')}`);
    }
    if (filteredRtoCodes.size > 0) {
        console.log(`🎯 RTO filter active: ${Array.from(filteredRtoCodes).join(', ')}`);
    }

    // 1. Fetch the OEM constraints mapping
    console.log('\n1. Fetching Single Source of Truth `vahan_oem_brand_map`...');
    const { data: brandMapData, error: mapErr } = await supabase
        .from('vahan_oem_brand_map')
        .select('row_label_key, brand_name');

    if (mapErr) {
        console.error('Failed to fetch brand map:', mapErr.message);
        process.exit(1);
    }

    const validMakers = new Set<string>();
    const officialBrands = new Map<string, string>();
    brandMapData.forEach((row: any) => {
        const rawKey = normalizeMakerKey(row.row_label_key);
        validMakers.add(rawKey);
        officialBrands.set(rawKey, row.brand_name || rawKey);
    });
    console.log(`✅ Loaded ${validMakers.size} authorized OEM mappings.`);

    // 2. Discover local JSON artifacts
    const pwd = path.join(process.cwd(), 'scripts', 'vahan');
    const fileRegex = /^vahan_Maker_Month_(\d+)_(\d{4})\.json$/; // captures RTO code & Year from: vahan_Maker_Month_48_2026.json
    const files = fs
        .readdirSync(pwd)
        .filter(f => fileRegex.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (files.length === 0) {
        console.warn('⚠️ No matching vahan_Maker_Month_*.json files found. Have you executed the scraping service?');
        process.exit(0);
    }

    let totalValidRecords = 0;
    let totalLogs = 0;

    for (const file of files) {
        const match = file.match(fileRegex);
        if (!match) continue;

        const parsedRtoCode = match[1]; // e.g: 48
        const parsedYear = match[2]; // e.g: 2026
        if (filteredYears.size > 0 && !filteredYears.has(parsedYear)) {
            continue;
        }
        if (filteredRtoCodes.size > 0 && !filteredRtoCodes.has(String(Number(parsedRtoCode)))) {
            continue;
        }
        if (String(Number(parsedRtoCode)) === '99') {
            console.log(`\n⏭️ Skipping File: ${file} (RTO MH99 excluded by policy)`);
            continue;
        }
        const rtoCodeStr = `MH${parsedRtoCode.padStart(2, '0')}`; // e.g., MH48

        console.log(`\n📄 Processing File: ${file} (RTO: ${rtoCodeStr}, Year: ${parsedYear})`);

        let rawData;
        try {
            rawData = JSON.parse(fs.readFileSync(path.join(pwd, file), 'utf-8'));
        } catch (e) {
            console.error(`❌ Failed to parse JSON file ${file}`);
            continue;
        }

        const validPayloads: any[] = [];
        const dailyPayloads: any[] = [];
        const quarantineMap: { [key: string]: number } = {};
        const monthsKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (const record of rawData) {
            if (!Array.isArray(record) || record.length < 3) continue;

            const rawMaker = record[1]; // Index 1 is Maker
            const normalizedKey = normalizeMakerKey(rawMaker);

            if (validMakers.has(normalizedKey)) {
                // Valid OEM - Insert metric for all populated months
                const canonicalName = officialBrands.get(normalizedKey) || rawMaker;

                // Months start at index 2. The last index is 'Total'.
                const monthEndIndex = record.length - 1;

                for (let i = 2; i < monthEndIndex; i++) {
                    const monthLabel = monthsKeys[i - 2];
                    if (!monthLabel) break; // Safe guard for months > 12

                    const monthNo = i - 1; // Index 2 is month 1 (Jan)
                    const yearNo = parseInt(parsedYear, 10);
                    if (ingestCurrentMonthOnly && (yearNo !== snapshotYear || monthNo !== snapshotMonth)) {
                        continue;
                    }

                    const units = parseInt(record[i] || '0', 10);
                    if (!isNaN(units) && units > 0) {
                        const baseRecord = {
                            state_code: 'MH',
                            state_name: 'Maharashtra',
                            rto_code: rtoCodeStr,
                            rto_name: MH_RTO_NAMES[rtoCodeStr] || rtoCodeStr,
                            year: yearNo,
                            month_no: monthNo,
                            month_label: monthLabel,
                            maker: rawMaker,
                            brand_name: canonicalName,
                            units: units,
                            source_file_name: file,
                            uploaded_at: new Date().toISOString(),
                        };
                        validPayloads.push(baseRecord);
                        if (writeDailySnapshots) {
                            dailyPayloads.push({
                                ...baseRecord,
                                snapshot_date: snapshotDate,
                            });
                        }
                    }
                }
            } else {
                // Quarantine OEM!
                if (!quarantineMap[rawMaker]) quarantineMap[rawMaker] = 0;
                quarantineMap[rawMaker]++;
            }
        }

        // Process valid Payload chunks to avoid Supabase Request 1MB limit
        if (validPayloads.length > 0) {
            console.log(`📡 Upserting ${validPayloads.length} pure Two-Wheeler records into DB context...`);
            // We chunk by 500 rows to be ultra-safe
            for (let i = 0; i < validPayloads.length; i += 500) {
                const chunk = validPayloads.slice(i, i + 500);
                const { error: upsertErr } = await supabase
                    .from('vahan_two_wheeler_monthly_uploads')
                    .upsert(chunk, { onConflict: 'state_code, rto_code, year, month_no, maker' });

                if (upsertErr) {
                    console.error(`❌ DB Upsert Error for chunk [${i}-${i + 500}]:`, upsertErr.message);
                } else {
                    totalValidRecords += chunk.length;
                }
            }
        }

        if (writeDailySnapshots && dailyPayloads.length > 0) {
            console.log(`📸 Upserting ${dailyPayloads.length} daily snapshot rows...`);
            for (let i = 0; i < dailyPayloads.length; i += 500) {
                const chunk = dailyPayloads.slice(i, i + 500);
                const { error: dailyErr } = await supabase
                    .from('vahan_two_wheeler_daily_snapshots')
                    .upsert(chunk, { onConflict: 'state_code,rto_code,year,month_no,maker,snapshot_date' });

                if (dailyErr) {
                    console.error(`❌ Daily Snapshot Upsert Error for chunk [${i}-${i + 500}]:`, dailyErr.message);
                }
            }
        }

        // Process Quarantine
        const quarantineKeys = Object.keys(quarantineMap);
        if (quarantineKeys.length > 0) {
            console.log(`🔒 Quarantining ${quarantineKeys.length} unregistered active OEMs (e.g. Trucks/Tractors).`);
            for (const rawMaker of quarantineKeys) {
                const occurrences = quarantineMap[rawMaker];

                // Standard idempotent Upsert logic via RPC or Direct Supabase API
                // Since there is no onConflict DO UPDATE SET supported out of box explicitly with JS sdk for 'occurrence_count = occurrence_count + X',
                // we will query and add, or rely on a simple insert ignoring increment for this quick script if it complains.
                // Let's query first to be safe, or just bulk it and log.

                const { data: existing } = await supabase
                    .from('vahan_unmapped_oem_log')
                    .select('id, occurrence_count')
                    .eq('raw_maker_name', rawMaker)
                    .maybeSingle();

                if (existing) {
                    await supabase
                        .from('vahan_unmapped_oem_log')
                        .update({
                            occurrence_count: existing.occurrence_count + occurrences,
                            last_seen_at: new Date().toISOString(),
                        })
                        .eq('id', existing.id);
                } else {
                    await supabase
                        .from('vahan_unmapped_oem_log')
                        .insert({ raw_maker_name: rawMaker, occurrence_count: occurrences });
                }
                totalLogs++;
            }
        }
    }

    console.log(`\n🎉 INGESTION COMPLETE!`);
    console.log(`🟢 ${totalValidRecords} OEM pure-telemetry points merged into database.`);
    console.log(`🔒 ${totalLogs} unverified tracking entries quarantined.`);

    if (writeDailySnapshots) {
        const cleanupBefore = new Date(`${snapshotDate}T00:00:00+05:30`);
        cleanupBefore.setDate(cleanupBefore.getDate() - 35);
        const cutoffDate = cleanupBefore.toISOString().slice(0, 10);
        const { error: cleanupErr } = await supabase
            .from('vahan_two_wheeler_daily_snapshots')
            .delete()
            .lt('snapshot_date', cutoffDate);
        if (cleanupErr) {
            console.error(`⚠️ Daily snapshot cleanup failed for cutoff ${cutoffDate}:`, cleanupErr.message);
        } else {
            console.log(`🧹 Daily snapshot cleanup complete. Retained last 35 days (cutoff ${cutoffDate}).`);
        }
    }
}

ingest().catch(err => {
    console.error(err);
    process.exit(1);
});
