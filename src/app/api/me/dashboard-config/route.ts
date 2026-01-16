import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantType = searchParams.get('tenantType');
    const role = searchParams.get('role');

    if (!tenantType || !role) {
        return NextResponse.json({ error: 'Missing context' }, { status: 400 });
    }

    // 2. Find Assignment
    const { data: assignment } = await supabase
        .from('role_template_assignments')
        .select('template_id')
        .eq('tenant_type', tenantType)
        .eq('role', role)
        .single();

    if (!assignment?.template_id) {
        return NextResponse.json({ found: false });
    }

    // 3. Fetch Template Config
    const { data: template } = await supabase
        .from('dashboard_templates')
        .select('layout_config')
        .eq('id', assignment.template_id)
        .single();

    if (!template) {
        return NextResponse.json({ found: false });
    }

    return NextResponse.json({
        found: true,
        config: template.layout_config
    });
}
