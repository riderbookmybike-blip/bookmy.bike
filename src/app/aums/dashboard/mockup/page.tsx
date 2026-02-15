'use client';

import React, { useState } from 'react';
import {
    Search,
    Bell,
    Settings,
    Plus,
    Mic,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    TrendingUp,
    Users,
    Package,
    Edit2,
    ArrowUpRight,
    Activity,
    Calendar,
    Filter,
    Star,
    ShieldCheck,
    Sun,
    Clock,
    Zap,
    Building2,
    Landmark,
    Briefcase,
    LayoutDashboard,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    RadialBarChart,
    RadialBar,
    XAxis,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
type Persona = 'AUMS' | 'DEALERSHIP' | 'FINANCER';
type Section = 'ANALYTICS' | 'OPERATIONS' | 'FINANCIALS';

// --- MOCK DATA ---
const PROFIT_DATA = [
    { name: 'Inner', value: 4000, fill: '#FFD700' },
    { name: 'Middle', value: 9300, fill: '#FF8A65' },
    { name: 'Outer', value: 14000, fill: '#E57373' },
];

const ACTIVITY_DATA = [
    { name: 'M', v: 30 },
    { name: 'T', v: 45 },
    { name: 'W', v: 25 },
    { name: 'T', v: 60 },
    { name: 'F', v: 35 },
    { name: 'S', v: 20 },
    { name: 'S', v: 40 },
];

const RECURRING_DATA = [
    { name: 'W1', value: 40 },
    { name: 'W2', value: 45 },
    { name: 'W3', value: 15 },
    { name: 'W4', value: 55 },
    { name: 'W5', value: 30 },
    { name: 'W6', value: 50 },
];

const INVENTORY_DATA = [
    { model: 'Activa 6G', stock: 12, sales: 84 },
    { model: 'Dio Standard', stock: 8, sales: 62 },
    { model: 'CB Shine', stock: 5, sales: 45 },
    { model: 'Hornet 2.0', stock: 3, sales: 12 },
];

// --- SHARED COMPONENTS ---

const BentoCard = ({
    children,
    className = '',
    title = '',
    subtitle = '',
    icon: Icon,
    action,
    noPadding = false,
}: any) => (
    <div
        className={`bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-500 flex flex-col ${noPadding ? 'p-0' : ''} ${className}`}
    >
        {(title || Icon) && (
            <div className={`flex justify-between items-start mb-6 ${noPadding ? 'p-8 pb-0' : ''}`}>
                <div>
                    {title && <h3 className="text-sm font-bold text-slate-900 mb-0.5">{title}</h3>}
                    {subtitle && <p className="text-[10px] text-slate-400 font-semibold">{subtitle}</p>}
                </div>
                {Icon && (
                    <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                        <Icon size={16} />
                    </div>
                )}
                {action && <div>{action}</div>}
            </div>
        )}
        <div className={`flex-1 ${noPadding && !title && !Icon ? 'p-0' : ''}`}>{children}</div>
    </div>
);

// --- PERSONA VIEWS ---

// 1. AUMS VIEWS
const AUMSViews = {
    ANALYTICS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-8" title="Platform Yield" subtitle="System-wide growth">
                <div className="h-[300px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={RECURRING_DATA}>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#FFD700"
                                strokeWidth={4}
                                fill="#FFD700"
                                fillOpacity={0.05}
                            />
                            <Tooltip />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </BentoCard>
            <div className="col-span-4 space-y-8">
                <BentoCard icon={Users} title="Active Sessions" subtitle="Real-time users">
                    <p className="text-4xl font-black text-slate-900 mt-4">1,842</p>
                    <p className="text-xs font-bold text-[#FFD700] mt-2 flex items-center gap-1">
                        <TrendingUp size={12} /> +12.4%
                    </p>
                </BentoCard>
                <BentoCard icon={Star} title="Dealer Satisfaction" subtitle="Network score">
                    <div className="flex items-center gap-4 mt-4">
                        <p className="text-4xl font-black text-slate-900">4.8</p>
                        <div className="flex gap-1 text-[#FFD700]">
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                        </div>
                    </div>
                </BentoCard>
            </div>
        </div>
    ),
    OPERATIONS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-4" title="System Health" icon={Zap}>
                <div className="flex flex-col items-center justify-center h-full space-y-4 py-8">
                    <div className="text-6xl font-black text-slate-900 italic">99.9%</div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFD700]">Uptime Stable</p>
                </div>
            </BentoCard>
            <BentoCard className="col-span-8" title="Integration Queue" subtitle="Dealers/Financers pending" noPadding>
                <div className="p-8 pb-4">
                    {['Royal Enfield - Mumbai', 'HDFC Capital - Corp', 'TVS Motors - Pune'].map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-2 hover:bg-[#FFD700]/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <Building2 size={18} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-900">{item}</span>
                            </div>
                            <span className="px-4 py-1.5 bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-black uppercase rounded-full">
                                Pending Verification
                            </span>
                        </div>
                    ))}
                </div>
            </BentoCard>
        </div>
    ),
    FINANCIALS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-7" title="Total AUM" subtitle="Platform capital flow">
                <div className="mt-8">
                    <p className="text-5xl font-black tracking-tighter text-slate-900 mb-2">Rs. 142.8 Cr</p>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={RECURRING_DATA}>
                                <Area
                                    type="stepBefore"
                                    dataKey="value"
                                    stroke="#FFD700"
                                    strokeWidth={3}
                                    fill="#FFD700"
                                    fillOpacity={0.05}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </BentoCard>
            <div className="col-span-5 space-y-8">
                <BentoCard icon={DollarSign} title="Platform Commission" subtitle="Revenue Q4">
                    <p className="text-3xl font-black text-slate-900 mt-4">Rs. 18.4 Lakh</p>
                </BentoCard>
                <BentoCard title="Gateway Status" noPadding>
                    <div className="p-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase">Razorpay</span>
                            <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase">PhonePe</span>
                            <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
                        </div>
                    </div>
                </BentoCard>
            </div>
        </div>
    ),
};

// 2. DEALERSHIP VIEWS
const DealershipViews = {
    ANALYTICS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-4" title="Sales Conversions" subtitle="Lead to Booking">
                <div className="relative w-40 h-40 mx-auto mt-8 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-slate-50"
                        />
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="16"
                            fill="transparent"
                            style={{ strokeDasharray: '440', strokeDashoffset: '110' }}
                            className="text-[#FFD700]"
                        />
                    </svg>
                    <span className="absolute text-4xl font-black italic">75%</span>
                </div>
                <p className="text-center text-[10px] font-black uppercase text-slate-400 mt-6 tracking-widest">
                    Efficiency Index
                </p>
            </BentoCard>
            <BentoCard className="col-span-8" title="Model-wise Performance" subtitle="Top performing stock">
                <div className="h-[300px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={INVENTORY_DATA}>
                            <XAxis
                                dataKey="model"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700 }}
                            />
                            <Bar dataKey="sales" fill="#FFD700" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </BentoCard>
        </div>
    ),
    OPERATIONS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-5" title="Live Inventory" icon={Package}>
                <div className="space-y-4 mt-6">
                    {INVENTORY_DATA.map((item, i) => (
                        <div
                            key={i}
                            className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl hover:bg-[#FFD700]/5 hover:border-[#FFD700]/20 border border-transparent transition-all"
                        >
                            <span className="text-sm font-bold text-slate-900">{item.model}</span>
                            <span className="text-xs font-black text-slate-400">{item.stock} LEFT</span>
                        </div>
                    ))}
                </div>
            </BentoCard>
            <div className="col-span-7 space-y-8">
                <BentoCard title="Today's Appointments" subtitle="Test Rides & Deliveries">
                    <div className="flex gap-4 mt-4">
                        <div className="flex-1 p-4 bg-[#FFD700]/10 rounded-[2.5rem] border border-[#FFD700]/20 flex flex-col items-center">
                            <span className="text-2xl font-black text-slate-900">12</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Test Rides</span>
                        </div>
                        <div className="flex-1 p-4 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center">
                            <span className="text-2xl font-black text-slate-900">04</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Deliveries</span>
                        </div>
                    </div>
                </BentoCard>
                <BentoCard title="Staff Activity" noPadding>
                    <div className="p-8 flex items-center justify-between">
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <img
                                    key={i}
                                    src={`https://i.pravatar.cc/100?u=${i}`}
                                    className="w-10 h-10 rounded-full border-4 border-white shadow-sm -ml-2 first:ml-0"
                                />
                            ))}
                            <div className="w-10 h-10 rounded-full bg-slate-50 border-4 border-white flex items-center justify-center text-[10px] font-black text-slate-400 -ml-2">
                                +3
                            </div>
                        </div>
                        <button className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest hover:underline">
                            Manage Team
                        </button>
                    </div>
                </BentoCard>
            </div>
        </div>
    ),
    FINANCIALS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-12" title="Revenue Tracking" subtitle="Dealer Payout Lifecycle">
                <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="p-6 bg-slate-50 rounded-[2.5rem]">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Sales</p>
                        <p className="text-2xl font-black text-slate-900">Rs. 84.4 Lakh</p>
                    </div>
                    <div className="p-6 bg-[#FFD700]/5 rounded-[2.5rem] border border-[#FFD700]/10">
                        <p className="text-[10px] font-black text-[#FFD700] uppercase mb-2">Net Margin</p>
                        <p className="text-2xl font-black text-slate-900">Rs. 12.2 Lakh</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2.5rem]">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Payouts Pending</p>
                        <p className="text-2xl font-black text-slate-900">Rs. 3.4 Lakh</p>
                    </div>
                    <div className="p-6 bg-black rounded-[2.5rem] flex items-center justify-center group overflow-hidden relative">
                        <div className="absolute inset-0 bg-[#FFD700] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <button className="text-white group-hover:text-black z-10 text-[10px] font-black uppercase tracking-widest transition-colors">
                            Request Settlement
                        </button>
                    </div>
                </div>
            </BentoCard>
        </div>
    ),
};

// 3. FINANCER VIEWS
const FinancerViews = {
    ANALYTICS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-8" title="Approval Velocity" subtitle="Average loan processing time">
                <div className="h-[250px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ACTIVITY_DATA}>
                            <Area
                                type="natural"
                                dataKey="v"
                                stroke="#FFD700"
                                strokeWidth={4}
                                fill="#FFD700"
                                fillOpacity={0.05}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-6 flex justify-between items-center bg-slate-50 p-6 rounded-[2.5rem] border border-transparent hover:border-[#FFD700]/20 transition-all">
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-900">1.2 Hrs</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Avg Response</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center">
                        <p className="text-2xl font-black text-[#FFD700]">88.4%</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Approval Rate</p>
                    </div>
                </div>
            </BentoCard>
            <BentoCard className="col-span-4" title="Portfolio Risk" icon={ShieldCheck}>
                <div className="mt-8 flex flex-col items-center">
                    <div className="w-32 h-32 bg-[#FFD700]/5 rounded-full flex items-center justify-center border-[8px] border-white shadow-xl">
                        <span className="text-3xl font-black text-[#FFD700] italic">LOW</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-6 text-center italic">
                        Standard deviation within target Q4 limits.
                    </p>
                </div>
            </BentoCard>
        </div>
    ),
    OPERATIONS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-12" title="Application Queue" subtitle="Pending Verifications" noPadding>
                <div className="p-8">
                    <div className="flex gap-4 mb-10 overflow-x-auto pb-4">
                        {['All Apps', 'In-Review', 'Pending Docs', 'Verified'].map((cat, i) => (
                            <button
                                key={i}
                                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all ${i === 1 ? 'bg-black text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:text-black'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-4">
                        {[
                            { name: 'Amit Singh', id: 'APP_982', status: 'Identity Verified', time: '2m ago' },
                            { name: 'Rashmi Das', id: 'APP_712', status: 'Pending ITR', time: '14m ago' },
                            { name: 'John Doe', id: 'APP_009', status: 'Agent Field Visit', time: '1h ago' },
                        ].map((app, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[2.5rem] hover:border-[#FFD700]/40 hover:shadow-xl transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-[#FFD700] group-hover:text-black transition-all">
                                        <Briefcase size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">
                                            {app.name}{' '}
                                            <span className="text-[10px] text-slate-300 ml-2">#{app.id}</span>
                                        </p>
                                        <p className="text-[10px] font-black text-[#FFD700] uppercase">{app.status}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-[10px] font-black text-slate-400">{app.time}</span>
                                    <button className="p-2 bg-slate-50 rounded-xl hover:bg-black hover:text-white transition-all">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </BentoCard>
        </div>
    ),
    FINANCIALS: () => (
        <div className="grid grid-cols-12 gap-8">
            <BentoCard className="col-span-8" title="Capital Displacement" subtitle="Disbursed vs Allocated">
                <div className="relative h-[300px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={RECURRING_DATA}>
                            <Area
                                type="natural"
                                dataKey="value"
                                stroke="#FFD700"
                                strokeWidth={5}
                                fill="#FFD700"
                                fillOpacity={0.1}
                            />
                            <Area type="natural" dataKey="value" stroke="#000" strokeWidth={2} fill="transparent" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </BentoCard>
            <div className="col-span-4 space-y-8">
                <BentoCard icon={Landmark} title="Disbursed Total" subtitle="This Month">
                    <p className="text-3xl font-black text-slate-900 mt-4">Rs. 4.2 Cr</p>
                    <p className="text-[10px] font-black text-[#FFD700] uppercase mt-2">+14% Growth</p>
                </BentoCard>
                <BentoCard icon={Activity} title="Avg Margin" subtitle="Interest Yield">
                    <p className="text-3xl font-black text-slate-900 mt-4">9.4%</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-2">Stable Flow</p>
                </BentoCard>
            </div>
        </div>
    ),
};

// --- MAIN GALLERY ---

export default function MockupGallery() {
    const [persona, setPersona] = useState<Persona>('AUMS');
    const [section, setSection] = useState<Section>('ANALYTICS');

    const renderContent = () => {
        let Views;
        switch (persona) {
            case 'AUMS':
                Views = AUMSViews;
                break;
            case 'DEALERSHIP':
                Views = DealershipViews;
                break;
            case 'FINANCER':
                Views = FinancerViews;
                break;
        }

        switch (section) {
            case 'ANALYTICS':
                return <Views.ANALYTICS />;
            case 'OPERATIONS':
                return <Views.OPERATIONS />;
            case 'FINANCIALS':
                return <Views.FINANCIALS />;
        }
    };

    const personaConfig = {
        AUMS: { icon: ShieldCheck, label: 'AUMS Master' },
        DEALERSHIP: { icon: Building2, label: 'Dealer Hub' },
        FINANCER: { icon: Landmark, label: 'Capital Node' },
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-40 selection:bg-[#FFD700]/30 selection:text-black">
            {/* PERSONA SWITCHER (Top Bar) */}
            <div className="bg-white border-b border-slate-100 p-6 sticky top-0 z-50 shadow-sm">
                <div className="max-w-[1400px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-10">
                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white text-xl font-black">
                            №
                        </div>
                        <div className="flex gap-4">
                            {(['AUMS', 'DEALERSHIP', 'FINANCER'] as Persona[]).map(p => {
                                const Icon = personaConfig[p].icon;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => {
                                            setPersona(p);
                                            setSection('ANALYTICS');
                                        }}
                                        className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all text-xs font-black uppercase tracking-widest ${persona === p ? 'bg-black text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
                                    >
                                        <Icon size={16} /> {personaConfig[p].label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group cursor-pointer hover:bg-black hover:text-white transition-all">
                            <Search size={18} />
                        </div>
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group cursor-pointer hover:bg-black hover:text-white transition-all">
                            <Bell size={18} />
                        </div>
                        <div className="h-8 w-px bg-slate-100" />
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-900 leading-none">Super Admin</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">AUMS_V3</p>
                            </div>
                            <img
                                src="https://i.pravatar.cc/100?u=super"
                                className="w-10 h-10 rounded-full border-2 border-slate-100"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto mt-12 px-6">
                {/* SECTION NAVIGATION */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 lowercase mb-1 underline decoration-[#FFD700] decoration-4 underline-offset-4">
                            {persona}
                        </h1>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
                            Command Node // 0xACTIVE
                        </p>
                    </div>
                    <div className="flex gap-12 border-b-2 border-slate-100 pb-2">
                        {(['ANALYTICS', 'OPERATIONS', 'FINANCIALS'] as Section[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setSection(s)}
                                className={`text-[10px] font-black uppercase tracking-widest transition-all relative ${section === s ? 'text-black' : 'text-slate-300 hover:text-slate-600'}`}
                            >
                                {s}
                                {section === s && (
                                    <motion.div
                                        layoutId="navline"
                                        className="absolute -bottom-[10px] left-0 right-0 h-0.5 bg-black"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* AI GREETING (Lock In Aesthetic) */}
                <div className="flex justify-between items-center mb-16">
                    <div className="flex-1">
                        <h2 className="text-5xl font-black tracking-tighter text-slate-900 mb-2">Hey, Need help?</h2>
                        <div className="flex items-center gap-4">
                            <p className="text-4xl text-slate-300 font-bold tracking-tight italic">
                                Just ask me anything!
                            </p>
                            <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-900 border border-slate-100 animate-bounce">
                                <Mic size={20} />
                            </div>
                        </div>
                    </div>
                    <button className="px-10 py-5 bg-[#FFD700] text-black rounded-full text-sm font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(255,215,0,0.3)] group">
                        Execute Workflow{' '}
                        <ChevronRight
                            size={20}
                            className="inline ml-2 group-hover:translate-x-1 transition-transform"
                        />
                    </button>
                </div>

                {/* BENTO STAGE */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${persona}-${section}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* FLOATING ACTION TOOLBAR */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-xl px-4 py-3 rounded-full border border-white/20 shadow-2xl z-50">
                <button className="p-4 bg-black text-white rounded-full shadow-xl hover:scale-110 transition-all hover:bg-[#FFD700] hover:text-black mt-0 flex items-center justify-center">
                    <Plus size={20} />
                </button>
                <div className="h-8 w-px bg-slate-200" />
                <button className="p-4 text-slate-400 hover:text-black transition-all hover:bg-slate-50 rounded-full">
                    <Search size={20} />
                </button>
                <button className="p-4 text-slate-400 hover:text-black transition-all hover:bg-slate-50 rounded-full">
                    <Filter size={20} />
                </button>
                <button className="p-4 text-slate-400 hover:text-black transition-all hover:bg-slate-50 rounded-full">
                    <Settings size={20} />
                </button>
            </div>
        </div>
    );
}
