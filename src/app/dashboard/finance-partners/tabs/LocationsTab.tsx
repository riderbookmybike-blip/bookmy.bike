import React from 'react';
import { BankLocation } from '@/types/bankPartner';
import { MapPin, Phone, Building2, Landmark, ShieldCheck } from 'lucide-react';

export default function LocationsTab({ locations }: { locations: BankLocation[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((loc) => (
                <div key={loc.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 hover:shadow-2xl hover:border-blue-500/30 transition-all relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-blue-500 border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                                {loc.type === 'BRANCH' ? <Building2 size={24} /> : <Landmark size={24} />}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {loc.isPrimary && (
                                    <span className="px-3 py-1 bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-500/20 flex items-center gap-1">
                                        <ShieldCheck size={10} /> Primary Hub
                                    </span>
                                )}
                                <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg border ${loc.type === 'BRANCH'
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                                    }`}>
                                    {loc.type === 'BRANCH' ? 'Corporate Branch' : 'Customer Service Point'}
                                </span>
                            </div>
                        </div>

                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-2">{loc.branchName}</h4>

                        <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 mb-6">
                            <MapPin size={14} className="mt-1 shrink-0 text-slate-300" />
                            <p className="text-xs font-bold leading-relaxed uppercase tracking-tight italic opacity-80">
                                {loc.address}<br />
                                <span className="text-blue-500 font-black">{loc.taluka}, {loc.state} - {loc.pincode}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 group-hover:border-blue-500/20 transition-colors">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                            <Phone size={14} />
                        </div>
                        <span className="font-black font-mono tracking-wider">{loc.contactNumber}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
