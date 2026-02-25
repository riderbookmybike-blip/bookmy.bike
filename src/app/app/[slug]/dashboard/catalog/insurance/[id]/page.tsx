'use client';

import React, { useState, useEffect } from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter, useParams } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import type { Json } from '@/types/supabase';
import { InsuranceRule } from '@/types/insurance';
import { FormulaComponent } from '@/types/registration';
import InsuranceOverview from '@/components/catalog/insurance/InsuranceOverview';
import InsuranceFormulaBuilder from '@/components/catalog/insurance/InsuranceFormulaBuilder';
import InsurancePreview from '@/components/catalog/insurance/InsurancePreview';
import { Save, ChevronLeft, Calculator, Sparkles, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import DataSourceIndicator from '@/components/dev/DataSourceIndicator';
import { calculatePricingBySkuIds } from '@/actions/pricingLedger';

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
    od_components: r.odComponents as unknown as Json,
    tp_components: r.tpComponents as unknown as Json,
    addons: r.addons as unknown as Json,
    tenure_config: (r.tenureConfig || DEFAULT_TENURE_CONFIG) as unknown as Json,
    version: r.version,
    updated_at: new Date().toISOString(),
});

const slugifyAddonLabel = (label: string): string =>
    label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .replace(/^addon/, '')
        .trim();

const buildAddonColumnsSql = (addonSlugs: string[]): string => {
    if (addonSlugs.length === 0) return '-- No new addon columns required.';
    const lines = addonSlugs.map(slug => {
        return [
            `ADD COLUMN IF NOT EXISTS addon_${slug}_amount numeric(12,2),`,
            `ADD COLUMN IF NOT EXISTS addon_${slug}_gst_amount numeric(12,2),`,
            `ADD COLUMN IF NOT EXISTS addon_${slug}_total_amount numeric(12,2),`,
            `ADD COLUMN IF NOT EXISTS addon_${slug}_default boolean`,
        ].join('\n    ');
    });
    return `ALTER TABLE public.cat_price_state_mh\n${lines.map(x => `    ${x}`).join(',\n')};`;
};

const REPRICE_BATCH_SIZE = 40;

const chunkSkuIds = (skuIds: string[], batchSize: number): string[][] => {
    const chunks: string[][] = [];
    for (let i = 0; i < skuIds.length; i += batchSize) {
        chunks.push(skuIds.slice(i, i + batchSize));
    }
    return chunks;
};

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
    const [activeTab, setActiveTab] = useState('Overview');
    const [isMounted, setIsMounted] = useState(false);
    const [rule, setRule] = useState<InsuranceRule | null>(null);
    const [isCalcValid, setIsCalcValid] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const knownAddonSlugs = new Set([
        'zerodepreciation',
        'personal_accident_cover',
        'personalaccidentpacover',
        'pa',
        'returntoinvoicerti',
        'return_to_invoice',
        'consumablescover',
        'consumables',
        'engineprotection',
        'engine_protection',
        'roadsideassistancersa',
        'roadside_assistance',
    ]);

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
        const addonSlugs = (rule.addons || [])
            .map((a: FormulaComponent) => slugifyAddonLabel(String(a?.label || '')))
            .filter(Boolean);
        const uniqueAddonSlugs = Array.from(new Set(addonSlugs));
        const newAddonSlugs = uniqueAddonSlugs.filter(slug => !knownAddonSlugs.has(slug));

        if (newAddonSlugs.length > 0) {
            const sql = buildAddonColumnsSql(newAddonSlugs);
            console.info('[Insurance Addon Schema Required] New addon columns migration SQL:\n', sql);
            const proceed = window.confirm(
                `New addons detected: ${newAddonSlugs.join(', ')}.\n\n` +
                    'cat_price_state_mh migration required before publish. SQL template printed in browser console.\n\n' +
                    'Save rule anyway?'
            );
            if (!proceed) return;
        }

        const dbPayload = mapFrontendToDb(rule);

        const { error } = await supabase.from('cat_ins_rules').upsert(dbPayload as any);

        if (!error) {
            setLoading(true);
            let syncSummary = 'No published rows found for auto-reprice.';

            try {
                const ruleStateCode = String(rule.stateCode || 'ALL')
                    .trim()
                    .toUpperCase();
                const statesToSync: string[] =
                    ruleStateCode === 'ALL'
                        ? Array.from(
                              new Set(
                                  (
                                      (
                                          (await supabase
                                              .from('cat_price_state_mh')
                                              .select('state_code')
                                              .eq('publish_stage', 'PUBLISHED')) as any
                                      )?.data || []
                                  )
                                      .map((row: any) => String(row?.state_code || '').toUpperCase())
                                      .filter((value: string) => value.length > 0)
                              )
                          )
                        : [ruleStateCode];

                let totalCandidates = 0;
                let totalPublished = 0;
                const syncErrors: string[] = [];

                for (const stateCode of statesToSync) {
                    const { data: skuRows, error: skuError } = await supabase
                        .from('cat_price_state_mh')
                        .select('sku_id')
                        .eq('state_code', stateCode)
                        .eq('publish_stage', 'PUBLISHED');

                    if (skuError) {
                        syncErrors.push(`${stateCode}: ${skuError.message}`);
                        continue;
                    }

                    const skuIds = Array.from(
                        new Set((skuRows || []).map((row: any) => String(row?.sku_id || '')).filter(Boolean))
                    );
                    if (skuIds.length === 0) continue;

                    totalCandidates += skuIds.length;

                    for (const batch of chunkSkuIds(skuIds, REPRICE_BATCH_SIZE)) {
                        const result = await calculatePricingBySkuIds(batch, stateCode);
                        totalPublished += result.totalPublished;
                        if (result.errors.length > 0) {
                            syncErrors.push(`${stateCode}: ${result.errors.join('; ')}`);
                        }
                    }
                }

                if (totalCandidates > 0) {
                    syncSummary = `Repriced ${totalPublished}/${totalCandidates} published SKUs across ${statesToSync.length} state(s).`;
                }

                if (syncErrors.length > 0) {
                    syncSummary += `\nWarnings: ${syncErrors.slice(0, 3).join(' | ')}`;
                }
            } catch (syncError) {
                syncSummary = `Rule saved, but auto-reprice failed: ${syncError instanceof Error ? syncError.message : String(syncError)}`;
            } finally {
                setLoading(false);
            }

            alert(`Insurance Rule Saved Successfully to Database!\n\n${syncSummary}`);
            setIsEditing(false);
            setIsDirty(false);
            router.push(tenantSlug ? `/app/${tenantSlug}/dashboard/catalog/insurance` : '/dashboard/catalog/insurance');
        } else {
            console.error('Save error', error);
            alert(`Failed to save: ${error.message}`);
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
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-white/10"
                                >
                                    <Save size={14} /> Save Rule
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 px-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex-shrink-0">
                        {['Overview', 'Premium Studio'].map(tab => (
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
                    </div>
                </div>
            </MasterListDetailLayout>
        </RoleGuard>
    );
}
