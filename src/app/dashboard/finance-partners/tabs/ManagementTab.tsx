import React, { useState } from 'react';
import { BankPartner, BankDesignation } from '@/types/bankPartner';
import { Trophy, ChevronUp, Users2, Shield, Info, Map, ChevronRight, Check, Edit2, X } from 'lucide-react';

interface ManagementLevel {
    id: BankDesignation;
    label: string;
    level: number;
    bg: string;
    color: string;
    scope: 'ALL_INDIA' | 'MULTI_STATE' | 'SINGLE_STATE' | 'AREA_SPECIFIC';
    description: string;
}

const INITIAL_DESIGNATIONS: ManagementLevel[] = [
    { id: 'NATIONAL_SALES_MANAGER', label: 'National Sales Manager', level: 6, bg: 'bg-emerald-500/10', color: 'text-emerald-500', scope: 'ALL_INDIA', description: 'Complete nationwide oversight' },
    { id: 'ZONAL_MANAGER', label: 'Zonal Manager', level: 5, bg: 'bg-blue-500/10', color: 'text-blue-500', scope: 'MULTI_STATE', description: 'Management of an entire zone (North, South, etc.)' },
    { id: 'REGIONAL_SALES_MANAGER', label: 'Regional Sales Manager', level: 4, bg: 'bg-indigo-500/10', color: 'text-indigo-500', scope: 'SINGLE_STATE', description: 'Authority over a full state' },
    { id: 'AREA_SALES_MANAGER', label: 'Area Sales Manager', level: 3, bg: 'bg-violet-500/10', color: 'text-violet-500', scope: 'AREA_SPECIFIC', description: 'Supervision of specific districts or clusters' },
    { id: 'TEAM_LEADER', label: 'Team Leader', level: 2, bg: 'bg-amber-500/10', color: 'text-amber-500', scope: 'AREA_SPECIFIC', description: 'Branch or multi-pincode territory lead' },
    { id: 'EXECUTIVE', label: 'Executive', level: 1, bg: 'bg-slate-500/10', color: 'text-slate-500', scope: 'AREA_SPECIFIC', description: 'Direct field operations and dealer mapping' },
];

export default function ManagementTab({ partner }: { partner: BankPartner }) {
    const [levels, setLevels] = useState(INITIAL_DESIGNATIONS);
    const [editingLevel, setEditingLevel] = useState<BankDesignation | null>(null);

    const updateScope = (id: BankDesignation, scope: ManagementLevel['scope']) => {
        setLevels(levels.map(l => l.id === id ? { ...l, scope } : l));
        setEditingLevel(null);
    };

    return (
        <div className="grid grid-cols-12 gap-8 p-12 pt-4">
            {/* Left: Hierarchy Column */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[40px] p-12 shadow-sm dark:shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                                <Trophy size={28} className="text-amber-500" />
                                Hierarchy & Scope Rules
                            </h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 ml-10">Define serviceability constraints per level</p>
                        </div>
                        <div className="bg-blue-500/10 px-4 py-2 rounded-2xl border border-blue-500/20">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">Organizational Pyramid</span>
                        </div>
                    </div>

                    <div className="relative flex flex-col items-center gap-3 py-10 max-w-4xl mx-auto">
                        {levels.map((lvl, idx) => (
                            <div
                                key={lvl.id}
                                className={`relative group flex items-center justify-between px-10 h-16 border ${lvl.bg} ${lvl.color.replace('text', 'border')}/20 rounded-2xl transition-all hover:scale-[1.01] hover:z-10`}
                                style={{
                                    width: `${50 + (lvl.level * 8)}%`,
                                    opacity: 0.7 + (lvl.level * 0.05)
                                }}
                            >
                                <div className="flex flex-col">
                                    <span className={`text-[9px] font-black uppercase tracking-tighter italic opacity-60 ${lvl.color}`}>Level {lvl.level}</span>
                                    <span className={`text-sm font-black uppercase tracking-widest ${lvl.color}`}>{lvl.label}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scope</div>
                                        <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{lvl.scope.replace('_', ' ')}</div>
                                    </div>
                                    <button
                                        onClick={() => setEditingLevel(editingLevel === lvl.id ? null : lvl.id)}
                                        className="p-2.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                </div>

                                {editingLevel === lvl.id && (
                                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Modify Serviceability Rule</span>
                                            <button onClick={() => setEditingLevel(null)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'ALL_INDIA', label: 'All India' },
                                                { id: 'MULTI_STATE', label: 'Multi State' },
                                                { id: 'SINGLE_STATE', label: 'Full State' },
                                                { id: 'AREA_SPECIFIC', label: 'Local Area' }
                                            ].map(s => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => updateScope(lvl.id, s.id as any)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${lvl.scope === s.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 dark:bg-black/40 border-slate-100 dark:border-white/5 text-slate-500 hover:border-blue-500'}`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {idx > 0 && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-slate-300 dark:text-slate-800">
                                        <ChevronUp size={16} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Rules Column */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[32px] p-8">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Map size={16} className="text-blue-500" />
                        Scope Enforcement
                    </h4>
                    <div className="space-y-4">
                        {levels.map(lvl => (
                            <div key={lvl.id} className="flex items-start gap-4 p-4 bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-blue-500/50 transition-all">
                                <div className={`w-8 h-8 rounded-lg ${lvl.bg} flex items-center justify-center shrink-0`}>
                                    <Check size={14} className={lvl.color} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{lvl.label}s</span>
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${lvl.bg} ${lvl.color}`}>{lvl.scope.replace('_', ' ')}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">{lvl.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 bg-blue-600 rounded-[40px] text-white space-y-6 shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Shield size={160} />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                            <Info size={18} className="text-blue-200" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Automation Rule</span>
                    </div>
                    <p className="text-sm font-bold leading-tight italic relative z-10">"Selecting a designation will automatically limit the Territory Mapping list to the authorized scope. State heads cannot map areas outside their assigned state."</p>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-200 hover:text-white transition-colors">
                        Learn More <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
