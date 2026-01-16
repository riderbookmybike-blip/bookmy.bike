import { createClient } from '@/lib/supabase/server';
import { DashboardConfig, SidebarConfig } from '../core/types';

export interface DashboardTemplate {
    id: string;
    name: string;
    description: string;
    tenant_type: string;
    layout_config: DashboardConfig;
    sidebar_config: SidebarConfig;
    is_system: boolean;
    created_at: string;
}

export interface RoleAssignment {
    id: string;
    tenant_type: string;
    role: string;
    template_id: string;
    template_name?: string; // For UI convenience
}

export async function getAllTemplates(tenantFilter?: string) {
    const supabase = await createClient();
    let query = supabase.from('dashboard_templates').select('*').order('name');

    if (tenantFilter) {
        query = query.eq('tenant_type', tenantFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as DashboardTemplate[];
}

export async function getAllAssignments() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('role_template_assignments')
        .select(`
            *,
            dashboard_templates (name)
        `)
        .order('tenant_type')
        .order('role');

    if (error) throw error;

    return data.map((item: any) => ({
        ...item,
        template_name: item.dashboard_templates?.name
    })) as RoleAssignment[];
}

export async function cloneTemplate(templateId: string, newName: string) {
    const supabase = await createClient();

    // 1. Fetch original
    const { data: original, error: fetchError } = await supabase
        .from('dashboard_templates')
        .select('*')
        .eq('id', templateId)
        .single();

    if (fetchError) throw fetchError;

    // 2. Insert copy
    const { data: newTemplate, error: insertError } = await supabase
        .from('dashboard_templates')
        .insert({
            name: newName,
            description: `Clone of ${original.name}`,
            tenant_type: original.tenant_type,
            layout_config: original.layout_config,
            sidebar_config: original.sidebar_config,
            is_system: false
        })
        .select()
        .single();

    if (insertError) throw insertError;
    return newTemplate;
}

export async function assignTemplateToRole(tenantType: string, role: string, templateId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('role_template_assignments')
        .upsert({
            tenant_type: tenantType,
            role: role,
            template_id: templateId
        }, { onConflict: 'tenant_type,role' });

    if (error) throw error;
}
