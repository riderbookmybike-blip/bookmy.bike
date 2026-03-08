import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Embedded Normalization Logic ─────────────────────────────

function normalizePower(val: string): string {
    const s = val.trim();
    if (!s || s === '—') return s;
    const valueMatch = s.match(/([\d,.]+)\s*(kW|PS|bhp)/i);
    if (!valueMatch) return s;
    const v = parseFloat(valueMatch[1].replace(/,/g, ''));
    const unit = valueMatch[2].toLowerCase();
    let rest = '';
    const rpmMatch = s.match(/(@[\s\S]*)$/i);
    if (rpmMatch) rest = rpmMatch[1].trim();
    if (isNaN(v)) return s;
    let kw: number;
    if (unit === 'kw') kw = v;
    else if (unit === 'ps') kw = v / 1.35962;
    else kw = v / 1.34102;
    const ps = kw * 1.35962;
    const bhp = kw * 1.34102;
    const f = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

    // Clean mode from the string part
    rest = rest.replace(/\(([^)]+)\)/g, '').trim();

    return `${f(ps)} PS / ${f(kw)} kW / ${f(bhp)} bhp${rest ? ` ${rest}` : ''}`;
}

function normalizeTorque(val: string): string {
    const s = val.trim();
    if (!s || s === '—') return s;
    if (s.includes(' / '))
        return s
            .split(' / ')
            .map(part => normalizeTorque(part))
            .join(' / ');

    let cleaned = s
        .replace(/^([\d,.]+)\s*nm/i, '$1 Nm')
        .replace(/@\s*([\d,.]+)/i, '@ $1')
        .replace(/(\d+)\s*rpm/i, '$1 rpm');
    // Clean mode
    cleaned = cleaned.replace(/\(([^)]+)\)/g, '').trim();
    return cleaned;
}

function extractModes(val: string): string[] {
    const modes: string[] = [];
    const matches = val.matchAll(/\(([^)]+)\)/g);
    for (const match of matches) {
        // Split by / if multiple modes in one bracket like (Urban/Rain)
        const parts = match[1].split(/[/\\]/);
        parts.forEach(p => modes.push(p.trim()));
    }
    return modes;
}

// ─── Execution Logic ──────────────────────────────────────────

async function runMigration() {
    console.log('🚀 Starting Deep Normalization (Ride Mode Migration)...');

    const { data: variants, error } = await supabase
        .from('cat_variants_vehicle')
        .select('id, name, max_power, max_torque, ride_modes');

    if (error) {
        console.error('Error fetching variants:', error);
        return;
    }

    console.log(`Checking ${variants.length} variants for mode extraction...`);
    let updateCount = 0;

    for (const v of variants) {
        const updates: any = {};
        let needsUpdate = false;

        // 1. Extract modes from existing Power/Torque
        const modesFromPower = extractModes(v.max_power || '');
        const modesFromTorque = extractModes(v.max_torque || '');
        const allNewModes = Array.from(new Set([...modesFromPower, ...modesFromTorque]));

        if (allNewModes.length > 0) {
            const currentModes = v.ride_modes ? v.ride_modes.split(',').map((m: any) => m.trim()) : [];
            const mergedModes = Array.from(new Set([...currentModes, ...allNewModes])).filter(
                m => m && m.toLowerCase() !== 'standard'
            );

            if (mergedModes.length > 0) {
                const finalModesString = mergedModes.join(', ');
                if (finalModesString !== v.ride_modes) {
                    updates.ride_modes = finalModesString;
                    needsUpdate = true;
                }
            }
        }

        // 2. Clean Power/Torque (remove the brackets)
        const np = normalizePower(v.max_power || '');
        if (np && np !== v.max_power) {
            updates.max_power = np;
            needsUpdate = true;
        }

        const nt = normalizeTorque(v.max_torque || '');
        if (nt && nt !== v.max_torque) {
            updates.max_torque = nt;
            needsUpdate = true;
        }

        if (needsUpdate) {
            process.stdout.write(`Migrating modes for ${v.name}... `);
            const { error: upErr } = await supabase.from('cat_variants_vehicle').update(updates).eq('id', v.id);

            if (upErr) {
                console.log('❌');
                console.error(upErr);
            } else {
                console.log('✅');
                updateCount++;
            }
        }
    }

    console.log(`\n🎉 Deep Migration finished. ${updateCount} rows updated.`);
}

runMigration().catch(console.error);
