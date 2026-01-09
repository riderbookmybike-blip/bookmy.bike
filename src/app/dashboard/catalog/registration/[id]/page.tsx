'use client';

import React, { useState, useEffect } from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { useRouter, useParams } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { RegistrationRule } from '@/types/registration';
import RuleOverview from '@/components/catalog/registration/RuleOverview';
import FormulaBuilder from '@/components/catalog/registration/FormulaBuilder';
import PreviewCalculator from '@/components/catalog/registration/PreviewCalculator';
import { MOCK_REGISTRATION_RULES } from '@/lib/mock/catalogMocks';
import { Save, AlertTriangle, ChevronLeft, Calculator, Sparkles } from 'lucide-react';

const COLUMNS = [
    { key: 'regType', header: 'State / Rule', width: '70%' },
    { key: 'status', header: 'Status', type: 'badge' as const, align: 'right' as const }
];

export default function RegistrationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { can } = usePermission();

    // 1. Safe Params Resolution
    // Handle potential undefined params during initial render or SSG
    const rawId = params?.id;
    const id = rawId ? decodeURIComponent(rawId as string) : null;

    const canEdit = can('catalog-registration', 'create');

    const [activeTab, setActiveTab] = useState('Overview');
    const [isMounted, setIsMounted] = useState(false);

    // List State
    const [ruleList, setRuleList] = useState<any[]>([]);
    const [checkedIds, setCheckedIds] = useState<any[]>([]);

    // Rule State
    const [rule, setRule] = useState<RegistrationRule | null>(null);
    const [isCalculationValid, setIsCalculationValid] = useState(false);

    const STORAGE_KEY = 'aums_registration_rules_v2';

    // Helper: Load Rules from Storage or Mock
    const loadRulesFromStorage = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error("Failed to load from storage", e);
        }
        return MOCK_REGISTRATION_RULES; // Fallback to initial mock
    };

    // Helper: Save Rules to Storage
    const saveRulesToStorage = (rules: any[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
            setRuleList(rules);
        } catch (e) {
            console.error("Failed to save to storage", e);
        }
    };

    // Prevent Hydration Mismatch & Initial Load
    useEffect(() => {
        setIsMounted(true);
        const rules = loadRulesFromStorage();
        setRuleList(rules);
    }, []);

    const handleBulkDelete = (ids: any[]) => {
        if (!confirm(`Are you sure you want to delete ${ids.length} rules?`)) return;

        const currentRules = loadRulesFromStorage();
        const newRules = currentRules.filter((r: any) => !ids.includes(r.id));

        saveRulesToStorage(newRules);
        setCheckedIds([]); // Clear selection

        // If currently viewing a deleted rule, go back to list
        if (ids.includes(id)) {
            router.push('/catalog/registration');
        }
    };

    // Load Data (Detail View)
    useEffect(() => {
        if (!isMounted || !id) return;

        console.log("Loading Rule for ID:", id); // Debug

        if (id === 'new') {
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
            // Fetch from Local Storage (Source of Truth)
            const currentRules = loadRulesFromStorage();
            const mock = currentRules.find((r: any) => r.id === id);

            if (mock) {
                // PERSISTENCE CHECK: If it has 'components', use them
                if (mock.components) {
                    setRule(mock as unknown as RegistrationRule);
                } else {
                    // Adapter: Flat Mock Data -> Complex Rule Object
                    setRule({
                        id: mock.id,
                        displayId: mock.displayId,
                        ruleName: mock.ruleName || 'Unknown Rule',
                        stateCode: mock.stateCode || (mock.state ? mock.state.substring(0, 2).toUpperCase() : 'XX'),
                        vehicleType: 'TWO_WHEELER',
                        status: 'ACTIVE',
                        effectiveFrom: '2017-04-01',
                        version: 1,
                        lastUpdated: new Date().toISOString(),
                        stateTenure: 15,
                        bhTenure: 2,
                        companyMultiplier: 2,
                        // Seed defaults if empty in mock
                        components: [
                            {
                                id: '1',
                                type: 'PERCENTAGE',
                                label: 'Road Tax',
                                percentage: mock.numericValue ? mock.numericValue * 100 : 10,
                                basis: 'EX_SHOWROOM'
                            },
                            {
                                id: '2',
                                type: 'FIXED',
                                label: 'Smart Card Fee',
                                amount: 200
                            }
                        ]
                    });
                }
            } else {
                // Not Found Fallback (Prevent Infinite Loading)
                setRule({
                    id: id,
                    ruleName: 'Unknown Rule',
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
        }
    }, [id, isMounted]);

    const handleSave = () => {
        if (!rule) return;

        if (!isCalculationValid) {
            alert("Calculation Check Failed. Please verify in 'Preview' tab before saving.");
            setActiveTab('Preview');
            return;
        }

        const currentRules = loadRulesFromStorage();
        const idx = currentRules.findIndex((r: any) => r.id === rule.id);

        let newRules = [...currentRules];

        if (idx !== -1) {
            // Update existing
            newRules[idx] = {
                ...newRules[idx],
                ...rule,
                value: rule.components.length + ' Components', // Update list view summary
                status: rule.status
            };
        } else {
            // Create New
            newRules.push({
                ...rule,
                state: rule.ruleName.split(' ')[0] || 'Unknown', // Fallback for list column
                regType: rule.ruleName,
                taxType: 'Formula', // Default for lists
                value: rule.components.length + ' Components',
            });
        }

        saveRulesToStorage(newRules);

        console.log("Saving Rule to Storage:", rule);
        alert("Rule Saved Successfully! (Persisted to Browser Storage)");
        router.push('/catalog/registration');
    };

    // Helper to delete singular rule from Detail View
    const handleDeleteDetail = () => {
        handleBulkDelete([rule?.id]);
    };

    const handleClose = () => {
        router.push('/catalog/registration');
    };

    // Helper to flatten components for targeting
    const collectAllComponents = (comps: any[]): { id: string, label: string }[] => {
        let acc: { id: string, label: string }[] = [];
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
                    <div className="flex justify-center items-center h-full min-h-[50vh] bg-white">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                            <p className="text-sm text-gray-500 font-medium">Loading Rule Configuration...</p>
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
                    <div className="flex-1 overflow-auto bg-slate-50/30 dark:bg-slate-950/50">
                        {activeTab === 'Overview' && (
                            <div className="p-6 w-full">
                                <RuleOverview
                                    rule={rule}
                                    onChange={setRule}
                                    readOnly={!canEdit}
                                />
                            </div>
                        )}

                        {activeTab === 'Studio' && (
                            <div className="p-6">
                                <div className="grid grid-cols-12 gap-8 items-start">
                                    {/* Left: Formula Builder */}
                                    <div className="col-span-12 xl:col-span-8 space-y-4">
                                        <div className="bg-amber-50/50 backdrop-blur-sm border border-amber-200/50 p-4 rounded-xl flex gap-3 text-sm text-amber-800 shadow-sm">
                                            <AlertTriangle size={18} className="shrink-0 text-amber-500" />
                                            <p className="font-medium">Design your tax logic here. Changes are instantly simulated in the live preview on the right.</p>
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
                                            <h3 className="text-lg font-bold text-gray-900 mb-4">Live Preview</h3>
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
                </div>
            </MasterListDetailLayout>
        </RoleGuard >
    );
}
