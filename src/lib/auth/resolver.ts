import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/**
 * Memoized version of auth.getUser()
 * This ensures that multiple Server Components in the same request tree
 * don't trigger redundant auth calls to Supabase.
 */
export const getAuthUser = cache(async () => {
    const supabase = await createClient();
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            console.error('[AuthResolver] Error fetching user:', error.message);
            return null;
        }
        return data.user ?? null;
    } catch (e) {
        console.error('[AuthResolver] Unexpected error in getAuthUser:', e);
        return null;
    }
});

/**
 * Memoized version of auth.getSession()
 */
export const getAuthSession = cache(async () => {
    const supabase = await createClient();
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('[AuthResolver] Error fetching session:', error.message);
            return null;
        }
        return data.session ?? null;
    } catch (e) {
        console.error('[AuthResolver] Unexpected error in getAuthSession:', e);
        return null;
    }
});

/**
 * Memoized Sugabase Server Client to avoid repeated instantiation
 */
export const getSupabaseServerClient = cache(async () => createClient());
