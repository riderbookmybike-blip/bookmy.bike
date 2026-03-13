import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { generateDealerStudioId } from '../src/lib/utils/dealerStudioId';

type TenantRow = {
    id: string;
    name: string | null;
    slug: string | null;
    pincode: string | null;
    type: string | null;
    studio_id: string | null;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
}

const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function withFallbackSuffix(baseStudioId: string, counter: number): string {
    const suffix = ALPHABET[counter % ALPHABET.length];
    return `${baseStudioId.slice(0, -1)}${suffix}`;
}

async function main() {
    const { data, error } = await supabase
        .from('id_tenants')
        .select('id, name, slug, pincode, type, studio_id')
        .in('type', ['DEALER', 'DEALERSHIP'])
        .order('created_at', { ascending: true });

    if (error) throw error;

    const rows = (data || []) as TenantRow[];
    const taken = new Set<string>(
        rows
            .map(r =>
                String(r.studio_id || '')
                    .trim()
                    .toUpperCase()
            )
            .filter(Boolean)
    );
    let updated = 0;
    let unchanged = 0;
    let fallbackCount = 0;

    for (const row of rows) {
        const name = String(row.name || '').trim();
        const slug = String(row.slug || '').trim();
        const pincode = String(row.pincode || '')
            .replace(/\D/g, '')
            .slice(0, 6);

        if (!name || !slug || pincode.length < 4) {
            unchanged += 1;
            continue;
        }

        const currentStudioId = String(row.studio_id || '')
            .trim()
            .toUpperCase();
        if (currentStudioId) {
            taken.delete(currentStudioId);
        }

        const base = generateDealerStudioId(name, slug, pincode).toUpperCase();
        let next = base;
        let counter = 0;

        while (taken.has(next)) {
            counter += 1;
            fallbackCount += 1;
            next = withFallbackSuffix(base, counter);
        }

        if (row.studio_id === next) {
            taken.add(next);
            unchanged += 1;
            continue;
        }

        const { error: updateError } = await supabase.from('id_tenants').update({ studio_id: next }).eq('id', row.id);
        if (updateError) {
            throw new Error(`Failed updating ${row.id}: ${updateError.message}`);
        }
        taken.add(next);
        updated += 1;
    }

    console.log(
        JSON.stringify(
            {
                total: rows.length,
                updated,
                unchanged,
                fallbackCount,
            },
            null,
            2
        )
    );
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
