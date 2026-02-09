'use client';

import React, { useState } from 'react';
import {
    Users,
    FileText,
    ShoppingCart,
    Search,
    Filter,
    ArrowRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    MessageSquare,
    Phone,
    MoreVertical,
    History,
    FileEdit,
    BadgeIndianRupee,
} from 'lucide-react';

const leadsMock = [
    {
        id: '1',
        name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        source: 'Website',
        status: 'NEW',
        model: 'Honda Activa 6G',
        taluka: 'Mumbai',
        type: 'NEW_LEAD',
    },
    {
        id: '2',
        name: 'Amit Singh',
        phone: '+91 99887 76655',
        source: 'Migrated (Firebase)',
        status: 'CONTACTED',
        model: 'Aapli Regular',
        taluka: 'Pune',
        type: 'MIGRATED',
    },
    {
        id: '3',
        name: 'Priya Patel',
        phone: '+91 91234 56789',
        source: 'Showroom',
        status: 'QUALIFIED',
        model: 'TVS Jupiter 125',
        taluka: 'Mumbai',
        type: 'NEW_LEAD',
    },
    {
        id: '4',
        name: 'Suresh Raina',
        phone: '+91 98765 00000',
        source: 'Migrated (Firebase)',
        status: 'NEW',
        model: 'BMB Classic',
        taluka: 'Nagpur',
        type: 'MIGRATED',
    },
];

const quotesMock = [
    {
        id: 'Q101',
        customer: 'Rahul Sharma',
        model: 'Honda Activa 6G',
        price: '₹92,400',
        status: 'SENT',
        date: '2 hours ago',
    },
    {
        id: 'Q102',
        customer: 'Amit Singh',
        model: 'TVS Jupiter 125',
        price: '₹1,05,200',
        status: 'DRAFT',
        date: '5 hours ago',
    },
];

const bookingsMock = [
    {
        id: 'BK-001',
        customer: 'Priya Patel',
        model: 'Honda Activa 6G',
        stage: 'finance',
        status: 'ONGOING',
        stages: {
            finance: 'COMPLETED',
            payment: 'ONGOING',
            allotment: 'PENDING',
            pdi: 'PENDING',
            delivery: 'PENDING',
        },
    },
];

export default function CRMPreviewPage() {
    const [activeTab, setActiveTab] = useState('leads');
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12 font-sans">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Design Preview
                        </span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-4 uppercase italic">
                        CRM <span className="text-indigo-600">Protocol</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">Advanced Leads, Quotes & Booking Management</p>
                </div>

                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 shadow-inner">
                    {[
                        { id: 'leads', icon: Users, label: 'Leads' },
                        { id: 'quotes', icon: FileText, label: 'Quotes' },
                        { id: 'bookings', icon: ShoppingCart, label: 'Bookings' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xl scale-105'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 gap-6">
                {activeTab === 'leads' && renderLeadsTab()}
                {activeTab === 'quotes' && renderQuotesTab()}
                {activeTab === 'bookings' && renderBookingsTab()}
            </div>
        </div>
    );

    function renderLeadsTab() {
        return (
            <div className="space-y-6">
                {/* Filters/Actions */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex-1 min-w-[300px] relative group">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search by name, phone or taluka..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                            <Filter size={16} /> Filter
                        </button>
                        <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                            Create Lead
                        </button>
                    </div>
                </div>

                {/* Leads List */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-12 gap-4 border-b border-slate-100 dark:border-white/5 p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <div className="col-span-4">Lead / Customer</div>
                        <div className="col-span-2 text-center">Source</div>
                        <div className="col-span-2 text-center">Interest</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {leadsMock.map(lead => (
                            <div
                                key={lead.id}
                                className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-slate-50 dark:hover:bg-white/2 transition-all group"
                            >
                                <div className="col-span-4 flex items-center gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${
                                            lead.type === 'MIGRATED'
                                                ? 'bg-amber-100 text-amber-600'
                                                : 'bg-indigo-100 text-indigo-600'
                                        }`}
                                    >
                                        {lead.name[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter group-hover:text-indigo-600 transition-colors">
                                            {lead.name}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                                            {lead.phone} • {lead.taluka}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 text-center flex flex-col items-center gap-1">
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest border uppercase ${
                                            lead.type === 'MIGRATED'
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}
                                    >
                                        {lead.source}
                                    </span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {lead.model}
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                        Primary Interest
                                    </div>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            lead.status === 'NEW'
                                                ? 'bg-blue-100 text-blue-600'
                                                : lead.status === 'CONTACTED'
                                                  ? 'bg-amber-100 text-amber-600'
                                                  : 'bg-emerald-100 text-emerald-600'
                                        }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                        {lead.status}
                                    </span>
                                </div>
                                <div className="col-span-2 flex justify-end gap-2 outline-none">
                                    <button className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10">
                                        <MessageSquare size={16} />
                                    </button>
                                    <button className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10">
                                        <Phone size={16} />
                                    </button>
                                    <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                                        Quote
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    function renderQuotesTab() {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Quotes List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                            Recent <span className="text-indigo-600">Quotations</span>
                        </h3>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} /> Live Revision History Enabled
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
                        {quotesMock.map(quote => (
                            <div
                                key={quote.id}
                                className="p-8 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/2 transition-all group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                            <BadgeIndianRupee size={32} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                                                    {quote.customer}
                                                </h4>
                                                <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    {quote.id}
                                                </span>
                                                <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                                    <History size={10} /> {quote.date}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-500 mt-2">{quote.model}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">
                                                Last updated {quote.date} • Sent via WhatsApp
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-3">
                                        <div className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">
                                            {quote.price}
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-all italic">
                                                <FileEdit size={12} /> Revise
                                            </button>
                                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                                                View <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar - Quick Configurator Preview */}
                <div className="space-y-6">
                    <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShoppingCart size={120} />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-widest italic leading-tight">
                            Instant <br />
                            Configurator
                        </h3>
                        <p className="text-xs text-indigo-100 font-bold mt-2 opacity-80 uppercase tracking-widest">
                            Quotes track approvals and confirmations
                        </p>

                        <div className="mt-8 space-y-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
                                    Selected Lead
                                </label>
                                <div className="text-sm font-black mt-1">Suresh Raina (Migrated)</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
                                    Model Variant
                                </label>
                                <div className="text-sm font-black mt-1">Honda Shine XL - Drum</div>
                            </div>
                            <button className="w-full py-4 bg-white dark:bg-white text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl">
                                INITIATE QUOTE
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 dark:bg-white p-8 rounded-3xl text-white dark:text-slate-900 border border-white/10">
                        <h4 className="text-xs font-black uppercase tracking-widest italic">Productivity Insight</h4>
                        <p className="text-2xl font-black mt-4 italic tracking-tighter leading-tight">
                            4.2m Avg <br />
                            Conversion Time
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            <TrendingUp size={14} /> +12% Efficiency vs Last Week
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderBookingsTab() {
        return (
            <div className="space-y-10">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                        Global <span className="text-indigo-600">Fulfillment</span> Pipeline
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-[10px] font-black text-emerald-500 uppercase">
                            <CheckCircle2 size={12} /> 12 Delivered Today
                        </div>
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full text-[10px] font-black text-amber-500 uppercase">
                            <AlertCircle size={12} /> 2 Overdue Stages
                        </div>
                    </div>
                </div>

                {bookingsMock.map(booking => (
                    <div
                        key={booking.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm"
                    >
                        <div className="flex flex-col md:flex-row justify-between gap-8 items-start mb-10">
                            <div className="flex gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-3xl">
                                    🏍️
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                                            {booking.customer}
                                        </h4>
                                        <span className="bg-slate-100 dark:bg-white/10 px-3 py-1 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {booking.id}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 mt-2">
                                        {booking.model} • Red Metallic
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Expected Delivery
                                </div>
                                <div className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">
                                    24 Jan 2026
                                </div>
                            </div>
                        </div>

                        {/* Fulfillment Pipeline Visualization */}
                        <div className="relative pt-8 pb-4">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-white/5 -translate-y-1/2 rounded-full" />
                            <div className="grid grid-cols-5 gap-4 relative">
                                {Object.entries(booking.stages).map(([stage, status], idx) => (
                                    <div key={stage} className="flex flex-col items-center gap-4">
                                        <div
                                            className={`w-10 h-10 rounded-2xl flex items-center justify-center z-10 shadow-lg transition-all duration-500 ${
                                                status === 'COMPLETED'
                                                    ? 'bg-emerald-500 text-white translate-y-0'
                                                    : status === 'ONGOING'
                                                      ? 'bg-indigo-600 text-white -translate-y-2 scale-110 shadow-indigo-600/30'
                                                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-300 translate-y-0'
                                            }`}
                                        >
                                            {status === 'COMPLETED' ? (
                                                <CheckCircle2 size={20} />
                                            ) : (
                                                <div className="text-[10px] font-black uppercase">{idx + 1}</div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <div
                                                className={`text-[10px] font-black uppercase tracking-widest ${
                                                    status === 'ONGOING' ? 'text-indigo-600' : 'text-slate-400'
                                                }`}
                                            >
                                                {stage}
                                            </div>
                                            <div
                                                className={`text-[8px] font-bold mt-1 uppercase ${
                                                    status === 'COMPLETED'
                                                        ? 'text-emerald-500'
                                                        : status === 'ONGOING'
                                                          ? 'text-indigo-400 animate-pulse'
                                                          : 'text-slate-300'
                                                }`}
                                            >
                                                {status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 flex gap-4">
                            <button className="flex-1 py-4 bg-slate-50 dark:bg-white/2 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-tighter text-slate-600 dark:text-slate-400 transition-all flex items-center justify-center gap-2">
                                <History size={14} /> Stage History
                            </button>
                            <button className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-tighter hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                                Update Next Stage <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Automation Summary Card */}
                <div className="bg-slate-50 dark:bg-white/2 rounded-[32px] p-10 border border-slate-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    <div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                            89%
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                            SLA Compliance
                        </div>
                    </div>
                    <div className="border-x border-slate-200 dark:border-white/10">
                        <div className="text-3xl font-black text-indigo-600 italic tracking-tighter">12.4Hr</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                            Avg Final Delivery
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                            98.2%
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                            Stock Availability
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

function TrendingUp(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    );
}
