
import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { UnifiedTemplateStudio } from '@/components/admin/UnifiedTemplateStudio';

// Ensure data is fresh
export const dynamic = 'force-dynamic';

async function getDashboardTemplates() {
    const supabase = await createClient();
    const { data } = await supabase.from('sys_dashboard_templates').select('*').order('created_at', { ascending: false });
    return data || [];
}

async function getProductTemplates() {
    const supabase = await createClient();
    const { data } = await supabase.from('cat_templates').select('*').order('name');
    return data || [];
}

async function getAssignments() {
    const supabase = await createClient();
    const { data } = await supabase.from('sys_role_templates').select('*');
    return data || [];
}

export default async function TemplateStudioPage() {
    const dashboardTemplates = await getDashboardTemplates();
    const productTemplates = await getProductTemplates();
    const assignments = await getAssignments();

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Template Studio</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage and assign layout templates for Dashboards and Products.</p>
            </div>

            <UnifiedTemplateStudio
                dashboardTemplates={dashboardTemplates}
                dashboardAssignments={assignments}
                productTemplates={productTemplates}
            />
        </div>
    );
}
