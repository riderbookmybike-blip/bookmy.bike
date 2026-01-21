'use server';

import { createClient } from '@/lib/supabase/server';

export async function checkServiceability(pincode: string) {
    if (!pincode || pincode.length !== 6) {
        return { isServiceable: false, error: 'Invalid pincode' };
    }

    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('pincodes')
            .select('status, city, area')
            .eq('pincode', pincode)
            .single();

        if (error) {
            // If not found in our list, it's not serviceable unless we have a different default
            return {
                isServiceable: false,
                location: null,
                error: 'Pincode not found'
            };
        }

        return {
            isServiceable: data.status === 'Deliverable',
            location: data.city || data.area || 'Unknown',
            status: data.status
        };
    } catch (err) {
        return { isServiceable: false, error: 'Check failed' };
    }
}

export async function bulkUpdateServiceability(pincodes: string[], isServiceable: boolean) {
    const supabase = await createClient();
    const status = isServiceable ? 'Deliverable' : 'Not Deliverable';

    try {
        const { error } = await supabase
            .from('pincodes')
            .update({ status })
            .in('pincode', pincodes);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
