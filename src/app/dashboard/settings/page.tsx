'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Users, Building2, Palette, CheckCircle2, Loader2, User } from 'lucide-react';
import { useTenant, TenantConfig } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { tenantConfig, tenantName, tenantId, userRole } = useTenant();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'ORG' | 'BRAND'>('ORG');
    const [saving, setSaving] = useState(false);

    // Form State
    const [orgData, setOrgData] = useState({
        displayName: '',
        location: '',
        supportEmail: '',
        supportPhone: '',
    });

    const [brandData, setBrandData] = useState({
        primaryColor: '#4F46E5',
        logoUrl: '',
    });

    // Initialize state from context
    useEffect(() => {
        if (tenantConfig) {
            setOrgData(prev => ({
                ...prev,
                displayName: tenantConfig.brand?.displayName || tenantName,
                // Location isn't in generic config yet, maybe add to 'brand' or separate 'org' key later if needed
            }));
            setBrandData(prev => ({
                ...prev,
                primaryColor: tenantConfig.brand?.primaryColor || '#4F46E5',
                logoUrl: tenantConfig.brand?.logoUrl || '',
            }));
        }
    }, [tenantConfig, tenantName]);

    const updateConfig = async (newUpdates: Partial<TenantConfig>) => {
        if (!tenantId) return;
        setSaving(true);
        try {
            const supabase = createClient();
            const currentConfig = tenantConfig || {};
            const nextConfig = { ...currentConfig, ...newUpdates };

            const { error } = await supabase
                .from('tenants')
                .update({ config: nextConfig })
                .eq('id', tenantId);

            if (error) throw error;
            // Success feedback?
        } catch (err) {
            console.error('Save failed', err);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveOrg = () => {
        updateConfig({
            brand: {
                ...tenantConfig?.brand,
                primaryColor: tenantConfig?.brand?.primaryColor || '#4F46E5', // Default Indigo
                displayName: orgData.displayName
            }
        });
    };

    const handleSaveBrand = () => {
        updateConfig({
            brand: {
                ...tenantConfig?.brand,
                displayName: orgData.displayName, // Ensure name persists if changed in other tab
                primaryColor: brandData.primaryColor,
                logoUrl: brandData.logoUrl
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-lg shadow-slate-500/30">
                    <Settings size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Configure your organization and portal.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Nav */}
                <div className="md:col-span-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('ORG')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${activeTab === 'ORG' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                        <Building2 size={18} /> Organization
                    </button>
                    <button
                        onClick={() => setActiveTab('BRAND')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${activeTab === 'BRAND' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                        <Palette size={18} /> Branding
                    </button>
                    <Link
                        href="/dashboard/settings/team"
                        className="w-full text-left px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 text-sm font-bold flex items-center gap-3 transition-colors"
                    >
                        <Users size={18} /> Team Members
                    </Link>
                    <Link
                        href="/dashboard/settings/profile"
                        className="w-full text-left px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 text-sm font-bold flex items-center gap-3 transition-colors"
                    >
                        <Users size={18} /> My Profile
                    </Link>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-6">
                    {/* Organization Tab */}
                    {activeTab === 'ORG' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-sm space-y-6 animate-in fade-in">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Organization Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Display Name</label>
                                    <input
                                        type="text"
                                        value={orgData.displayName}
                                        onChange={e => setOrgData({ ...orgData, displayName: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Location</label>
                                    <input
                                        type="text"
                                        value={orgData.location}
                                        onChange={e => setOrgData({ ...orgData, location: e.target.value })}
                                        placeholder="City, State"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                                <button
                                    onClick={handleSaveOrg}
                                    disabled={saving}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Save Changes</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Branding Tab */}
                    {activeTab === 'BRAND' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-sm space-y-6 animate-in fade-in">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Look & Feel</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4 block">Primary Brand Color</label>
                                    <div className="flex gap-4 flex-wrap">
                                        {['#4F46E5', '#DC2626', '#059669', '#2563EB', '#D946EF', '#EA580C'].map(c => (
                                            <div
                                                key={c}
                                                onClick={() => setBrandData({ ...brandData, primaryColor: c })}
                                                className={`w-12 h-12 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center ${brandData.primaryColor === c ? 'ring-4 ring-offset-2 ring-indigo-500/50' : ''}`}
                                                style={{ backgroundColor: c }}
                                            >
                                                {brandData.primaryColor === c && <CheckCircle2 className="text-white" size={20} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                                <button
                                    onClick={handleSaveBrand}
                                    disabled={saving}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Update Brand</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
