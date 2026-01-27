import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { TEMPLATES } from '@/modules/templates/seedData';

export async function POST(request: Request) {
    const adminSecret = process.env.ADMIN_API_SECRET;
    const providedSecret = request.headers.get('x-admin-secret') || '';

    if (!adminSecret || providedSecret !== adminSecret) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Use Service Role Key to bypass RLS for seeding
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    try {
        const results = [];

        for (const tmpl of TEMPLATES) {
            // 1. Upsert Template
            // We use name + tenant_type as a loose identifier to avoid duplicates on re-seed
            // But since we don't have a unique constraint on name, we'll check first or just insert if not exists

            // Let's try to match by name+tenant
            const { data: existing } = await supabase
                .from('sys_dashboard_templates')
                .select('id')
                .eq('name', tmpl.name)
                .eq('tenant_type', tmpl.tenant_type)
                .single();

            let templateId = existing?.id;

            if (!templateId) {
                const { data: newTmpl, error: tmplError } = await supabase
                    .from('sys_dashboard_templates')
                    .insert({
                        name: tmpl.name,
                        description: tmpl.description,
                        tenant_type: tmpl.tenant_type,
                        layout_config: tmpl.layout_config,
                        sidebar_config: tmpl.sidebar_config,
                        is_system: true
                    })
                    .select('id')
                    .single();

                if (tmplError) throw tmplError;
                templateId = newTmpl.id;
            } else {
                // Update existing system template
                await supabase
                    .from('sys_dashboard_templates')
                    .update({
                        description: tmpl.description,
                        layout_config: tmpl.layout_config,
                        sidebar_config: tmpl.sidebar_config,
                        is_system: true
                    })
                    .eq('id', templateId);
            }

            // 2. Upsert Role Assignment
            const { error: assignError } = await supabase
                .from('sys_role_templates')
                .upsert(
                    {
                        tenant_type: tmpl.tenant_type,
                        role: tmpl.role,
                        template_id: templateId
                    },
                    { onConflict: 'tenant_type,role' }
                );

            if (assignError) throw assignError;

            results.push({ name: tmpl.name, role: tmpl.role, status: 'seeded' });
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
