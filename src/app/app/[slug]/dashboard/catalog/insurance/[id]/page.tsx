'use client';

import React, { useState, useEffect } from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter, useParams } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { InsuranceRule } from '@/types/insurance';
import { FormulaComponent } from '@/types/registration';
import InsuranceOverview from '@/components/catalog/insurance/InsuranceOverview';
import InsuranceFormulaBuilder from '@/components/catalog/insurance/InsuranceFormulaBuilder';
import InsurancePreview from '@/components/catalog/insurance/InsurancePreview';
import { Save, ChevronLeft, Calculator, Sparkles, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import DataSourceIndicator from '@/components/dev/DataSourceIndicator';

const COLUMNS = [
    { key: 'insurerName', header: 'Insurer / Rule', width: '70%' },
    { key: 'status', header: 'Status', type: 'badge' as const, align: 'right' as const },
];

// Mapping Utility
// Default tenure config
const DEFAULT_TENURE_CONFIG = {
    od: { min: 1, max: 5, default: 1, allowed: [1] },
    tp: { min: 1, max: 5, default: 5, allowed: [5] },
    addons: { min: 1, max: 5, default: 1, allowed: [1], linkedTo: 'OD' as const },
};

const mapDbToFrontend = (d: any): InsuranceRule => ({
    id: d.id,
    displayId: d.display_id,
    ruleName: d.rule_name,
    stateCode: d.state_code,
    insurerName: d.insurer_name,
    vehicleType: d.vehicle_type,
    effectiveFrom: d.effective_from || d.created_at?.split('T')[0],
    status: d.status,
    idvPercentage: Number(d.idv_percentage),
    gstPercentage: Number(d.gst_percentage),
    odComponents: d.od_components || [],
    tpComponents: d.tp_components || [],
    addons: d.addons || [],
    tenureConfig: d.tenure_config || DEFAULT_TENURE_CONFIG,
    version: d.version || 1,
    lastUpdated: d.updated_at,
});

const mapFrontendToDb = (r: InsuranceRule) => ({
    id: r.id,
    display_id: r.displayId,
    rule_name: r.ruleName,
    state_code: r.stateCode,
    insurer_name: r.insurerName,
    vehicle_type: r.vehicleType,
    status: r.status,
    idv_percentage: r.idvPercentage,
    gst_percentage: r.gstPercentage,
    od_components: r.odComponents,
    tp_components: r.tpComponents,
    addons: r.addons,
    tenure_config: r.tenureConfig || DEFAULT_TENURE_CONFIG,
    version: r.version,
    updated_at: new Date().toISOString(),
});

export default function InsuranceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { can } = usePermission();
    const id = params?.id ? decodeURIComponent(params.id as string) : null;

    // Permission Logic
    // Permission Logic
    const { activeRole, userRole: contextUserRole } = useTenant();
    const localRole = activeRole || contextUserRole;
    const isPrivilegedRole =
        !!localRole && ['OWNER', 'SUPER_ADMIN', 'SUPERADMIN', 'MARKETPLACE_ADMIN'].includes(localRole);
    const canEdit = can('catalog-insurance', id === 'new' ? 'create' : 'edit') || isPrivilegedRole;

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');
    const [isMounted, setIsMounted] = useState(false);
    const [rule, setRule] = useState<InsuranceRule | null>(null);
    const [isCalcValid, setIsCalcValid] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchRule = async (targetId: string) => {
        setLoading(true);
        const supabase = createClient();

        // Robust lookup: UUID vs DisplayId vs StateCode
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
        let query = supabase.from('cat_ins_rules').select('*');

        if (isUuid) {
            query = query.eq('id', targetId);
        } else if (targetId.includes('-')) {
            query = query.eq('display_id', targetId);
        } else {
            query = query.eq('state_code', targetId.toUpperCase());
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data) {
            setRule(mapDbToFrontend(data));
        } else if (targetId === 'new') {
            setRule({
                id: crypto.randomUUID(),
                ruleName: 'New Insurance Rule',
                stateCode: 'MH',
                insurerName: 'New Insurer',
                vehicleType: 'TWO_WHEELER',
                effectiveFrom: new Date().toISOString().split('T')[0],
                status: 'ACTIVE',
                idvPercentage: 95,
                gstPercentage: 18,
                odComponents: [],
                tpComponents: [],
                addons: [],
                version: 1,
                lastUpdated: new Date().toISOString(),
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isMounted && id) {
            fetchRule(id);
        }
    }, [id, isMounted]);

    useEffect(() => {
        if (!isMounted) return;
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!isDirty) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, isMounted]);

    const handleSave = async () => {
        if (!rule) return;
        if (!isCalcValid && activeTab === 'Premium Studio') {
            alert('Calculation check failed. Please verify in the preview before saving.');
            return;
        }

        const supabase = createClient();
        const dbPayload = mapFrontendToDb(rule);

        const { error } = await supabase.from('cat_ins_rules').upsert(dbPayload);

        if (!error) {
            alert('Insurance Rule Saved Successfully to Database!');
            setIsEditing(false);
            setIsDirty(false);
            router.push('/catalog/insurance');
        } else {
            console.error('Save error', error);
            alert(`Failed to save: ${error.message}`);
        }
    };

    const handleBack = () => {
        if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return;
        router.push('/catalog/insurance');
    };

    if (!isMounted || loading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-20 text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                    Syncing with Live DB...
                </h3>
            </div>
        );
    }

    if (!rule) return null;

    if (!isMounted || !rule) return null;

    return (
        <RoleGuard resource="catalog-insurance" action="view">
            <MasterListDetailLayout mode="detail-only">
                {/* Dummy List Part */}
                <div />

                {/* Detail View */}
                <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-500">
                    {/* Header */}
                    <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <button
                                className="p-2 -ml-2 text-slate-400 hover:text-blue-600 transition-colors"
                                onClick={handleBack}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none mb-1">
                                    {rule.ruleName}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Sparkles size={10} className="text-blue-500" /> Profiling {rule.displayId || 'NEW'}
                                    <DataSourceIndicator source="LIVE" className="ml-1" />
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {canEdit && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-500/20 hover:shadow-2xl hover:shadow-slate-500/40 transition-all flex items-center gap-2 border border-white/10"
                                >
                                    <Sparkles size={16} /> Enable Edit
                                </button>
                            )}
                            {canEdit && isEditing && (
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/40 transition-all flex items-center gap-2 border border-white/10"
                                >
                                    <Save size={16} /> Save Rule
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 px-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex-shrink-0">
                        {['Overview', 'Premium Studio'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                                    activeTab === tab
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {tab === 'Premium Studio' && <Calculator size={14} />}
                                    {tab}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto bg-slate-50/30 dark:bg-slate-950/50">
                        {activeTab === 'Overview' && (
                            <div className="p-8">
                                <InsuranceOverview
                                    rule={rule}
                                    onChange={nextRule => {
                                        setRule(nextRule);
                                        setIsDirty(true);
                                    }}
                                    readOnly={!canEdit || !isEditing}
                                />
                            </div>
                        )}

                        {activeTab === 'Premium Studio' && (
                            <div className="p-8">
                                <div className="grid grid-cols-12 gap-8 items-start">
                                    <div className="col-span-12 xl:col-span-7 space-y-6">
                                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                                            <div className="relative flex gap-4">
                                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shrink-0">
                                                    <Sparkles size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-widest mb-1 italic">
                                                        Policy Logic Editor
                                                    </h4>
                                                    <p className="text-[11px] text-white/80 font-medium tracking-wide leading-relaxed">
                                                        Configure OD rates as percentage of IDV, TP premiums as slab
                                                        tables, and optional add-on covers.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <InsuranceFormulaBuilder
                                            odComponents={rule.odComponents}
                                            tpComponents={rule.tpComponents}
                                            addons={rule.addons}
                                            idvPercentage={rule.idvPercentage}
                                            tenureConfig={rule.tenureConfig}
                                            onIdvChange={val => {
                                                setRule({ ...rule, idvPercentage: val });
                                                setIsDirty(true);
                                            }}
                                            onTenureChange={config => {
                                                setRule({ ...rule, tenureConfig: config });
                                                setIsDirty(true);
                                            }}
                                            onChange={(section, comps) => {
                                                setRule({
                                                    ...rule,
                                                    [section + (section === 'addons' ? '' : 'Components')]: comps,
                                                });
                                                setIsCalcValid(false);
                                                setIsDirty(true);
                                            }}
                                            readOnly={!canEdit || !isEditing}
                                            forceEdit={isEditing}
                                        />
                                    </div>

                                    <div className="col-span-12 xl:col-span-5 sticky top-8">
                                        <InsurancePreview rule={rule} onValidCalculation={setIsCalcValid} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </MasterListDetailLayout>
        </RoleGuard>
    );
}
