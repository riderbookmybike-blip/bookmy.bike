import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const iceFile = process.env.ICE_XLSX_PATH || '/Users/rathoreajitmsingh/Desktop/ice brand.xlsx';
const evFile = process.env.EV_XLSX_PATH || '/Users/rathoreajitmsingh/Desktop/ev brand.xlsx';
const outDir = process.env.OUT_DIR || '/Users/rathoreajitmsingh/Desktop';
const dateTag = new Date().toISOString().slice(0, 10);

function normalizeMakerKey(value: unknown): string {
    return String(value || '')
        .replace(/\(IMPORTER:[^)]+\)/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
}

function parseIndianNumber(value: unknown): number {
    const raw = String(value ?? '')
        .replace(/,/g, '')
        .trim();
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
}

function readMakerTotalsFromXlsx(filePath: string): Map<string, number> {
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false }) as any[][];
    const out = new Map<string, number>();
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i] || [];
        const serial = String(row[0] || '').trim();
        const makerRaw = String(row[1] || '')
            .replace(/\s+/g, ' ')
            .trim();
        const total = parseIndianNumber(row[5]);
        if (!/^\d+$/.test(serial) || !makerRaw) continue;
        const maker = normalizeMakerKey(makerRaw);
        out.set(maker, (out.get(maker) || 0) + total);
    }
    return out;
}

async function fetchMakerBrandMap(): Promise<Map<string, string>> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return new Map<string, string>();
    const supabase = createClient(url, key);
    const { data } = await supabase.from('vahan_oem_brand_map').select('row_label_key, brand_name');
    const map = new Map<string, string>();
    for (const row of data || []) {
        map.set(normalizeMakerKey(row.row_label_key), String(row.brand_name || row.row_label_key || 'UNKNOWN'));
    }
    return map;
}

function toCsv(rows: Record<string, any>[], headers: string[]): string {
    const esc = (v: unknown) => {
        const s = String(v ?? '');
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}

async function main() {
    const ice = readMakerTotalsFromXlsx(iceFile);
    const ev = readMakerTotalsFromXlsx(evFile);
    const makerBrandMap = await fetchMakerBrandMap();
    const allMakers = new Set([...ice.keys(), ...ev.keys()]);

    const makerRows: Record<string, any>[] = [];
    for (const maker of Array.from(allMakers).sort((a, b) => a.localeCompare(b))) {
        const iceUnits = ice.get(maker) || 0;
        const evUnits = ev.get(maker) || 0;
        const segment = iceUnits > 0 && evUnits > 0 ? 'BOTH' : iceUnits > 0 ? 'ICE' : 'EV';
        makerRows.push({
            maker_key: maker,
            brand_name: makerBrandMap.get(maker) || maker,
            segment,
            ice_units: iceUnits,
            ev_units: evUnits,
            total_units: iceUnits + evUnits,
        });
    }

    const brandAgg = new Map<string, { ice: number; ev: number; total: number }>();
    for (const row of makerRows) {
        const key = String(row.brand_name || row.maker_key || 'UNKNOWN');
        const prev = brandAgg.get(key) || { ice: 0, ev: 0, total: 0 };
        prev.ice += Number(row.ice_units || 0);
        prev.ev += Number(row.ev_units || 0);
        prev.total += Number(row.total_units || 0);
        brandAgg.set(key, prev);
    }
    const brandRows = Array.from(brandAgg.entries())
        .map(([brand, v]) => ({
            brand_name: brand,
            segment: v.ice > 0 && v.ev > 0 ? 'BOTH' : v.ice > 0 ? 'ICE' : 'EV',
            ice_units: v.ice,
            ev_units: v.ev,
            total_units: v.total,
        }))
        .sort((a, b) => a.brand_name.localeCompare(b.brand_name));

    fs.mkdirSync(outDir, { recursive: true });
    const makerJsonPath = path.join(outDir, `pan_india_maker_ice_ev_segregation_${dateTag}.json`);
    const makerCsvPath = path.join(outDir, `pan_india_maker_ice_ev_segregation_${dateTag}.csv`);
    const brandJsonPath = path.join(outDir, `pan_india_brand_ice_ev_segregation_${dateTag}.json`);
    const brandCsvPath = path.join(outDir, `pan_india_brand_ice_ev_segregation_${dateTag}.csv`);

    fs.writeFileSync(makerJsonPath, JSON.stringify(makerRows, null, 2));
    fs.writeFileSync(
        makerCsvPath,
        toCsv(makerRows, ['maker_key', 'brand_name', 'segment', 'ice_units', 'ev_units', 'total_units'])
    );
    fs.writeFileSync(brandJsonPath, JSON.stringify(brandRows, null, 2));
    fs.writeFileSync(brandCsvPath, toCsv(brandRows, ['brand_name', 'segment', 'ice_units', 'ev_units', 'total_units']));

    console.log(`✅ Generated maker file: ${makerCsvPath}`);
    console.log(`✅ Generated brand file: ${brandCsvPath}`);
    console.log(`📊 Makers: ${makerRows.length} | Brands: ${brandRows.length}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
