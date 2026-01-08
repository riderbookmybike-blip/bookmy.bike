import { createClient } from '@supabase/supabase-js';

// SERVER-ONLY: Never import this into Client Components
// Note: We use process.env directly to ensure this doesn't accidentally leak to client bundles via NEXT_PUBLIC_

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
    if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: Missing Supabase Admin credentials in production');
    }
}

export const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});
