import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/utils/errorMessage';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient(); // Use server client which respects user session (AUMS only) or Service Role if needed.

        // Check if system
        const { data: tmpl } = await supabase.from('sys_dashboard_templates').select('is_system').eq('id', id).single();
        if (tmpl?.is_system) {
            return NextResponse.json({ success: false, error: 'Cannot delete system templates' }, { status: 403 });
        }

        const { error } = await supabase.from('sys_dashboard_templates').delete().eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
    }
}
