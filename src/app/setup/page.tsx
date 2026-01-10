'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, Building2, Palette, Users, ArrowRight, Loader2, Save } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

// STEPS
type SetupStep = 'INFO' | 'BRAND' | 'TEAM' | 'FINISH';

export default function SetupWizard() {
    const router = useRouter();
    const { tenantConfig, tenantName, tenantId } = useTenant();
    const [step, setStep] = useState<SetupStep>('INFO');
    const [isLoading, setIsLoading] = useState(false);
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

    // Initialize from existing config if available (partial setup)
    useEffect(() => {
        if (tenantConfig && tenantName) {
            setOrgData(prev => ({
                ...prev,
                displayName: tenantConfig.brand?.displayName || tenantName,
                location: '', // TODO: Fetch from tenants table if needed
            }));
            const savedStep = tenantConfig.setup?.step;
            if (savedStep) {
                if (savedStep === 2) setStep('BRAND');
                if (savedStep === 3) setStep('TEAM');
            }
        }
    }, [tenantConfig, tenantName]);

    // HANDLERS
    const updateConfig = async (newUpdates: Partial<typeof tenantConfig>) => {
        if (!tenantId) return false;

        try {
            const supabase = createClient();

            // Merge deep config
            // note: jsonb_set or simple merge needed. Here we do full replace of config object for simplicity in MVP
            // Ideally should fetch fresh, merge, and update.

            const currentConfig = tenantConfig || {};
            const nextConfig = {
                ...currentConfig,
                ...newUpdates,
                // Ensure deep merge for nested objects if simpler approach fails
                // For now, we manually destruct in the specific handlers
            };

            const { error } = await supabase
                .from('tenants')
                .update({ config: nextConfig })
                .eq('id', tenantId);

            if (error) {
                console.error('Save failed:', error);
                alert('Failed to save changes. Permission issues?');
                return false;
            }
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const handleSaveInfo = async () => {
        setSaving(true);
        const success = await updateConfig({
            ...tenantConfig,
            brand: {
                ...tenantConfig?.brand,
                primaryColor: tenantConfig?.brand?.primaryColor || '#4F46E5', // Default
                displayName: orgData.displayName
            },
            // Note: location is technically in 'tenants' table columns too, but we store in config for now 
            // or update tenant row directly if specific columns exist.
            // User requested: Organization info (edit name/location).
            // Let's stick to config for MVP branding.
            setup: { isComplete: false, step: 2 }
        });

        if (success) {
            setStep('BRAND');
            // Reload Window to refresh context? Context should auto-refresh if valid.
            // Usually good to force a re-fetch or rely on realtime.
        }
        setSaving(false);
    };

    const handleSaveBrand = async () => {
        setSaving(true);
        const success = await updateConfig({
            ...tenantConfig,
            brand: {
                ...tenantConfig?.brand,
                displayName: orgData.displayName,
                primaryColor: brandData.primaryColor,
                logoUrl: brandData.logoUrl
            },
            setup: { isComplete: false, step: 3 }
        });

        if (success) setStep('TEAM');
        setSaving(false);
    };

    const handleFinish = async () => {
        setSaving(true);
        const success = await updateConfig({
            ...tenantConfig,
            brand: {
                ...tenantConfig?.brand,
                displayName: orgData.displayName,
                primaryColor: brandData.primaryColor,
                logoUrl: brandData.logoUrl
            },
            setup: { isComplete: true, step: 4 }
        });

        if (success) {
            window.location.href = '/dashboard';
        } else {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">

            {/* Header */}
            <div className="w-full max-w-2xl mb-12 flex items-center justify-between">
                <Logo className="h-8" />
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Setup Wizard
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-2xl mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 rounded-full" />
                <div
                    className="absolute top-1/3 left-0 h-1 bg-indigo-600 transition-all duration-500 rounded-full"
                    style={{ width: step === 'INFO' ? '15%' : step === 'BRAND' ? '50%' : step === 'TEAM' ? '80%' : '100%' }}
                />

                <div className="relative flex justify-between">
                    {['INFO', 'BRAND', 'TEAM'].map((s, i) => {
                        const isActive = step === s;
                        const isPast = ['INFO', 'BRAND', 'TEAM', 'FINISH'].indexOf(step) > i;
                        return (
                            <div key={s} className="flex flex-col items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110' : isPast ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                    {isPast ? <CheckCircle2 size={16} /> :
                                        i === 0 ? <Building2 size={14} /> :
                                            i === 1 ? <Palette size={14} /> :
                                                <Users size={14} />
                                    }
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {s === 'INFO' ? 'Organization' : s === 'BRAND' ? 'Branding' : 'Team'}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Form Card */}
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">

                {/* Step 1: Organization Info */}
                {step === 'INFO' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Organization Details</h2>
                            <p className="text-sm text-slate-500">Tell us about your dealership.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Display Name</label>
                                <input
                                    type="text"
                                    value={orgData.displayName}
                                    onChange={e => setOrgData({ ...orgData, displayName: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="e.g. MyScooty Pune"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Location / City</label>
                                <input
                                    type="text"
                                    value={orgData.location}
                                    onChange={e => setOrgData({ ...orgData, location: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="e.g. Pune, MH"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveInfo}
                            disabled={!orgData.displayName || saving}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <>Continue <ArrowRight size={16} /></>}
                        </button>
                    </div>
                )}

                {/* Step 2: Branding */}
                {step === 'BRAND' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Make it Yours</h2>
                            <p className="text-sm text-slate-500">Configure your portal's look and feel.</p>
                        </div>

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

                            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center text-center gap-3">
                                <div className="w-12 h-12 bg-white dark:bg-white/5 rounded-full flex items-center justify-center shadow-sm">
                                    <Palette size={20} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Upload Logo</p>
                                    <p className="text-[10px] text-slate-400">Recommended: 200x50px PNG</p>
                                </div>
                                {/* Placeholder for Upload */}
                                <button className="text-[10px] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors">Select File</button>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveBrand}
                            disabled={saving}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <>Design Looks Good <ArrowRight size={16} /></>}
                        </button>
                    </div>
                )}

                {/* Step 3: Team */}
                {step === 'TEAM' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Your Squad</h2>
                            <p className="text-sm text-slate-500">Invite your first team member (optional).</p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex gap-3 border border-blue-100 dark:border-blue-500/20">
                            <Users className="text-blue-500 shrink-0" size={20} />
                            <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed font-medium">
                                You are the <b>Owner</b>. You can add more admins, sales executives, or operations staff later from Settings.
                            </p>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Invite by Email (Optional)</label>
                            <input
                                type="email"
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="teammate@example.com"
                            />
                        </div>

                        <button
                            onClick={() => setStep('FINISH')}
                            disabled={saving}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                        >
                            Skip & Finish <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {/* Step 4: Finish */}
                {step === 'FINISH' && (
                    <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="text-emerald-500 w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">All Set!</h2>
                            <p className="text-sm text-slate-500">Your dealership portal is ready for action.</p>
                        </div>

                        <button
                            onClick={handleFinish}
                            disabled={saving}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <>Enter Dashboard <ArrowRight size={16} /></>}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
