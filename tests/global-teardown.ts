/**
 * Playwright global teardown — runs after all tests complete.
 * Reads the fixture state from /tmp/pw-fixture-state.json and hard-deletes
 * the ZZ-state fixture row from cat_price_dealer.
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = 'https://aytdeqjxxjxbgiyslubx.supabase.co';
const STATE_FILE = '/tmp/pw-fixture-state.json';

async function globalTeardown() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return;

    let removableRowId: string | null = null;
    try {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        removableRowId = JSON.parse(raw).removableRowId ?? null;
    } catch {
        // State file missing — nothing to clean up
        return;
    }

    if (!removableRowId) return;

    const sb = createClient(SUPABASE_URL, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await sb.from('cat_price_dealer').delete().eq('id', removableRowId);

    if (error) {
        console.error(`[global-teardown] Failed to delete fixture row ${removableRowId}: ${error.message}`);
    } else {
        console.log(`[global-teardown] Fixture row ${removableRowId} deleted`);
    }

    // Clean up temp state file
    fs.rmSync(STATE_FILE, { force: true });
}

export default globalTeardown;
