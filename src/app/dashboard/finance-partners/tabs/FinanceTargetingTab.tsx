'use client';

import React, { useState, useEffect } from 'react';
import { DayRouting, DayOfWeek, FinanceRoutingTable } from '@/types/bankPartner';
import { Calendar, Check, Save, AlertCircle, Loader2, ChevronRight, LayoutGrid, Users } from 'lucide-react';
import { getBankPartners, getFinanceRouting, saveFinanceRouting } from '../actions';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function FinanceTargetingTab() {
    const [partners, setPartners] = useState<{ id: string, name: string }[]>([]);
    const [routing, setRouting] = useState<FinanceRoutingTable>({
        Monday: { p1: 'ANY', p2: 'ANY', p3: 'ANY' },
        Tuesday: { p1: 'ANY', p2: 'ANY', p3: 'ANY' },
        Wednesday: { p1: 'ANY', p2: 'ANY', p3: 'ANY' },
        Thursday: { p1: 'ANY', p2: 'ANY', p3: 'ANY' },
        Friday: { p1: 'ANY', p2: 'ANY', p3: 'ANY' },
        Saturday: { p1: 'ANY', p2: 'ANY', p3: 'ANY' },
        Sunday: { p1: 'ANY', p2: 'ANY', p3: 'ANY' },
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            const [pRes, rRes] = await Promise.all([
                getBankPartners(),
                getFinanceRouting()
            ]);

            if (pRes.success && pRes.partners) {
                setPartners(pRes.partners);
            }

            if (rRes.success && rRes.routing) {
                setRouting(rRes.routing);
            }
            setIsLoading(false);
        }
        loadData();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('IDLE');
        const res = await saveFinanceRouting(routing);
        if (res.success) {
            setSaveStatus('SUCCESS');
            setTimeout(() => setSaveStatus('IDLE'), 3000);
        } else {
            setSaveStatus('ERROR');
        }
        setIsSaving(false);
    };

    const updateDay = (day: DayOfWeek, p: 'p1' | 'p2' | 'p3', value: string) => {
        setRouting(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [p]: value
            }
        }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Initializing Targeting Matrix...</p>
            </div>
        );
    }

    return (
        <div className="p-12 pt-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
                        <LayoutGrid size={32} className="text-blue-500" />
                        Finance Routing Matrix
                    </h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 ml-12">Day-wise P1 / P2 / P3 Preferences</p>
                </div>

                <div className="flex items-center gap-4">
                    {saveStatus === 'SUCCESS' && (
                        <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 animate-in fade-in slide-in-from-right-4">
                            <Check size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Routing Updated</span>
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Targeting Settings
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-6 px-10 mb-2">
                    <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Day of Week</div>
                    <div className="col-span-3 text-[10px] font-black text-blue-500 uppercase tracking-widest text-center">Preference 1 (P1)</div>
                    <div className="col-span-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Preference 2 (P2)</div>
                    <div className="col-span-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Preference 3 (P3)</div>
                </div>

                {DAYS.map((day) => (
                    <div key={day} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-4 px-10 shadow-sm hover:border-blue-500/30 transition-all flex items-center">
                        <div className="grid grid-cols-12 gap-6 w-full items-center">
                            {/* Day */}
                            <div className="col-span-3 flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                    <Calendar size={18} />
                                </div>
                                <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{day}</span>
                            </div>

                            {/* P1 */}
                            <div className="col-span-3">
                                <select
                                    value={routing[day].p1}
                                    onChange={(e) => updateDay(day, 'p1', e.target.value)}
                                    className="w-full bg-blue-50/50 dark:bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/10 rounded-2xl px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none text-center"
                                >
                                    <option value="ANY">ANY (Open to All)</option>
                                    {partners.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* P2 */}
                            <div className="col-span-3">
                                <select
                                    value={routing[day].p2}
                                    onChange={(e) => updateDay(day, 'p2', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 outline-none focus:ring-2 focus:ring-slate-500/20 transition-all appearance-none text-center"
                                >
                                    <option value="ANY">ANY (Open to All)</option>
                                    {partners.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* P3 */}
                            <div className="col-span-3">
                                <select
                                    value={routing[day].p3}
                                    onChange={(e) => updateDay(day, 'p3', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 outline-none focus:ring-2 focus:ring-slate-500/20 transition-all appearance-none text-center"
                                >
                                    <option value="ANY">ANY (Open to All)</option>
                                    {partners.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 bg-amber-500/5 border border-amber-500/20 rounded-[32px] p-8 flex items-start gap-4">
                <AlertCircle className="text-amber-500 shrink-0" size={24} />
                <div>
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Routing Strategy Logic</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Marketplace will pick finance partners in the order of Preference (P1 → P2 → P3).
                        If a specific partner is set, we priority fetch their <strong>Brand/Model Targeted</strong> schemes.
                        If no targeted scheme exists for the selected partner, we use their <strong>Primary Scheme</strong> as fallback.
                        Selecting <strong>ANY</strong> allows the engine to pick from any available active partner.
                    </p>
                </div>
            </div>
        </div>
    );
}
