import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

type ReviewItem = {
    id: string;
    status: 'pending' | 'decided';
    reason: string;
    model_id: string;
    model_name: string;
    variant_id: string;
    variant_name: string;
    spec_key: string;
    current_value: string | number | boolean | null;
    suggested_value: string | number | boolean | null;
    created_at: string;
    decided_at: string | null;
    decision: 'keep' | 'edit' | 'remove' | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PLACEHOLDER_STRINGS = new Set(['na', 'n/a', '-', 'null', 'undefined', 'tbd', 'coming soon']);
const TRIPLE_METRIC_REGEX =
    /^[\d,.]+\s*PS\s*\/\s*[\d,.]+\s*kW\s*\/\s*[\d,.]+\s*bhp(?:\s*@\s*[\d,.]+\s*rpm)?([\s\S]*)?$/i;

const METRIC_REGEX = /^.+\s*\/\s*.+(?:\s*\/\s*.+)*$/i;

const SIMPLE_METRIC_REGEX = /^\d+(?:\.\d+)?\s*[A-Za-z%]+(?:\s*@\s*\d+(?:\.\d+)?\s*rpm)?$/i;

function isPlaceholder(v: unknown): boolean {
    if (typeof v !== 'string') return false;
    return PLACEHOLDER_STRINGS.has(v.trim().toLowerCase());
}

function isValidMetric(v: unknown): boolean {
    if (v === null || v === undefined || v === '') return true;
    if (typeof v !== 'string') return false;
    const s = v.trim();
    if (!s) return false;
    return TRIPLE_METRIC_REGEX.test(s) || METRIC_REGEX.test(s) || SIMPLE_METRIC_REGEX.test(s);
}

function queuePath(): string {
    return path.resolve(process.cwd(), 'reports', 'spec-review-queue.json');
}

function makeId(variantId: string, key: string): string {
    return `${variantId}::${key}`;
}

async function run() {
    const { data: models, error: modelsErr } = await admin.from('cat_models').select('id, name, engine_cc');
    if (modelsErr) throw modelsErr;

    const { data: variants, error: variantsErr } = await admin.from('cat_variants_vehicle').select('*');
    if (variantsErr) throw variantsErr;

    const modelById = new Map((models || []).map(m => [String(m.id), m]));
    const now = new Date().toISOString();
    const issues: ReviewItem[] = [];

    for (const v of variants || []) {
        const model = modelById.get(String(v.model_id));
        const modelName = model?.name || 'Unknown Model';

        if (isPlaceholder(v.engine_type)) {
            issues.push({
                id: makeId(v.id, 'engine_type'),
                status: 'pending',
                reason: 'Placeholder value',
                model_id: String(v.model_id),
                model_name: modelName,
                variant_id: String(v.id),
                variant_name: String(v.name || ''),
                spec_key: 'engine_type',
                current_value: v.engine_type,
                suggested_value: null,
                created_at: now,
                decided_at: null,
                decision: null,
            });
        } else if (typeof v.engine_type === 'string' && v.engine_type.includes(',')) {
            issues.push({
                id: makeId(v.id, 'engine_type'),
                status: 'pending',
                reason: 'Needs engine spec splitting (blob detected)',
                model_id: String(v.model_id),
                model_name: modelName,
                variant_id: String(v.id),
                variant_name: String(v.name || ''),
                spec_key: 'engine_type',
                current_value: v.engine_type,
                suggested_value: null,
                created_at: now,
                decided_at: null,
                decision: null,
            });
        }

        if (!isValidMetric(v.max_power)) {
            issues.push({
                id: makeId(v.id, 'max_power'),
                status: 'pending',
                reason: 'Invalid max_power format',
                model_id: String(v.model_id),
                model_name: modelName,
                variant_id: String(v.id),
                variant_name: String(v.name || ''),
                spec_key: 'max_power',
                current_value: v.max_power,
                suggested_value: null,
                created_at: now,
                decided_at: null,
                decision: null,
            });
        }

        if (!isValidMetric(v.max_torque)) {
            issues.push({
                id: makeId(v.id, 'max_torque'),
                status: 'pending',
                reason: 'Invalid max_torque format',
                model_id: String(v.model_id),
                model_name: modelName,
                variant_id: String(v.id),
                variant_name: String(v.name || ''),
                spec_key: 'max_torque',
                current_value: v.max_torque,
                suggested_value: null,
                created_at: now,
                decided_at: null,
                decision: null,
            });
        }

        if (typeof v.displacement === 'number' && typeof model?.engine_cc === 'number') {
            const delta = Math.abs(v.displacement - model.engine_cc);
            if (delta > 1.5) {
                issues.push({
                    id: makeId(v.id, 'displacement'),
                    status: 'pending',
                    reason: `Displacement mismatch vs model.engine_cc (delta=${delta.toFixed(2)})`,
                    model_id: String(v.model_id),
                    model_name: modelName,
                    variant_id: String(v.id),
                    variant_name: String(v.name || ''),
                    spec_key: 'displacement',
                    current_value: v.displacement,
                    suggested_value: model.engine_cc,
                    created_at: now,
                    decided_at: null,
                    decision: null,
                });
            }
        }

        if (isPlaceholder(v.ride_modes)) {
            issues.push({
                id: makeId(v.id, 'ride_modes'),
                status: 'pending',
                reason: 'Placeholder ride_modes',
                model_id: String(v.model_id),
                model_name: modelName,
                variant_id: String(v.id),
                variant_name: String(v.name || ''),
                spec_key: 'ride_modes',
                current_value: v.ride_modes,
                suggested_value: null,
                created_at: now,
                decided_at: null,
                decision: null,
            });
        }
    }

    fs.mkdirSync(path.resolve(process.cwd(), 'reports'), { recursive: true });
    fs.writeFileSync(queuePath(), JSON.stringify(issues, null, 2));
    console.log(`Built review queue: ${issues.length} item(s) -> reports/spec-review-queue.json`);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
