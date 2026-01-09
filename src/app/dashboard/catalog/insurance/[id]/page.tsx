'use client';

import React, { useState, useEffect } from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { useRouter, useParams } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { InsuranceRule } from '@/types/insurance';
import { FormulaComponent } from '@/types/registration';
import InsuranceOverview from '@/components/catalog/insurance/InsuranceOverview';
import InsuranceFormulaBuilder from '@/components/catalog/insurance/InsuranceFormulaBuilder';
import InsurancePreview from '@/components/catalog/insurance/InsurancePreview';
import { MOCK_INSURANCE_RULES } from '@/lib/mock/insuranceMocks';
import { Save, ChevronLeft, Calculator, Sparkles } from 'lucide-react';

const COLUMNS = [
    { key: 'insurerName', header: 'Insurer / Rule', width: '70%' },
    { key: 'status', header: 'Status', type: 'badge' as const, align: 'right' as const }
];

export default function InsuranceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { can } = usePermission();
    const id = params?.id ? decodeURIComponent(params.id as string) : null;
    const canEdit = can('catalog-insurance', 'create');

    const [activeTab, setActiveTab] = useState('Overview');
    const [isMounted, setIsMounted] = useState(false);
    const [ruleList, setRuleList] = useState<InsuranceRule[]>([]);
    const [rule, setRule] = useState<InsuranceRule | null>(null);
    const [isCalcValid, setIsCalcValid] = useState(false);

    const STORAGE_KEY = 'aums_insurance_rules_v2';

    // Persistence
    const loadRules = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : MOCK_INSURANCE_RULES;
    };

    const saveRules = (rules: InsuranceRule[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
        setRuleList(rules);
    };

    useEffect(() => {
        setIsMounted(true);
        setRuleList(loadRules());
    }, []);

    useEffect(() => {
        if (!isMounted || !id) return;

        if (id === 'new') {
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
                lastUpdated: new Date().toISOString()
            });
        } else {
            const rules = loadRules();
            const found = rules.find((r: any) => r.id === id);
            if (found) setRule(found);
        }
    }, [id, isMounted]);

    const handleSave = () => {
        if (!rule) return;
        const current = loadRules();
        const idx = current.findIndex((r: any) => r.id === rule.id);
        const newRules = [...current];
        if (idx !== -1) newRules[idx] = { ...rule, lastUpdated: new Date().toISOString() };
        else newRules.push(rule);
        saveRules(newRules);
        alert("Insurance Rule Saved!");
        router.push('/catalog/insurance');
    };

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
                            <button className="p-2 -ml-2 text-slate-400 hover:text-blue-600 transition-colors" onClick={() => router.push('/catalog/insurance')}>
                                <ChevronLeft size={24} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none mb-1">
                                    {rule.ruleName}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Sparkles size={10} className="text-blue-500" /> Profiling {rule.displayId || 'NEW'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {canEdit && (
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
                                className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab
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
                                    onChange={setRule}
                                    readOnly={!canEdit}
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
                                                    <h4 className="text-sm font-black uppercase tracking-widest mb-1 italic">Policy Logic Editor</h4>
                                                    <p className="text-[11px] text-white/80 font-medium tracking-wide leading-relaxed">Configure OD rates as percentage of IDV, TP premiums as slab tables, and optional add-on covers.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <InsuranceFormulaBuilder
                                            odComponents={rule.odComponents}
                                            tpComponents={rule.tpComponents}
                                            addons={rule.addons}
                                            idvPercentage={rule.idvPercentage}
                                            onIdvChange={(val) => setRule({ ...rule, idvPercentage: val })}
                                            onChange={(section, comps) => {
                                                setRule({ ...rule, [section + (section === 'addons' ? '' : 'Components')]: comps });
                                                setIsCalcValid(false);
                                            }}
                                            readOnly={!canEdit}
                                        />
                                    </div>

                                    <div className="col-span-12 xl:col-span-5 sticky top-8">
                                        <InsurancePreview
                                            rule={rule}
                                            onValidCalculation={setIsCalcValid}
                                        />
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

