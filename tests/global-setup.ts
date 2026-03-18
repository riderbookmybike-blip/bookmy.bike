/**
 * Playwright global setup — runs in pure Node.js before any browser tests.
 * Inserts a 'ZZ'-state cat_price_dealer fixture row via Supabase JS client
 * (service role, Node.js only — bypasses Supabase browser-key restrictions).
 * Writes the inserted row ID to /tmp/pw-fixture-state.json for tests to read.
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = 'https://aytdeqjxxjxbgiyslubx.supabase.co';
const STATE_FILE = '/tmp/pw-fixture-state.json';

// Anchor row metadata — TVS Autorace / NTORQ 150 Stealth Silver / MH
const FIXTURE = {
    tenant_id: 'a63882c6-fb5d-401c-b2ac-889589f834a2',
    vehicle_color_id: '1e580b96-2663-489f-9292-a195aca6f93c',
    state_code: 'ZZ', // sentinel — impossible in Indian state list, guaranteed no collision
    offer_amount: -500,
    is_active: true,
    inclusion_type: 'OPTIONAL',
    tat_days: 7,
};

async function globalSetup() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        console.warn('[global-setup] SUPABASE_SERVICE_ROLE_KEY not set — skipping fixture insert');
        fs.writeFileSync(STATE_FILE, JSON.stringify({ removableRowId: null }));
        return;
    }

    const sb = createClient(SUPABASE_URL, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Clean up any leftover ZZ row from a previous failed run first
    await sb.from('cat_price_dealer').delete().match({
        tenant_id: FIXTURE.tenant_id,
        vehicle_color_id: FIXTURE.vehicle_color_id,
        state_code: FIXTURE.state_code,
    });

    // Insert fresh fixture row
    const { data, error } = await sb.from('cat_price_dealer').insert(FIXTURE).select('id').single();

    if (error || !data?.id) {
        const msg = `[global-setup] Fixture insert failed: ${error?.message ?? 'no id returned'}`;
        console.error(msg);
        fs.writeFileSync(STATE_FILE, JSON.stringify({ removableRowId: null, error: msg }));
        throw new Error(msg);
    }

    console.log(`[global-setup] Fixture row inserted: ${data.id}`);
    fs.writeFileSync(STATE_FILE, JSON.stringify({ removableRowId: data.id }));
}

export default globalSetup;
