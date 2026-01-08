import { Building2, Activity, Globe, Mail, Phone, ShieldCheck, CheckCircle2, Clock, BarChart4, MapPin, Zap } from 'lucide-react';
import { BankPartner } from '@/types/bankPartner';

export default function OverviewTab({ partner }: { partner: BankPartner }) {
    return (
        <div className="p-12 pt-4">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Active Schemes', value: partner.schemes.length, icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Avg. TAT', value: '2.5 Days', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10' },
                    { label: 'Approval Rate', value: '78%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                    { label: 'Disbursal Vol.', value: '₹4.2 Cr', icon: BarChart4, color: 'text-purple-600', bg: 'bg-purple-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm dark:shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all hover:scale-[1.02] duration-300">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} blur-[50px] -z-0 opacity-20 dark:opacity-40 group-hover:opacity-100 transition-opacity`} />
                        <div className="relative z-10">
                            <stat.icon size={22} className={`${stat.color} mb-5`} />
                            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-2">{stat.label}</div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="col-span-8 space-y-8">
                    {/* Partner Bio */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-10 relative overflow-hidden shadow-sm dark:shadow-2xl">
                        <div className="flex items-start justify-between mb-10">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-1 flex items-center gap-3">
                                    <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                        <Building2 size={18} />
                                    </span>
                                    Partner Profile
                                </h3>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] ml-11">Entity Description & Identity</div>
                            </div>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed mb-10 max-w-2xl italic font-medium opacity-80 pl-1">
                            {partner.overview.description || "Leading financial institution providing specialized credit solutions for the automotive sector, with a primary focus on two-wheeler personal loans and dealer inventory financing."}
                        </p>

                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-white/5">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Reach & Digital</label>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                            <Globe size={14} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Official Website</div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">{partner.overview.website || 'www.hdfcbank.com'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                            <Mail size={14} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Support Email</div>
                                            <div className="text-xs text-slate-700 dark:text-white font-bold">{partner.overview.supportEmail}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Lending Scope</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Two Wheeler', 'Electric Vehicles', 'Used Bikes'].map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lending Parameters Matrix */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-10 shadow-sm dark:shadow-2xl">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <Zap size={18} />
                            </span>
                            Default Underwriting Matrix
                        </h3>
                        <div className="grid grid-cols-3 gap-6">
                            {[
                                { label: 'Min Credit Score', value: '650+', detail: 'CIBIL / Experian' },
                                { label: 'Max LTV', value: '95%', detail: 'On Ex-Showroom' },
                                { label: 'Age Criteria', value: '21 - 65', detail: 'At Loan Maturity' },
                            ].map((p, i) => (
                                <div key={i} className="bg-slate-50 dark:bg-black/40 p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-inner hover:bg-slate-100 dark:hover:bg-black/20 transition-colors group">
                                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">{p.label}</div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{p.value}</div>
                                    <div className="text-[9px] text-slate-500 font-black mt-2 uppercase tracking-[0.1em]">{p.detail}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="col-span-4 space-y-8">
                    {/* Active Reach */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm dark:shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">Active Reach</h3>
                            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black shadow-[0_0_15px_rgba(59,130,246,0.1)]">LIVE</span>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500">
                                        <MapPin size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Branches</span>
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white tracking-widest">450+</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500">
                                        <Activity size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Dealers Connected</span>
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white tracking-widest">12,840</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm dark:shadow-2xl">
                        <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-8 border-b border-slate-100 dark:border-white/5 pb-6">Activity Log</h3>
                        <div className="space-y-6">
                            {[
                                { title: 'Scheme Updated', detail: 'Festive Offer 2.0 edited by Ajit', time: '2h ago' },
                                { title: 'Status Changed', detail: 'HDFC Bank marked as ACTIVE', time: '1d ago' },
                                { title: 'New Scheme Added', detail: 'Super Saver 2W created', time: '3d ago' },
                            ].map((log, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                    <div>
                                        <div className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider">{log.title}</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">{log.detail}</div>
                                        <div className="text-[9px] text-slate-400 mt-1">{log.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-2 border border-slate-200 dark:border-white/5 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            View Full History
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
