import React from 'react';
import {
    User,
    Phone,
    Mail,
    Globe,
    Share2,
    Calendar,
    Store,
    MapPin,
    Clock,
    MessageSquare,
    FileText,
    CheckCircle2,
    Zap,
    History,
    ChevronRight,
    Bike,
    Loader2
} from 'lucide-react';
import { Lead } from './LeadList';
import { getCustomerHistory } from '@/actions/crm';

// Tab 1: Overview
export function LeadOverview({ lead }: { lead: Lead }) {
    if (!lead) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
            {/* Primary Identity Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Core Data Card */}
                <div className="md:col-span-2 bg-white dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-indigo-600">
                        <User size={18} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">Contextual Identity</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Name</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{lead.customerName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contact Node</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{lead.phone}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Zone Pincode</p>
                            <p className="text-base font-bold text-slate-600 dark:text-slate-300">{lead.pincode || 'UPDATING...'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Temporal Signature (DOB)</p>
                            <p className="text-base font-bold text-slate-600 dark:text-slate-300">{lead.dob || 'NOT_SYNCED'}</p>
                        </div>
                    </div>
                </div>

                {/* Intelligence HUD */}
                <div className="bg-indigo-600 dark:bg-indigo-600/10 border border-indigo-600/20 rounded-2xl p-6 text-white dark:text-indigo-400 shadow-xl shadow-indigo-600/20">
                    <div className="flex items-center gap-2 mb-6 opacity-80">
                        <Zap size={18} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">Lead Analysis</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Acquisition Source</p>
                            <div className="text-lg font-black italic">{lead.source}</div>
                        </div>
                        <div className="pt-4 border-t border-white/10 dark:border-indigo-600/20">
                            <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-60">Intent Intensity</p>
                            <div className="h-2 w-full bg-white/20 dark:bg-white/5 rounded-full overflow-hidden mb-2">
                                <div className={`h-full bg-white dark:bg-indigo-500 transition-all duration-1000 ${lead.intentScore === 'HOT' ? 'w-full shadow-[0_0_12px_rgba(255,255,255,0.5)]' : lead.intentScore === 'WARM' ? 'w-2/3' : 'w-1/3'}`} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-right">{lead.intentScore || 'ANALYZING...'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interest Manifest */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex items-center gap-6 hover:border-indigo-500/30 transition-all group cursor-pointer">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 border border-slate-100 dark:border-white/5">
                        <Bike size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Target Model</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{lead.interestModel || 'GENERIC_INTEREST'}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex items-center gap-6 hover:border-indigo-500/30 transition-all group cursor-pointer">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 border border-slate-100 dark:border-white/5">
                        <Share2 size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Network Referral</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight italic">{lead.referralSource || 'DIRECT_CHANNEL'}</p>
                    </div>
                </div>
            </div>

            {/* Internal Intelligence Notes */}
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <FileText size={18} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">Internal Intelligence Notes</h3>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-600/10 text-indigo-600 rounded uppercase tracking-tighter">Private_Record</span>
                </div>

                <div className="relative group">
                    <textarea
                        placeholder="Record internal observations, customer preferences, or follow-up strategy..."
                        className="w-full h-32 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none"
                    />
                    <div className="absolute bottom-4 right-4">
                        <button
                            onClick={() => {
                                // @ts-ignore - Dynamic import to avoid SSR issues if any, though sonner is usually fine
                                import('sonner').then(({ toast }) => toast.success('Intelligence Snapshot Recorded'));
                            }}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Zap size={12} />
                            Snapshot Note
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Tab: Customer Lifetime History
export function LeadHistory({ customerId }: { customerId?: string }) {
    const [history, setHistory] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!customerId) return;
        setLoading(true);
        getCustomerHistory(customerId).then(data => {
            setHistory(data);
            setLoading(false);
        });
    }, [customerId]);

    if (loading) return (
        <div className="py-20 text-center space-y-4 opacity-40">
            <Loader2 size={32} className="mx-auto text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Retrieving Historical Clusters...</p>
        </div>
    );

    if (!history) return (
        <div className="py-20 text-center space-y-4 opacity-40">
            <History size={40} className="mx-auto text-slate-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">No Historical Footprint Found</p>
        </div>
    );

    const allEvents = [
        ...(history.leads || []).map((l: any) => ({ ...l, type: 'LEAD', icon: User })),
        ...(history.quotes || []).map((q: any) => ({ ...q, type: 'QUOTE', icon: FileText })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
            {/* History Header & Stats */}
            <div className="bg-slate-900 dark:bg-white/5 rounded-3xl p-8 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter">Lifetime Activity</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-system interaction log</p>
                </div>
                <div className="text-center md:text-right bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-3xl font-black text-indigo-400 tabular-nums">₹{history.quotes.reduce((acc: number, q: any) => acc + (q.commercials?.grand_total || 0), 0).toLocaleString()}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Transactional Value</p>
                </div>
            </div>

            {/* Event Timeline */}
            <div className="space-y-3">
                {allEvents.map((event, idx) => (
                    <div key={idx} className="group p-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                                <event.icon size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 dark:text-white text-sm">
                                    {event.type === 'LEAD' ? 'New Interest Captured' : 'Proposal Generated'}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-bold text-indigo-500 uppercase">{event.interest_model || event.commercials?.label || 'Direct Context'}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    <span className="text-[9px] font-bold text-slate-400">{new Date(event.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase">
                                {event.status}
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-all" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Tab: Interactions (Placeholder)
export function LeadTransactions() {
    return (
        <div className="py-20 text-center opacity-40 space-y-6 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
            <Zap className="mx-auto text-slate-400 dark:text-slate-600" size={48} strokeWidth={1} />
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Interaction Pulse Inactive</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Real-time telephonic and physical interaction monitoring for this node is currently pending synchronization.</p>
            </div>
        </div>
    );
}

// Tab: Documents
export function LeadDocuments() {
    return (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-indigo-500/30 transition-all">
            <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-white/10 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <FileText className="text-slate-400" size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Secure Identity Vault</p>
            <p className="text-xs text-slate-500 mt-2">Initialize secure document upload protocol</p>
        </div>
    );
}

// Tab: Activity (Timeline)
export function LeadActivity({ lead }: { lead: Lead }) {
    const events = (lead as any).events_log || [];

    if (events.length === 0) {
        return (
            <div className="py-20 text-center opacity-40 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                <Clock className="mx-auto text-slate-400" size={48} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4">Zero Event Clusters Detected</p>
            </div>
        );
    }

    return (
        <div className="relative pl-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Functional Thread Line */}
            <div className="absolute left-[15px] top-2 bottom-0 w-0.5 bg-slate-200 dark:bg-white/5" />

            {events.map((event: any, idx: number) => (
                <div key={idx} className="relative group pl-8">
                    {/* Node Dot */}
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.3)] z-10" />

                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6 group-hover:border-indigo-500/20 hover:shadow-xl transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                            <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight italic">
                                {event.title || event.type?.replace('_', ' ')}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-100 dark:border-white/5">
                                <Clock size={12} className="text-indigo-500" />
                                {event.timestamp ? new Date(event.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'Real-time'}
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            {event.description || event.meta || 'System-generated activity log for this node.'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab: Quotes (Functional)
export function LeadQuotes({ leadId }: { leadId: string }) {
    const [quotes, setQuotes] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        import('@/actions/crm').then(({ getQuotesForLead }) => {
            getQuotesForLead(leadId).then(data => {
                setQuotes(data);
                setLoading(false);
            });
        });
    }, [leadId]);

    if (loading) return (
        <div className="py-20 text-center opacity-40">
            <Loader2 size={32} className="mx-auto text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest mt-4">Retrieving Commercial Proposals...</p>
        </div>
    );

    if (quotes.length === 0) return (
        <div className="py-20 text-center opacity-40 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
            <FileText className="mx-auto text-slate-400" size={48} strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4">No Quotes Generated</p>
        </div>
    );

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {quotes.map((quote) => (
                <div key={quote.id} className="glass-card p-6 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 dark:text-white">QT-{quote.id.slice(0, 4).toUpperCase()}</h4>
                                {quote.is_latest && <span className="text-[9px] font-black px-2 py-0.5 bg-green-500/10 text-green-500 rounded uppercase tracking-tighter">Latest</span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{quote.commercials?.label || 'Standard Quote'} • {new Date(quote.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black text-slate-900 dark:text-white italic">₹{quote.commercials?.grand_total?.toLocaleString()}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{quote.status}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Tab: Booking (Functional - Hybrid Data Model)
export function LeadBookings({ leadId }: { leadId: string }) {
    const [booking, setBooking] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        import('@/actions/crm').then(({ getBookingForLead }) => {
            getBookingForLead(leadId).then(data => {
                setBooking(data);
                setLoading(false);
            });
        });
    }, [leadId]);

    if (loading) return (
        <div className="py-20 text-center opacity-40">
            <Loader2 size={32} className="mx-auto text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest mt-4">Syncing Booking Ledger...</p>
        </div>
    );

    if (!booking) return (
        <div className="py-20 text-center opacity-40 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
            <CheckCircle2 className="mx-auto text-slate-400" size={48} strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4">Awaiting Conversion to Booking</p>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="glass-panel p-8 border-l-4 border-l-indigo-600">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Active Sales Order</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">SO-{booking.id.slice(0, 4).toUpperCase()}</h3>
                    </div>
                    <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                        {booking.current_stage || 'Processing'}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Booking Date</p>
                        <p className="font-bold text-slate-900 dark:text-white">{new Date(booking.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VIN Status</p>
                        <p className="font-bold text-slate-900 dark:text-white font-mono">{booking.vin || 'PENDING_ALLOCATION'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</p>
                        <p className="font-bold text-slate-900 dark:text-white uppercase">{booking.payment_method || 'RESERVED'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Delivery Node</p>
                        <p className="font-bold text-slate-900 dark:text-white">{booking.delivery_status || 'SCHEDULED'}</p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 flex items-center gap-4">
                    <button className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all">
                        View Full Dossier
                    </button>
                    <button className="px-6 py-3 border border-slate-200 dark:border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        Log Interaction
                    </button>
                </div>
            </div>
        </div>
    );
}
