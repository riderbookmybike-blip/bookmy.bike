import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { TemplateGallery } from '@/components/admin/TemplateGallery';

// Ensure data is fresh
export const dynamic = 'force-dynamic';

async function getTemplates() {
    const supabase = await createClient();
    const { data } = await supabase.from('dashboard_templates').select('*').order('created_at', { ascending: false });
    return data || [];
}

async function getAssignments() {
    const supabase = await createClient();
    const { data } = await supabase.from('role_template_assignments').select('*');
    return data || [];
}

export default async function TemplateStudioPage() {
    const templates = await getTemplates();
    const assignments = await getAssignments();

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Template Studio</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage and assign dashboard layouts for all platform roles.</p>
            </div>

            <TemplateGallery initialTemplates={templates} initialAssignments={assignments} />
        </div>
    );
}
