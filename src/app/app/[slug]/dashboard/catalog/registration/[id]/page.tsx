'use client';

import React, { useState, useEffect } from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { useRouter, useParams } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { useTenant } from '@/lib/tenant/tenantContext';
import { RegistrationRule } from '@/types/registration';
import RuleOverview from '@/components/catalog/registration/RuleOverview';
import FormulaBuilder from '@/components/catalog/registration/FormulaBuilder';
import PreviewCalculator from '@/components/catalog/registration/PreviewCalculator';
import { MOCK_REGISTRATION_RULES } from '@/lib/mock/catalogMocks';
import { Save, AlertTriangle, ChevronLeft, Calculator, Sparkles, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import DataSourceIndicator from '@/components/dev/DataSourceIndicator';

const COLUMNS = [
    { key: 'regType', header: 'State / Rule', width: '70%' },
    { key: 'status', header: 'Status', type: 'badge' as const, align: 'right' as const }
];

export default function RegistrationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { tenantSlug, tenantId } = useTenant();
    const { can } = usePermission();

    // 1. Safe Params Resolution
    // Handle potential undefined params during initial render or SSG
    const rawId = params?.id;
    const id = rawId ? decodeURIComponent(rawId as string) : null;

    const canEdit = can('catalog-registration', 'create');

    const [activeTab, setActiveTab] = useState('Overview');
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Rule State
    const [rule, setRule] = useState<RegistrationRule | null>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isCalculationValid, setIsCalculationValid] = useState(false);

    // Mapper: DB -> Frontend
    const mapDbToFrontend = (dbRule: any): RegistrationRule => {
        return {
            id: dbRule.id,
            displayId: dbRule.display_id,
            ruleName: dbRule.rule_name,
            stateCode: dbRule.state_code,
            vehicleType: dbRule.vehicle_type as any,
            effectiveFrom: dbRule.effective_from || '2017-04-01',
            status: dbRule.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
            stateTenure: dbRule.state_tenure || 15,
            bhTenure: dbRule.bh_tenure || 2,
            companyMultiplier: Number(dbRule.company_multiplier) || 2,
            components: dbRule.components || [],
            version: dbRule.version || 1,
            lastUpdated: dbRule.updated_at || new Date().toISOString()
        };
    };

    // Mapper: Frontend -> DB
    const mapFrontendToDb = (rule: RegistrationRule) => {
        return {
            id: rule.id,
            display_id: rule.displayId,
            rule_name: rule.ruleName,
            state_code: rule.stateCode,
            vehicle_type: rule.vehicleType,
            status: rule.status,
            state_tenure: rule.stateTenure,
            bh_tenure: rule.bhTenure,
            company_multiplier: rule.companyMultiplier,
            components: rule.components,
            version: rule.version,
            updated_at: new Date().toISOString()
        };
    };

    const fetchAuditLogs = async (targetId: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('entity_id', targetId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            const formatted = data.map((log: any) => ({
                id: log.id,
                action: log.action.replace('REGISTRATION_RULE_', ''),
                user: 'User ' + (log.actor_id ? log.actor_id.substring(0, 4) : 'Sys'),
                timestamp: new Date(log.created_at).toLocaleString(),
                details: JSON.stringify(log.metadata) === '{}' ? undefined : JSON.stringify(log.metadata)
            }));
            setAuditLogs(formatted);
        }
    };

    const logClientAction = async (action: string, ruleId: string, ruleName: string) => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !tenantId) return;

            // Log action with proper tenant_id
            await supabase.from('audit_logs').insert({
                action,
                entity_type: 'REGISTRATION_RULE',
                entity_id: ruleId,
                actor_id: user.id,
                tenant_id: tenantId,
                metadata: { ruleName }
            });

            // Refresh logs
            fetchAuditLogs(ruleId);
        } catch (e) {
            console.error("Audit log failed", e);
        }
    };

    const fetchRule = async (targetId: string) => {
        setLoading(true);
        const supabase = createClient();

        // Robust lookup: UUID vs State Code
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
        let query = supabase.from('cat_reg_rules').select('*');

        if (isUuid) {
            query = query.eq('id', targetId);
        } else {
            query = query.eq('state_code', targetId.toUpperCase());
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data) {
            setRule(mapDbToFrontend(data));
            fetchAuditLogs(data.id);
        } else if (targetId === 'new') {
            setRule({
                id: crypto.randomUUID(),
                ruleName: 'New Rule',
                stateCode: '',
                vehicleType: 'TWO_WHEELER',
                status: 'ACTIVE',
                effectiveFrom: '2017-04-01',
                components: [],
                version: 1,
                lastUpdated: new Date().toISOString(),
                stateTenure: 15,
                bhTenure: 2,
                companyMultiplier: 2
            });
        } else {
            console.error("Rule not found or error", error);
            // Fallback for missing record but valid ID
            setRule({
                id: targetId,
                ruleName: 'Not Found',
                stateCode: '',
                vehicleType: 'TWO_WHEELER',
                status: 'INACTIVE',
                effectiveFrom: '2017-04-01',
                components: [],
                version: 0,
                lastUpdated: new Date().toISOString(),
                stateTenure: 15,
                bhTenure: 2,
                companyMultiplier: 2
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        setIsMounted(true);
        if (id) fetchRule(id);
    }, [id]);

    const handleBulkDelete = async (ids: any[]) => {
        if (!confirm(`Are you sure you want to delete ${ids.length} rules?`)) return;

        const supabase = createClient();
        const { error } = await supabase
            .from('cat_reg_rules')
            .delete()
            .in('id', ids);

        if (!error) {
            await logClientAction('REGISTRATION_RULE_DELETED', ids[0], rule?.ruleName || 'Unknown'); // Logging single deletion for now
            if (ids.includes(rule?.id)) {
                router.push('/catalog/registration');
            }
        } else {
            alert("Failed to delete from database");
        }
    };


    const handleSave = async () => {
        if (!rule) return;

        if (!isCalculationValid) {
            alert("Calculation Check Failed. Please verify in 'Preview' tab before saving.");
            setActiveTab('Preview');
            return;
        }

        const supabase = createClient();
        const dbPayload = mapFrontendToDb(rule);

        const { error } = await supabase
            .from('cat_reg_rules')
            .upsert(dbPayload);

        if (!error) {
            await logClientAction(
                rule.id ? 'REGISTRATION_RULE_UPDATED' : 'REGISTRATION_RULE_CREATED',
                rule.id || 'new',
                rule.ruleName
            );
            alert("Rule Saved Successfully to Database!");
            // Dynamic redirect to list view
            const currentPath = window.location.pathname;
            // Expected format: .../catalog/registration/[id]
            // We want to go to: .../catalog/registration
            const listPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
            router.push(listPath);
        } else {
            console.error("Save error", error);
            alert(`Failed to save: ${error.message}`);
        }
    };

    // Helper to delete singular rule from Detail View
    const handleDeleteDetail = () => {
        handleBulkDelete([rule?.id]);
    };

    const handleClose = () => {
        const currentPath = window.location.pathname;
        const listPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        router.push(listPath);
    };

    // Helper to flatten components for targeting
    const collectAllComponents = (comps: any[]): { id: string, label: string }[] => {
        const acc: { id: string, label: string }[] = [];
        comps.forEach(c => {
            if (c.label && c.label !== 'Condition' && c.label !== 'New Charge') {
                acc.push({ id: c.id, label: c.label });
            }
            if (c.thenBlock) acc.push(...collectAllComponents(c.thenBlock));
            if (c.elseBlock) acc.push(...collectAllComponents(c.elseBlock));
            if (c.cases) {
                c.cases.forEach((caseItem: any) => {
                    if (caseItem.block) acc.push(...collectAllComponents(caseItem.block));
                });
            }
        });
        return acc;
    };

    const allTargets = React.useMemo(() => collectAllComponents(rule?.components || []), [rule?.components]);

    // --- RENDER ---

    // 1. Hydration Guard
    if (!isMounted) return null;

    // 2. Data Loading State
    if (!id || !rule) {
        return (
            <RoleGuard resource="catalog-registration" action="view">
                <MasterListDetailLayout mode="list-only">
                    <div className="flex justify-center items-center h-full min-h-[50vh] bg-white dark:bg-slate-950">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-slate-200 mx-auto mb-4"></div>
                            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Loading Rule Configuration...</p>
                        </div>
                    </div>
                </MasterListDetailLayout>
            </RoleGuard>
        );
    }

    return (
        <RoleGuard resource="catalog-registration" action="view">
            <MasterListDetailLayout mode="detail-only">
                {/* Dummy List Panel for MasterListDetailLayout structure - hidden in detail-only mode */}
                <div />

                {/* Full Width Studio Workspace */}
                <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-500">

                    {/* Header */}
                    <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <button className="p-2 -ml-2 text-slate-400 hover:text-blue-600 transition-colors" onClick={handleClose}>
                                <ChevronLeft size={24} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none mb-1">{rule.ruleName}</h2>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em] leading-none mb-2">
                                    <Sparkles size={10} className="text-blue-500" /> Profiling {rule.displayId || 'NEW'}
                                    <DataSourceIndicator source="LIVE" className="ml-2" />
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest leading-none">
                                    <span className={`px-2 py-0.5 rounded-lg border ${rule.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/10'}`}>
                                        {rule.status}
                                    </span>
                                    <span>•</span>
                                    <span className="opacity-80">Version {rule.version}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {canEdit && (
                                <button
                                    onClick={handleSave}
                                    className={`px-4 py-2 text-white font-bold rounded-lg flex items-center gap-2 transition-colors ${isCalculationValid
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : 'bg-blue-400 hover:bg-blue-500 opacity-90'
                                        }`}
                                >
                                    <Save size={18} /> <span className="hidden sm:inline">Save Rule</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 px-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex-shrink-0">
                        {['Overview', 'Studio'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {tab === 'Studio' && <Calculator size={14} />}
                                    {tab}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto bg-slate-50/30 dark:bg-slate-950/50 pb-24">
                        {activeTab === 'Overview' && (
                            <div className="p-6 w-full max-w-5xl mx-auto">
                                <RuleOverview
                                    rule={rule}
                                    onChange={setRule}
                                    readOnly={!canEdit}
                                    auditLogs={auditLogs}
                                />
                            </div>
                        )}

                        {activeTab === 'Studio' && (
                            <div className="p-6">
                                <div className="grid grid-cols-12 gap-8 items-start">
                                    {/* Left: Formula Builder */}
                                    <div className="col-span-12 xl:col-span-8 space-y-4">
                                        <div className="bg-amber-50/50 backdrop-blur-sm border border-amber-200/50 p-4 rounded-xl flex gap-3 text-sm text-amber-800 shadow-sm transition-all hover:shadow-md">
                                            <AlertTriangle size={18} className="shrink-0 text-amber-500 animate-pulse" />
                                            <div>
                                                <p className="font-bold">Logic Design Zone</p>
                                                <p className="opacity-80 text-xs">Design your tax logic here. Changes are instantly simulated in the live preview. Drag components to reorder sequence.</p>
                                            </div>
                                        </div>

                                        <FormulaBuilder
                                            components={rule.components}
                                            onChange={(comps) => {
                                                setRule({ ...rule, components: comps });
                                                setIsCalculationValid(false);
                                            }}
                                            readOnly={!canEdit}
                                            availableTargets={allTargets}
                                        />
                                    </div>

                                    {/* Right: Sticky Preview */}
                                    <div className="hidden xl:block xl:col-span-4 sticky top-6">
                                        <PreviewCalculator
                                            rule={rule}
                                            onValidCalculation={setIsCalculationValid}
                                        />
                                    </div>

                                    {/* Mobile Preview (Bottom) */}
                                    <div className="col-span-12 xl:hidden mt-8">
                                        <div className="border-t border-gray-200 pt-8">
                                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Live Performance Preview</h3>
                                            <PreviewCalculator
                                                rule={rule}
                                                onValidCalculation={setIsCalculationValid}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Actions Bar */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 px-8 py-4 flex justify-between items-center z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] transition-all">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Verification Status</span>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isCalculationValid ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                                    <span className={`text-xs font-black uppercase tracking-tight ${isCalculationValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {isCalculationValid ? 'Calculation Verified' : 'Awaiting Simulation'}
                                    </span>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Last Saved</span>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {new Date(rule.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleClose}
                                className="px-6 py-2.5 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Discard
                            </button>
                            {canEdit && (
                                <button
                                    onClick={handleSave}
                                    className={`group px-8 py-2.5 rounded-xl flex items-center gap-3 transition-all active:scale-95 shadow-lg ${isCalculationValid
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                                        }`}
                                >
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        {isCalculationValid ? 'Publish Changes' : 'Simulation Required'}
                                    </span>
                                    {isCalculationValid ? <Sparkles size={16} className="group-hover:rotate-12 transition-transform" /> : <Calculator size={16} />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </MasterListDetailLayout>
        </RoleGuard >
    );
}
