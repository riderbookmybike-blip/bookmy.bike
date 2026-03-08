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
    else {
        const modeMatch = s.match(/(\([^)]+\))$/);
        if (modeMatch) rest = modeMatch[1];
    }
    if (isNaN(v)) return s;
    let kw: number;
    if (unit === 'kw') kw = v;
    else if (unit === 'ps') kw = v / 1.35962;
    else kw = v / 1.34102;
    const ps = kw * 1.35962;
    const bhp = kw * 1.34102;
    const f = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
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
    return s
        .replace(/^([\d,.]+)\s*nm/i, '$1 Nm')
        .replace(/@\s*([\d,.]+)/i, '@ $1')
        .replace(/(\d+)\s*rpm/i, '$1 rpm');
}

function explodeEngineType(raw: string): Record<string, string> {
    const parts = raw.split(',').map((p: any) => p.trim());
    const result: Record<string, string> = {};
    parts.forEach((p: any) => {
        const lp = p.toLowerCase();
        if (lp.includes('stroke')) result['stroke'] = p;
        else if (lp.includes('cylinder') || lp.includes('1 cylinder')) result['cylinders'] = p;
        else if (lp.includes('cooled')) result['cooling'] = p;
        else if (lp.includes('valves') || (lp.match(/\d+v$/) && !lp.includes('volt'))) result['valves'] = p;
        else if (lp.includes('sohc') || lp.includes('dohc') || lp.includes('ohc')) result['valvetrain'] = p;
        else if (lp.includes('fi') || lp.includes('carburetor') || lp.includes('injection')) result['induction'] = p;
        else if (lp.includes('si engine') || lp.includes('single cylinder')) result['detail'] = p;
    });
    return result;
}

// ─── Execution Logic ──────────────────────────────────────────

async function runMigration() {
    console.log('🚀 Starting Bulk Spec Normalization (Production Level)...');

    const { data: variants, error } = await supabase
        .from('cat_variants_vehicle')
        .select('id, name, engine_type, max_power, max_torque, cooling_system, num_valves, cylinders');

    if (error) {
        console.error('Error fetching variants:', error);
        return;
    }

    console.log(`Fetched ${variants.length} variants.`);
    let updateCount = 0;

    for (const v of variants) {
        const updates: any = {};
        let needsUpdate = false;

        // 1. Power & Torque
        const np = normalizePower(v.max_power || '');
        if (np && np !== v.max_power && !v.max_power?.includes('PS /')) {
            updates.max_power = np;
            needsUpdate = true;
        }

        const nt = normalizeTorque(v.max_torque || '');
        if (nt && nt !== v.max_torque) {
            updates.max_torque = nt;
            needsUpdate = true;
        }

        // 2. Engine Type Cleanup
        if (v.engine_type && v.engine_type.includes(',')) {
            const exploded = explodeEngineType(v.engine_type);

            if (exploded['cooling'] && !v.cooling_system) {
                updates.cooling_system = exploded['cooling'];
                needsUpdate = true;
            }
            if (exploded['valves']) {
                const vm = exploded['valves'].match(/(\d+)/);
                if (vm && !v.num_valves) {
                    updates.num_valves = parseInt(vm[1]);
                    needsUpdate = true;
                }
            }
            if (exploded['cylinders']) {
                const cm = exploded['cylinders'].match(/(\d+)/);
                if (cm && !v.cylinders) {
                    updates.cylinders = parseInt(cm[1]);
                    needsUpdate = true;
                }
            }

            // Clean engine_type residue
            const parts = v.engine_type.split(',').map((p: any) => p.trim());
            const residue = parts
                .filter((p: any) => {
                    const lp = p.toLowerCase();
                    return (
                        !lp.includes('stroke') &&
                        !lp.includes('cooled') &&
                        !lp.includes('valves') &&
                        !lp.includes('cylinder') &&
                        !lp.includes('sohc') &&
                        !lp.includes('dohc') &&
                        !lp.includes('ohc') &&
                        !lp.includes('fi')
                    );
                })
                .join(', ');

            let finalEngineType = residue || parts[0];
            if (finalEngineType !== v.engine_type) {
                updates.engine_type = finalEngineType;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            process.stdout.write(`Updating ${v.name}... `);
            const { error: upErr } = await supabase.from('cat_variants_vehicle').update(updates).eq('id', v.id);

            if (upErr) {
                console.log('❌ Error');
                console.error(upErr);
            } else {
                console.log('✅ Done');
                updateCount++;
            }
        }
    }

    console.log(`\n🎉 Migration finished. ${updateCount} rows updated.`);
}

runMigration().catch(console.error);
