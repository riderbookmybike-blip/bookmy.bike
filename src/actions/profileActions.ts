'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateMemberProfile(memberId: string, updates: any) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('id_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

    if (error) {
        console.error('[profileActions] Error updating profile:', error);
        throw new Error(error.message);
    }

    revalidatePath('/profile');
    return data;
}

export async function upsertMemberAddress(address: any) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('id_member_addresses')
        .upsert(address)
        .select()
        .single();

    if (error) {
        console.error('[profileActions] Error upserting address:', error);
        throw new Error(error.message);
    }

    revalidatePath('/profile');
    return data;
}

export async function deleteMemberAddress(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('id_member_addresses')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[profileActions] Error deleting address:', error);
        throw new Error(error.message);
    }

    revalidatePath('/profile');
}
