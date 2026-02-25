'use client';

import React, { useState, useEffect } from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter, useParams } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import type { Json } from '@/types/supabase';
import { DiscountPayoutEntry, InsuranceRule } from '@/types/insurance';
import InsuranceOverview from '@/components/catalog/insurance/InsuranceOverview';
import InsuranceFormulaBuilder from '@/components/catalog/insurance/InsuranceFormulaBuilder';
import InsurancePreview from '@/components/catalog/insurance/InsurancePreview';
import InsuranceDiscountPayout from '@/components/catalog/insurance/InsuranceDiscountPayout';
import { Save, ChevronLeft, Calculator, Sparkles, Loader2, Percent } from 'lucide-react';
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

const normalizeDiscountPayoutConfig = (input: unknown): DiscountPayoutEntry[] => {
    if (!Array.isArray(input)) return [];

    const allowedScopes = new Set(['ALL', 'BRAND', 'VEHICLE_TYPE', 'MODEL']);
    const allowedBasis = new Set(['NET_PREMIUM', 'GROSS_PREMIUM', 'OD_NET']);
    const allowedVehicleTypes = new Set(['SCOOTER', 'MOTORCYCLE', 'EV']);

    return input
        .map((raw: any) => {
            const scope = String(raw?.scope || '').toUpperCase();
            const payoutBasis = String(raw?.payoutBasis || '').toUpperCase();
            const vehicleTypeRaw = raw?.vehicleType ? String(raw.vehicleType).toUpperCase() : undefined;
            const odDiscount = Number(raw?.odDiscount);
            const payoutPercent = Number(raw?.payoutPercent);

            if (!allowedScopes.has(scope)) return null;
            if (!allowedBasis.has(payoutBasis)) return null;
            if (!Number.isFinite(odDiscount) || !Number.isFinite(payoutPercent)) return null;

            return {
                id: raw?.id ? String(raw.id) : crypto.randomUUID(),
                scope: scope as DiscountPayoutEntry['scope'],
                brandId: raw?.brandId ? String(raw.brandId) : undefined,
                brandName: raw?.brandName ? String(raw.brandName) : undefined,
                vehicleType:
                    vehicleTypeRaw && allowedVehicleTypes.has(vehicleTypeRaw)
                        ? (vehicleTypeRaw as DiscountPayoutEntry['vehicleType'])
                        : undefined,
                modelId: raw?.modelId ? String(raw.modelId) : undefined,
                modelName: raw?.modelName ? String(raw.modelName) : undefined,
                odDiscount,
                payoutPercent,
                payoutBasis: payoutBasis as DiscountPayoutEntry['payoutBasis'],
            } as DiscountPayoutEntry;
        })
        .filter((entry): entry is DiscountPayoutEntry => !!entry);
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
    ncbPercentage: d.ncb_percentage != null ? Number(d.ncb_percentage) : 0,
    discountPercentage: d.discount_percentage != null ? Number(d.discount_percentage) : 0,
    discountPayoutConfig: normalizeDiscountPayoutConfig(d.discount_payout_config),
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
    od_components: r.odComponents as unknown as Json,
    tp_components: r.tpComponents as unknown as Json,
    addons: r.addons as unknown as Json,
    ncb_percentage: r.ncbPercentage ?? 0,
    discount_percentage: r.discountPercentage ?? 0,
    discount_payout_config: (r.discountPayoutConfig || []) as unknown as Json,
    tenure_config: (r.tenureConfig || DEFAULT_TENURE_CONFIG) as unknown as Json,
    version: r.version,
    updated_at: new Date().toISOString(),
});

export default function InsuranceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { can } = usePermission();
    const id = params?.id ? decodeURIComponent(params.id as string) : null;
    const tenantSlug = params?.slug as string | undefined;

    // Permission Logic
    // Permission Logic
    const { activeRole, userRole: contextUserRole } = useTenant();
    const localRole = activeRole || contextUserRole;
    const isPrivilegedRole =
        !!localRole && ['OWNER', 'SUPER_ADMIN', 'SUPERADMIN', 'MARKETPLACE_ADMIN'].includes(localRole);
    const canEdit = can('catalog-insurance', id === 'new' ? 'create' : 'edit') || isPrivilegedRole;

    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
                ncbPercentage: 0,
                discountPercentage: 0,
                discountPayoutConfig: [],
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
        if (!rule || isSaving) return;
        if (!isCalcValid && activeTab === 'Premium Studio') {
            alert('Calculation check failed. Please verify in the preview before saving.');
            return;
        }

        setIsSaving(true);
        try {
            const supabase = createClient();
            const dbPayload = mapFrontendToDb(rule);

            const { error } = await supabase.from('cat_ins_rules').upsert(dbPayload as any);

            if (!error) {
                alert(
                    'Insurance Rule Saved Successfully to Database!\n\n' +
                        'SOT: This Formula Studio updates only cat_ins_rules. ' +
                        'Premium rows in cat_price_state_mh are updated only by the AUMS Price Engine.'
                );
                setIsEditing(false);
                setIsDirty(false);
                router.push(
                    tenantSlug ? `/app/${tenantSlug}/dashboard/catalog/insurance` : '/dashboard/catalog/insurance'
                );
            } else {
                console.error('Save error', error);
                alert(`Failed to save: ${error.message}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return;
        router.push(tenantSlug ? `/app/${tenantSlug}/dashboard/catalog/insurance` : '/dashboard/catalog/insurance');
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
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <button
                                className="p-1.5 -ml-1 text-slate-400 hover:text-blue-600 transition-colors"
                                onClick={handleBack}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">
                                    {rule.ruleName}
                                </h2>
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-0.5">
                                    <Sparkles size={9} className="text-blue-500" /> Profiling {rule.displayId || 'NEW'}
                                    <DataSourceIndicator source="LIVE" className="ml-1" />
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {canEdit && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-white/10"
                                >
                                    <Sparkles size={14} /> Enable Edit
                                </button>
                            )}
                            {canEdit && isEditing && (
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-white/10"
                                >
                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {isSaving ? 'Saving...' : 'Save Rule'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 px-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex-shrink-0">
                        {['Overview', 'Premium Studio', 'Discount & Payout'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                                    activeTab === tab
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-1.5">
                                    {tab === 'Premium Studio' && <Calculator size={12} />}
                                    {tab === 'Discount & Payout' && <Percent size={12} />}
                                    {tab}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="px-6 py-2 border-b border-slate-100 dark:border-white/5 bg-amber-50/50 dark:bg-amber-500/10">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                            SOT: Formula Studio edits only insurance rules. Premium publish/reprice happens only via
                            AUMS Price Engine.
                        </p>
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
                            <div className="p-4">
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-12 xl:col-span-7 space-y-2">
                                        <InsuranceFormulaBuilder
                                            odComponents={rule.odComponents}
                                            tpComponents={rule.tpComponents}
                                            addons={rule.addons}
                                            idvPercentage={rule.idvPercentage}
                                            ncbPercentage={rule.ncbPercentage ?? 0}
                                            discountPercentage={rule.discountPercentage ?? 0}
                                            tenureConfig={rule.tenureConfig}
                                            onIdvChange={val => {
                                                setRule({ ...rule, idvPercentage: val });
                                                setIsDirty(true);
                                            }}
                                            onNcbChange={val => {
                                                setRule({ ...rule, ncbPercentage: val });
                                                setIsDirty(true);
                                            }}
                                            onDiscountChange={val => {
                                                setRule({ ...rule, discountPercentage: val });
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

                                    <div className="col-span-12 xl:col-span-5 xl:sticky xl:top-4 xl:max-h-[calc(100vh-120px)]">
                                        <InsurancePreview rule={rule} onValidCalculation={setIsCalcValid} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Discount & Payout' && (
                            <div className="p-6">
                                <InsuranceDiscountPayout
                                    entries={rule.discountPayoutConfig || []}
                                    onChange={entries => {
                                        setRule({ ...rule, discountPayoutConfig: entries });
                                        setIsDirty(true);
                                    }}
                                    readOnly={!canEdit || !isEditing}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </MasterListDetailLayout>
        </RoleGuard>
    );
}
