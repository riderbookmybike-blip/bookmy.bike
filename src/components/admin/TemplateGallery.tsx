'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Copy,
    Edit,
    Trash2,
    Plus,
    CheckCircle2,
    Loader2
} from 'lucide-react';

interface Template {
    id: string;
    name: string;
    description: string;
    tenant_type: string;
    is_system: boolean;
}

interface Assignment {
    id: string;
    tenant_type: string;
    role: string;
    template_id: string;
}

interface TemplateGalleryProps {
    initialTemplates: Template[];
    initialAssignments?: Assignment[]; // Pass assignments
}

const PREFERRED_TENANTS = ['DEALER', 'BANK', 'AUMS'];

export function TemplateGallery({ initialTemplates, initialAssignments = [] }: TemplateGalleryProps) {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'GALLERY' | 'ASSIGNMENTS'>('GALLERY');
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const tenantOptions = useMemo(() => {
        const dataTenants = Array.from(new Set(initialTemplates.map(t => t.tenant_type).filter(Boolean)));
        const ordered = [
            ...PREFERRED_TENANTS.filter(t => dataTenants.includes(t)),
            ...dataTenants.filter(t => !PREFERRED_TENANTS.includes(t))
        ];
        const unique = Array.from(new Set([...ordered, ...PREFERRED_TENANTS]));
        return ['ALL', ...unique];
    }, [initialTemplates]);
    const [filter, setFilter] = useState<string>(() => {
        const dataTenants = Array.from(new Set(initialTemplates.map(t => t.tenant_type).filter(Boolean)));
        const firstPreferred = PREFERRED_TENANTS.find(t => dataTenants.includes(t));
        return firstPreferred || dataTenants[0] || 'ALL';
    });
    const roles = ['OWNER', 'GM', 'MANAGER', 'TM', 'EXECUTIVE']; // Standard Roles

    const filteredTemplates = filter === 'ALL'
        ? initialTemplates
        : initialTemplates.filter(t => t.tenant_type === filter);

    useEffect(() => {
        if (viewMode === 'ASSIGNMENTS' && filter === 'ALL') {
            const next = PREFERRED_TENANTS.find(t => tenantOptions.includes(t)) || tenantOptions.find(t => t !== 'ALL') || 'DEALER';
            if (next !== filter) setFilter(next);
        }
    }, [filter, tenantOptions, viewMode]);

    const getAssignedTemplateId = (tenant: string, role: string) => {
        return initialAssignments.find(a => a.tenant_type === tenant && a.role === role)?.template_id || '';
    };

    const handleAssign = async (tenant: string, role: string, templateId: string) => {
        if (!templateId) return;
        setLoadingId(`${tenant}-${role}`);
        try {
            const res = await fetch('/api/admin/templates/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenant_type: tenant, role, template_id: templateId })
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert('Failed to assign template');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingId(null);
        }
    };

    const handleClone = async (tmpl: Template) => {
        const newName = prompt(`Enter name for clone of ${tmpl.name}:`, `${tmpl.name} (Copy)`);
        if (!newName) return;

        setLoadingId(tmpl.id);
        try {
            const res = await fetch(`/api/admin/templates/${tmpl.id}/clone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            const data = await res.json();
            if (data.success) {
                router.refresh(); // Refresh server data
            } else {
                alert('Failed to clone: ' + data.error);
            }
        } catch (e) {
            alert('Error cloning template');
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (tmpl: Template) => {
        if (!confirm(`Are you sure you want to delete "${tmpl.name}"?`)) return;

        setLoadingId(tmpl.id);
        try {
            const res = await fetch(`/api/admin/templates/${tmpl.id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                router.refresh();
            } else {
                alert('Failed to delete: ' + data.error);
            }
        } catch (e) {
            alert('Error deleting template');
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="flex gap-4 items-center">
                    {/* View Switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('GALLERY')}
                            className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${viewMode === 'GALLERY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Gallery
                        </button>
                        <button
                            onClick={() => setViewMode('ASSIGNMENTS')}
                            className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${viewMode === 'ASSIGNMENTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            Assignments
                        </button>
                    </div>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>

                    {tenantOptions.map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors border ${filter === t
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                : 'hover:bg-slate-50 border-transparent text-slate-500'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {viewMode === 'GALLERY' && (
                    <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                        <Plus size={18} />
                        <span>New Template</span>
                    </button>
                )}
            </div>

            {/* ASSIGNMENTS VIEW */}
            {viewMode === 'ASSIGNMENTS' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5">
                            <tr>
                                <th className="p-6 font-black text-xs uppercase tracking-wider text-slate-400">Role</th>
                                <th className="p-6 font-black text-xs uppercase tracking-wider text-slate-400">Assigned Template</th>
                                <th className="p-6 font-black text-xs uppercase tracking-wider text-slate-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {roles.map(role => (
                                <tr key={role} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-6 pb-2 sm:pb-6">
                                        <div className="font-bold text-slate-900 dark:text-white">{role}</div>
                                        <div className="text-xs text-slate-400 font-medium mt-1">{filter} Tenant</div>
                                    </td>
                                    <td className="p-6 pt-0 sm:pt-6">
                                        <select
                                            className="w-full max-w-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={getAssignedTemplateId(filter, role)}
                                            onChange={(e) => handleAssign(filter, role, e.target.value)}
                                            disabled={loadingId === `${filter}-${role}`}
                                        >
                                            <option value="">-- Select Template --</option>
                                            {filteredTemplates.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-6 text-right">
                                        {loadingId === `${filter}-${role}` && <Loader2 className="animate-spin text-indigo-600 inline-block" size={18} />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* GALLERY VIEW */}
            {viewMode === 'GALLERY' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredTemplates.length === 0 && (
                        <div className="col-span-full bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-white/5 rounded-3xl p-10 text-center text-slate-500">
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No templates found</div>
                            <div className="text-xs mt-2">
                                {filter === 'ALL'
                                    ? 'Create a new template or seed templates to populate this gallery.'
                                    : `No ${filter.toLowerCase()} templates yet. Try “ALL” or create a new one.`}
                            </div>
                        </div>
                    )}
                    {filteredTemplates.map((tmpl) => (
                        <div key={tmpl.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden hover:shadow-xl hover:border-indigo-500/20 transition-all duration-300 flex flex-col relative">

                            {loadingId === tmpl.id && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-20 flex items-center justify-center backdrop-blur-sm">
                                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                                </div>
                            )}

                            {/* Preview Header */}
                            <div className="h-32 bg-slate-50 dark:bg-slate-900/50 relative p-4 border-b border-slate-100 dark:border-white/5 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10 transition-colors">
                                <div className="absolute top-4 right-4 z-10">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${tmpl.tenant_type === 'DEALER' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        tmpl.tenant_type === 'BANK' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            'bg-purple-50 text-purple-600 border-purple-100'
                                        }`}>
                                        {tmpl.tenant_type}
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 opacity-50 scale-90 origin-top-left w-full h-full">
                                    <div className="col-span-1 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                    <div className="col-span-1 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                    <div className="col-span-2 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                    <div className="col-span-4 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700"></div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate" title={tmpl.name}>{tmpl.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 h-8">{tmpl.description || 'No description provided.'}</p>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-slate-400">
                                    <div className="flex gap-1">
                                        <button
                                            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                                            title="Edit"
                                            onClick={() => alert('Edit Mode Coming Soon')}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-emerald-600"
                                            title="Clone"
                                            onClick={() => handleClone(tmpl)}
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>

                                    {tmpl.is_system ? (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                                            <CheckCircle2 size={12} /> System
                                        </span>
                                    ) : (
                                        <button
                                            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors text-slate-400 hover:text-rose-600"
                                            title="Delete"
                                            onClick={() => handleDelete(tmpl)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
