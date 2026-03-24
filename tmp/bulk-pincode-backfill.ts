/**
 * Bulk Pincode Backfill Script — Full Normalization
 *
 * 1. Gets ALL unique valid pincodes from id_members
 * 2. Fetches canonical state/district/area from postalpincode.in API
 * 3. Upserts into loc_pincodes (overwrites typos with canonical data)
 * 4. Backfills ALL id_members country/state/district/taluka from loc_pincodes
 *    — this fixes typos like "Punee" → "Pune", "MAHARASHTRA" → "Maharashtra"
 *
 * Run: npx tsx --env-file=.env.local tmp/bulk-pincode-backfill.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const PINCODE_API = 'https://api.postalpincode.in/pincode';
const BATCH_SIZE = 5; // concurrent API calls
const DELAY_MS = 350; // rate-limit pause between batches
const UPDATE_CHUNK = 500; // members updated per SQL chunk

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Normalize to Title Case, trim whitespace */
function toTitleCase(s: string): string {
    return s.trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

async function fetchPincodeData(pincode: string): Promise<{
    state: string;
    district: string;
    taluka: string;
    area: string;
} | null> {
    try {
        const res = await fetch(`${PINCODE_API}/${pincode}`);
        if (!res.ok) return null;
        const json = await res.json();
        if (!json?.[0] || json[0].Status !== 'Success') return null;
        const po = json[0].PostOffice?.[0];
        if (!po) return null;

        return {
            state: toTitleCase(po.State || ''),
            district: toTitleCase(po.District || ''),
            taluka: toTitleCase(po.Block || po.Taluk || po.Division || ''),
            area: toTitleCase(po.Name || ''),
        };
    } catch {
        return null;
    }
}

async function main() {
    // ─── PHASE 1: Collect all unique valid pincodes from ALL members ───
    console.log('📍 Fetching all unique pincodes from id_members...');

    const { data: members, error } = await supabase
        .from('id_members')
        .select('pincode')
        .not('pincode', 'is', null)
        .neq('pincode', '');

    if (error) {
        console.error(error);
        process.exit(1);
    }

    const uniquePincodes = [
        ...new Set(
            (members ?? []).map(m => m.pincode?.trim()).filter((p): p is string => !!p && /^[1-9][0-9]{5}$/.test(p))
        ),
    ];

    console.log(`🔍 ${uniquePincodes.length} unique valid pincodes found`);

    // ─── PHASE 2: Enrich loc_pincodes from API ───
    console.log(`\n🌐 Calling postalpincode.in API (batch=${BATCH_SIZE}, delay=${DELAY_MS}ms)...`);
    let enriched = 0,
        already = 0,
        failed = 0;

    for (let i = 0; i < uniquePincodes.length; i += BATCH_SIZE) {
        const batch = uniquePincodes.slice(i, i + BATCH_SIZE);

        await Promise.all(
            batch.map(async pincode => {
                const data = await fetchPincodeData(pincode);
                if (!data || !data.state) {
                    failed++;
                    return;
                }

                const { error: upsertErr } = await supabase.from('loc_pincodes').upsert(
                    {
                        pincode,
                        state: data.state,
                        district: data.district,
                        taluka: data.taluka,
                        area: data.area,
                        country: 'India',
                        status: 'Deliverable',
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'pincode' }
                );

                if (upsertErr) {
                    failed++;
                } else {
                    enriched++;
                }
            })
        );

        const done = Math.min(i + BATCH_SIZE, uniquePincodes.length);
        process.stdout.write(`\r⚡ ${done}/${uniquePincodes.length} | ✅ ${enriched} enriched | ❌ ${failed} failed`);

        await sleep(DELAY_MS);
    }

    console.log('\n');

    // ─── PHASE 3: Backfill ALL members from loc_pincodes (in chunks) ───
    console.log('🔄 Backfilling id_members from loc_pincodes (all members, overwrites typos)...');

    // Get all pincodes that exist in loc_pincodes
    const { data: locRows } = await supabase.from('loc_pincodes').select('pincode, state, district, taluka, country');

    if (!locRows?.length) {
        console.error('❌ No loc_pincodes data found!');
        process.exit(1);
    }

    // Build a map for fast lookup
    const locMap = new Map(locRows.map(r => [r.pincode, r]));

    // Get all members with valid pincodes
    const { data: allMembers } = await supabase
        .from('id_members')
        .select('id, pincode, state, district, taluka, country')
        .not('pincode', 'is', null)
        .neq('pincode', '');

    const toUpdate: Array<{ id: string; country: string; state: string; district: string; taluka?: string }> = [];

    for (const m of allMembers ?? []) {
        const loc = locMap.get(m.pincode?.trim());
        if (!loc) continue;

        // Always set country. Update state/district if API data differs (typo fix)
        const newState = loc.state;
        const newDistrict = loc.district;
        const newCountry = 'India';
        const newTaluka = loc.taluka || m.taluka;

        // Only queue update if something actually changes
        if (m.country !== newCountry || m.state !== newState || m.district !== newDistrict) {
            toUpdate.push({ id: m.id, country: newCountry, state: newState, district: newDistrict, taluka: newTaluka });
        }
    }

    console.log(`📝 ${toUpdate.length} members need update`);

    // Chunk updates
    let updated = 0;
    for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK) {
        const chunk = toUpdate.slice(i, i + UPDATE_CHUNK);

        await Promise.all(
            chunk.map(async row => {
                const { error: updErr } = await supabase
                    .from('id_members')
                    .update({
                        country: row.country,
                        state: row.state,
                        district: row.district,
                        ...(row.taluka ? { taluka: row.taluka } : {}),
                    })
                    .eq('id', row.id);

                if (!updErr) updated++;
            })
        );

        process.stdout.write(`\r🔄 Updated ${Math.min(i + UPDATE_CHUNK, toUpdate.length)}/${toUpdate.length} members`);
    }

    // ─── PHASE 4: Final stats ───
    const { count: missingState } = await supabase
        .from('id_members')
        .select('*', { count: 'exact', head: true })
        .or('state.is.null,state.eq.');

    const { count: missingDistrict } = await supabase
        .from('id_members')
        .select('*', { count: 'exact', head: true })
        .or('district.is.null,district.eq.');

    console.log(`\n\n✅ Done!`);
    console.log(`   loc_pincodes enriched : ${enriched}`);
    console.log(`   API failures (bad pin): ${failed}`);
    console.log(`   Members updated       : ${updated}`);
    console.log(`   Still missing state   : ${missingState}`);
    console.log(`   Still missing district: ${missingDistrict}`);
}

main().catch(console.error);
