import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
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

const QUEUE_FILE = path.resolve(process.cwd(), 'reports', 'spec-review-queue.json');
const DECISION_LOG_FILE = path.resolve(process.cwd(), 'reports', 'spec-review-decisions.jsonl');

function loadQueue(): ReviewItem[] {
    if (!fs.existsSync(QUEUE_FILE)) {
        throw new Error('Queue file missing. Run: npx tsx scripts/spec_review_queue_build.ts');
    }
    return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8')) as ReviewItem[];
}

function saveQueue(items: ReviewItem[]) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(items, null, 2));
}

function appendDecisionLog(entry: Record<string, unknown>) {
    fs.mkdirSync(path.resolve(process.cwd(), 'reports'), { recursive: true });
    fs.appendFileSync(DECISION_LOG_FILE, `${JSON.stringify(entry)}\n`);
}

async function applyEdit(item: ReviewItem, value: string) {
    const { error } = await admin
        .from('cat_variants_vehicle')
        .update({ [item.spec_key]: value, updated_at: new Date().toISOString() })
        .eq('id', item.variant_id);
    if (error) throw error;
}

async function applyRemove(item: ReviewItem) {
    const { error } = await admin
        .from('cat_variants_vehicle')
        .update({ [item.spec_key]: null, updated_at: new Date().toISOString() })
        .eq('id', item.variant_id);
    if (error) throw error;
}

async function main() {
    const rl = readline.createInterface({ input, output });
    const items = loadQueue();
    const pending = items.filter(i => i.status === 'pending');

    if (pending.length === 0) {
        console.log('No pending review items.');
        rl.close();
        return;
    }

    console.log(`Pending review items: ${pending.length}`);
    for (const item of pending) {
        console.log('\n----------------------------------------');
        console.log(`Model   : ${item.model_name}`);
        console.log(`Variant : ${item.variant_name} (${item.variant_id})`);
        console.log(`Spec Key: ${item.spec_key}`);
        console.log(`Reason  : ${item.reason}`);
        console.log(`Current : ${JSON.stringify(item.current_value)}`);
        if (item.suggested_value !== null) {
            console.log(`Suggest : ${JSON.stringify(item.suggested_value)}`);
        }
        console.log('Action  : [k]eep, [e]dit, [r]emove, [s]kip, [q]uit');

        const action = (await rl.question('Your choice: ')).trim().toLowerCase();
        if (action === 'q') break;
        if (action === 's' || !action) continue;

        const now = new Date().toISOString();

        try {
            if (action === 'k') {
                item.status = 'decided';
                item.decision = 'keep';
                item.decided_at = now;
            } else if (action === 'e') {
                const next = await rl.question('New value: ');
                await applyEdit(item, next);
                item.status = 'decided';
                item.decision = 'edit';
                item.decided_at = now;
                item.suggested_value = next;
            } else if (action === 'r') {
                await applyRemove(item);
                item.status = 'decided';
                item.decision = 'remove';
                item.decided_at = now;
            } else {
                console.log('Unknown action. Skipped.');
                continue;
            }

            appendDecisionLog({
                at: now,
                item_id: item.id,
                variant_id: item.variant_id,
                spec_key: item.spec_key,
                previous_value: item.current_value,
                decision: item.decision,
                final_value: item.decision === 'remove' ? null : (item.suggested_value ?? item.current_value),
            });
            console.log('Saved.');
            saveQueue(items);
        } catch (err) {
            console.error('Failed to apply decision:', err);
        }
    }

    saveQueue(items);
    rl.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
