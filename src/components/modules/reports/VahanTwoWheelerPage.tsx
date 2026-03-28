'use client';
import React, { useState, useEffect } from 'react';
import {
    ChevronDown,
    ChevronUp,
    MapPin,
    Award,
    Zap,
    TrendingUp,
    Activity,
    Loader2,
    BarChart3,
    Calendar,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

// ─── Constants ────────────────────────────────────────────────
const MMRD_RTO_NAMES: Record<string, string> = {
    MH01: 'Mumbai Central',
    MH02: 'Mumbai West',
    MH03: 'Mumbai East',
    MH04: 'Thane',
    MH05: 'Kalyan',
    MH06: 'Pen (Raigad)',
    MH07: 'Sindhudurg (Kudal)',
    MH08: 'Ratnagiri',
    MH09: 'Kolhapur',
    MH10: 'Sangli',
    MH11: 'Satara',
    MH12: 'Pune',
    MH13: 'Solapur',
    MH14: 'Pimpri Chinchwad',
    MH15: 'Nashik',
    MH16: 'Ahilyanagar',
    MH17: 'Srirampur',
    MH18: 'Dhule',
    MH19: 'Jalgaon',
    MH20: 'Chhatrapati Sambhajinagar',
    MH21: 'Jalna',
    MH22: 'Parbhani',
    MH23: 'Beed',
    MH24: 'Latur',
    MH25: 'Dharashiv',
    MH26: 'Nanded',
    MH27: 'Amravati',
    MH28: 'Buldhana',
    MH29: 'Yavatmal',
    MH30: 'Akola',
    MH31: 'Nagpur (Urban)',
    MH32: 'Wardha',
    MH33: 'Gadchiroli',
    MH34: 'Chandrapur',
    MH35: 'Gondia',
    MH36: 'Bhandara',
    MH37: 'Washim',
    MH38: 'Hingoli',
    MH39: 'Nandurbar',
    MH40: 'Nagpur (Rural)',
    MH41: 'Malegaon',
    MH42: 'Baramati',
    MH43: 'Navi Mumbai',
    MH44: 'Ambejogai',
    MH45: 'Akluj',
    MH46: 'Panvel (MMR)',
    MH47: 'Mumbai North',
    MH48: 'Vasai-Virar',
    MH49: 'Nagpur (East)',
    MH50: 'Karad',
    MH51: 'Ichalkaranji',
    MH52: 'Chalisgaon',
    MH53: 'Phaltan',
    MH54: 'Bhadgaon',
    MH55: 'Udgir',
    MH56: 'Khamgaon',
    MH57: 'Vaijapur',
    MH58: 'Mira Bhayandar',
    MH99: 'TC Office',
    MH202: 'Chiplun Track',
    MH203: 'Mira Bhayandar Fitness Track',
};

// 20-color multicolor rotating palette
const PALETTE = [
    '#2563eb',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#7c3aed',
    '#06b6d4',
    '#f97316',
    '#22c55e',
    '#e11d48',
    '#0ea5e9',
    '#84cc16',
    '#14b8a6',
    '#8b5cf6',
    '#f43f5e',
    '#3b82f6',
    '#65a30d',
    '#d946ef',
    '#0891b2',
    '#dc2626',
    '#0d9488',
];

// ─── Helpers ─────────────────────────────────────────────────
const trunc = (s: string, n: number) => (!s ? '' : s.length <= n ? s : s.slice(0, n) + '…');

const fmtIN = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n));

const BRAND_ACRONYMS = new Set(['TVS', 'BMW', 'OLA', 'BNC', 'VLF', 'EV', 'AARI', 'VMOTO', 'XINRI', 'RILOX']);

const formatBrandLabel = (value: string) => {
    if (!value) return '';
    const cleaned = value.trim().replace(/\s+/g, ' ');
    return cleaned
        .split(/(\s+|\/|&|-)/)
        .map(part => {
            if (!part || /^(\s+|\/|&|-)$/.test(part)) return part;
            const upper = part.toUpperCase();
            if (BRAND_ACRONYMS.has(upper)) return upper;
            if (/^[A-Z0-9]{2,4}$/.test(upper)) return upper;
            return upper.charAt(0) + upper.slice(1).toLowerCase();
        })
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
};

// ─── Props ───────────────────────────────────────────────────
interface Props {
    dataApiPath?: string;
    showUpload?: boolean;
    title?: string;
}

// ─────────────────────────────────────────────────────────────
// KPI STATS ROW
// ─────────────────────────────────────────────────────────────
function KpiStatsRow({
    filters,
    apiPath,
    onLastDataUpdate,
}: {
    filters: any;
    apiPath: string;
    onLastDataUpdate?: (ts: string | null) => void;
}) {
    const [stats, setStats] = useState<any>(null);

    // Dynamic width detection for responsive margins
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        const ctrl = new AbortController();
        (async () => {
            try {
                const p = new URLSearchParams({
                    state_code: filters.stateCode,
                    from_month: filters.fromMonth,
                    to_month: filters.toMonth,
                });
                const res = await fetch(`${apiPath}?${p}`, { signal: ctrl.signal });
                const d = await res.json();
                if (d.kpis) setStats(d.kpis);
                onLastDataUpdate?.(d?.meta?.last_data_update_at || null);
            } catch {
                /* aborted */
            }
        })();
        return () => ctrl.abort();
    }, [filters.stateCode, filters.fromMonth, filters.toMonth, apiPath, onLastDataUpdate]);

    const items = [
        {
            label: 'Total Volume',
            value: fmtIN(stats?.total_units || 0),
            trend: stats?.prev_period_pct,
            icon: Zap,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
        },
        {
            label: 'Top Brand',
            value: stats?.top_brand ? `${formatBrandLabel(stats.top_brand)} (${stats.top_brand_pct || 0}%)` : '---',
            icon: Award,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50',
        },
        {
            label: 'Top RTO',
            value: stats?.top_rto_code
                ? `${stats.top_rto_code} · ${MMRD_RTO_NAMES[stats.top_rto_code] || stats.top_rto_name}`
                : '---',
            icon: MapPin,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
        },
        {
            label: 'MoM Growth',
            value:
                stats?.prev_period_pct != null
                    ? `${Number(stats.prev_period_pct) > 0 ? '+' : ''}${stats.prev_period_pct}%`
                    : '---',
            trend: stats?.prev_period_pct,
            icon: Activity,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
        },
        {
            label: 'YoY Growth',
            value: stats?.yoy_pct != null ? `${Number(stats.yoy_pct) > 0 ? '+' : ''}${stats.yoy_pct}%` : '---',
            trend: stats?.yoy_pct,
            icon: BarChart3,
            color: 'text-slate-500',
            bg: 'bg-slate-50',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
            {items.map((item, i) => {
                const nameParts = item.value.split(' · ');
                const displayValue = nameParts.length > 1 && nameParts[0] === nameParts[1] ? nameParts[0] : item.value;

                return (
                    <div
                        key={i}
                        className="relative group rounded-[2.5rem] p-7 transition-all duration-700 hover:-translate-y-3"
                    >
                        {/* Advanced Glass Physics */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-3xl border-[1.5px] border-white/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.06)] group-hover:shadow-[0_40px_80px_-20px_rgba(37,99,235,0.12)] transition-all duration-700 rounded-[2.5rem]" />
                        <div className="absolute inset-0 ring-1 ring-slate-900/[0.03] rounded-[2.5rem]" />

                        {/* Glass Grain Texture Overlay */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-[2.5rem] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                        {/* Dynamic Accent Glow */}
                        <div
                            className={`absolute -bottom-16 -left-16 w-48 h-48 ${item.bg} rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-all duration-1000 group-hover:scale-125`}
                        />
                        <div
                            className={`absolute -top-10 -right-10 w-32 h-32 ${item.bg} rounded-full blur-[60px] opacity-20 group-hover:opacity-50 transition-all duration-1000`}
                        />

                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex items-center justify-between">
                                <div
                                    className={`w-14 h-14 flex items-center justify-center rounded-[1.25rem] ${item.bg} ${item.color} shadow-lg shadow-${item.color.split('-')[1]}-500/15 border border-white/60 group-hover:scale-110 transition-transform duration-500`}
                                >
                                    <item.icon className="w-6 h-6 stroke-[2.5]" />
                                </div>
                                {item.trend != null && (
                                    <div
                                        className={`flex items-center gap-1 font-black px-3.5 py-1.5 rounded-full backdrop-blur-xl border border-white/80 shadow-sm text-[11px] ${Number(item.trend) >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}
                                    >
                                        {Number(item.trend) >= 0 ? (
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        ) : (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        )}
                                        {Math.abs(Number(item.trend))}%
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-slate-500 transition-colors">
                                    {item.label}
                                </span>
                                <span className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                    {displayValue}
                                </span>
                            </div>
                        </div>

                        {/* Interactive Light flare */}
                        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-[35deg] -translate-x-[200%] group-hover:translate-x-[300%] transition-transform duration-[1200ms] pointer-events-none" />
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// BRAND PERFORMANCE CHART CARD
// ─────────────────────────────────────────────────────────────
function BrandChartCard({ filters, apiPath }: { filters: any; apiPath: string }) {
    const { stateCode, fromMonth, toMonth } = filters;
    const [rtoCode, setRtoCode] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [rtos, setRtos] = useState<any[]>([]);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        let alive = true;
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const p = new URLSearchParams({
                    state_code: stateCode || 'MH',
                    from_month: fromMonth,
                    to_month: toMonth,
                    grain: 'month',
                });
                if (rtoCode && rtoCode !== 'ALL') p.set('rto_code', rtoCode);
                const payload = await fetch(`${apiPath}?${p}&_t=${Date.now()}`).then(r => r.json());
                if (!alive) return;

                setRtos((payload.rto?.share || []).sort((a: any, b: any) => a.rto_code.localeCompare(b.rto_code)));

                const raw: any[] = (payload.brand?.share || []).filter((r: any) => Number(r.units) > 0);
                const total = raw.reduce((s, r) => s + Number(r.units), 0);
                setData(
                    raw.map((r, i) => {
                        const units = Number(r.units);
                        const pct = total > 0 ? ((units / total) * 100).toFixed(1) : '0.0';
                        const brandLabel = formatBrandLabel(r.brand_display || r.brand_name);
                        return {
                            ...r,
                            units,
                            share_pct: pct,
                            brand_label: brandLabel,
                            display_label: isMobile
                                ? `${fmtIN(units)} (${pct}%)`
                                : `${trunc(brandLabel, 20)}  -  ${fmtIN(units)} (${pct}%)`,
                            _idx: i,
                        };
                    })
                );
            } catch (e) {
                console.error(e);
            } finally {
                if (alive) setLoading(false);
            }
        }, 400);
        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [stateCode, rtoCode, fromMonth, toMonth, apiPath]);

    const h = Math.max(500, data.length * 36);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden group/card shadow-slate-200/50">
            <div className="p-5 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50 shadow-sm">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-0.5">
                            Analytics
                        </h2>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Performance by Brand</h3>
                    </div>
                </div>

                <div className="relative flex items-center gap-4 bg-slate-50 hover:bg-white px-6 py-2.5 rounded-2xl border border-slate-200/60 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 min-w-[140px]">
                        <select
                            value={rtoCode}
                            onChange={e => setRtoCode(e.target.value)}
                            className="text-[12px] font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none w-full"
                        >
                            <option value="ALL">ALL RTOs</option>
                            {rtos.map(r => (
                                <option key={r.rto_code} value={r.rto_code}>
                                    {r.rto_code} – {MMRD_RTO_NAMES[r.rto_code] || r.rto_name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                </div>
            </div>
            <div className="relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                )}
                <div style={{ height: h, padding: isMobile ? '24px 10px 24px 5px' : '24px 24px 24px 10px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 0, right: isMobile ? 120 : 350, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="brand_label" hide />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{
                                    borderRadius: 12,
                                    border: 'none',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0/.1)',
                                }}
                                formatter={(v: any, _: any, p: any) => [
                                    `${fmtIN(Number(v))} (${p.payload.share_pct}%)`,
                                    'Volume',
                                ]}
                            />
                            <Bar dataKey="units" radius={[0, 6, 6, 0]} barSize={26}>
                                {data.map((_, i) => (
                                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                ))}
                                <LabelList
                                    dataKey="display_label"
                                    position="right"
                                    style={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// RTO PERFORMANCE CHART CARD  (mirrors BrandChartCard exactly)
// ─────────────────────────────────────────────────────────────
function RtoChartCard({ filters, apiPath }: { filters: any; apiPath: string }) {
    const { stateCode, fromMonth, toMonth } = filters;
    const [brandName, setBrandName] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        let alive = true;
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const p = new URLSearchParams({
                    state_code: stateCode || 'MH',
                    from_month: fromMonth,
                    to_month: toMonth,
                    grain: 'month',
                });
                if (brandName && brandName !== 'ALL') p.set('brand_name', brandName);
                const payload = await fetch(`${apiPath}?${p}&_t=${Date.now()}`).then(r => r.json());
                if (!alive) return;

                setBrands(payload.brand?.share || []);

                // Always use rto.share — same pattern as Brand chart uses brand.share
                const raw: any[] = (payload.rto?.share || []).filter((r: any) => Number(r.units) > 0);
                const total = raw.reduce((s, r) => s + Number(r.units), 0);

                const mapped = raw.map(r => {
                    const units = Number(r.units);
                    const name = MMRD_RTO_NAMES[r.rto_code] || r.rto_name || r.rto_code;
                    const pct = total > 0 ? ((units / total) * 100).toFixed(1) : '0.0';
                    return {
                        ...r,
                        units,
                        share_pct: pct,
                        display_label: isMobile
                            ? `${r.rto_code} - ${fmtIN(units)} (${pct}%)`
                            : `${r.rto_code} – ${trunc(name, 14)}  -  ${fmtIN(units)} (${pct}%)`,
                    };
                });

                setData(mapped.sort((a, b) => a.rto_code.localeCompare(b.rto_code)));
            } catch (e) {
                console.error(e);
            } finally {
                if (alive) setLoading(false);
            }
        }, 400);
        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [stateCode, brandName, fromMonth, toMonth, apiPath]);

    const h = Math.max(500, data.length * 40);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden group/card shadow-slate-200/50">
            <div className="p-5 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50 shadow-sm">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-0.5">
                            Geography
                        </h2>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Performance by RTO</h3>
                    </div>
                </div>

                <div className="relative flex items-center gap-4 bg-slate-50 hover:bg-white px-6 py-2.5 rounded-2xl border border-slate-200/60 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 min-w-[170px]">
                        <select
                            value={brandName}
                            onChange={e => setBrandName(e.target.value)}
                            className="text-[12px] font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none w-full uppercase"
                        >
                            <option value="ALL">ALL BRANDS</option>
                            {brands.map(b => (
                                <option key={b.brand_name} value={b.brand_name}>
                                    {formatBrandLabel(b.brand_display || b.brand_name)}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                </div>
            </div>
            <div className="relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                )}
                {!loading && data.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-bold">
                        No RTO data for this period
                    </div>
                )}
                <div style={{ height: h, padding: isMobile ? '24px 10px 24px 5px' : '24px 24px 24px 10px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 0, right: isMobile ? 120 : 350, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="rto_code" hide />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{
                                    borderRadius: 12,
                                    border: 'none',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0/.1)',
                                }}
                                formatter={(v: any, _: any, p: any) => [
                                    `${fmtIN(Number(v))} (${p.payload.share_pct}%)`,
                                    'Volume',
                                ]}
                            />
                            <Bar dataKey="units" radius={[0, 6, 6, 0]} barSize={26}>
                                {data.map((_, i) => (
                                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                                ))}
                                <LabelList
                                    dataKey="display_label"
                                    position="right"
                                    style={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// MASTER PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
export default function VahanTwoWheelerPage({ dataApiPath, title }: Props) {
    const apiPath = dataApiPath || '/api/vahan-intelligence';

    const fmt = (dt: Date) => {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const now = new Date();
    const [stateCode, setStateCode] = useState('MH');
    const [period, setPeriod] = useState('this_month');
    const [fromMonth, setFromMonth] = useState(fmt(new Date(now.getFullYear(), now.getMonth(), 1)));
    const [toMonth, setToMonth] = useState(fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)));

    useEffect(() => {
        const d = new Date();
        switch (period) {
            case 'today': {
                const s = fmt(d);
                setFromMonth(s);
                setToMonth(s);
                break;
            }
            case 'yesterday': {
                const y = new Date(d);
                y.setDate(y.getDate() - 1);
                const s = fmt(y);
                setFromMonth(s);
                setToMonth(s);
                break;
            }
            case 'this_week': {
                const sw = new Date(d);
                sw.setDate(d.getDate() - d.getDay());
                const ew = new Date(sw);
                ew.setDate(sw.getDate() + 6);
                setFromMonth(fmt(sw));
                setToMonth(fmt(ew));
                break;
            }
            case 'this_month':
                setFromMonth(fmt(new Date(d.getFullYear(), d.getMonth(), 1)));
                setToMonth(fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0)));
                break;
            case 'last_month':
                setFromMonth(fmt(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
                setToMonth(fmt(new Date(d.getFullYear(), d.getMonth(), 0)));
                break;
            case 'last_30_days': {
                const l = new Date(d);
                l.setDate(l.getDate() - 30);
                setFromMonth(fmt(l));
                setToMonth(fmt(d));
                break;
            }
            case 'this_quarter': {
                const sq = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
                const eq = new Date(sq.getFullYear(), sq.getMonth() + 3, 0);
                setFromMonth(fmt(sq));
                setToMonth(fmt(eq));
                break;
            }
            case 'this_year':
                setFromMonth(fmt(new Date(d.getFullYear(), 0, 1)));
                setToMonth(fmt(new Date(d.getFullYear(), 11, 31)));
                break;
            case 'last_year':
                setFromMonth(fmt(new Date(d.getFullYear() - 1, 0, 1)));
                setToMonth(fmt(new Date(d.getFullYear() - 1, 11, 31)));
                break;
        }
    }, [period]);

    const filters = { stateCode, period, fromMonth, toMonth };
    const [lastDbUpdateAt, setLastDbUpdateAt] = useState<string | null>(null);
    const lastRefreshed = (() => {
        if (!lastDbUpdateAt) return '---';
        const dt = new Date(lastDbUpdateAt);
        if (Number.isNaN(dt.getTime())) return '---';
        return dt
            .toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata',
            })
            .toUpperCase();
    })();

    return (
        <div className="relative min-h-screen bg-[#f8fafc]">
            {/* Cinematic Background Mesh */}
            <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-100/40 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-[0%] right-[-10%] w-[50vw] h-[50vw] bg-orange-100/30 rounded-full blur-[140px]" />
                <div className="absolute top-[30%] right-[5%] w-[40vw] h-[40vw] bg-emerald-50/40 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute inset-0 opacity-[0.015] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
            </div>

            <div className="page-container flex flex-col gap-10 pb-20 pt-14">
                {/* Header Area */}
                <div className="flex flex-col gap-6">
                    {/* Primary Row: Title & Main Filter Island */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                        <div className="flex items-center gap-6">
                            <div className="w-2.5 h-14 bg-gradient-to-b from-[#FF9933] via-white to-[#138808] rounded-full shadow-sm border border-slate-200/20" />
                            <div className="flex flex-col">
                                <h1 className="text-5xl md:text-6xl font-black tracking-[-0.05em] text-slate-900 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-800 to-slate-500 leading-none">
                                    {title || 'Vahan Dashboard'}
                                </h1>
                            </div>
                        </div>

                        {/* Glass Filter Floating Island - Perfectly Aligned */}
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-orange-500/40 rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:scale-110" />
                            <div className="relative bg-white/50 backdrop-blur-[40px] border-[1.5px] border-white/90 rounded-[2.8rem] p-4 px-10 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.12)] flex flex-wrap items-center gap-10">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <div className="bg-white/80 px-6 py-4 rounded-2xl border border-white shadow-sm flex items-center gap-4 hover:shadow-lg transition-all cursor-pointer">
                                            <select
                                                value={stateCode}
                                                onChange={e => setStateCode(e.target.value)}
                                                className="bg-transparent text-[13px] font-black text-slate-800 border-none p-0 focus:ring-0 cursor-pointer appearance-none min-w-[160px]"
                                            >
                                                <option value="MH">MAHARASHTRA</option>
                                                <option value="GUJ">GUJARAT</option>
                                                <option value="KA">KARNATAKA</option>
                                            </select>
                                            <ChevronDown className="w-5 h-5 text-indigo-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="w-[1.5px] h-12 bg-slate-200/40 hidden lg:block" />

                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <div className="bg-white/80 px-6 py-4 rounded-2xl border border-white shadow-sm flex items-center gap-4 hover:shadow-lg transition-all cursor-pointer">
                                            <select
                                                value={period}
                                                onChange={e => setPeriod(e.target.value)}
                                                className="bg-transparent text-[13px] font-black text-slate-800 border-none p-0 focus:ring-0 cursor-pointer appearance-none min-w-[140px]"
                                            >
                                                <option value="today">Today</option>
                                                <option value="yesterday">Yesterday</option>
                                                <option value="this_week">This Week</option>
                                                <option value="last_30_days">Last 30 Days</option>
                                                <option value="this_month">This Month</option>
                                                <option value="last_month">Last Month</option>
                                                <option value="this_quarter">This Quarter</option>
                                                <option value="this_year">This Year</option>
                                                <option value="last_year">Last Year</option>
                                            </select>
                                            <ChevronDown className="w-5 h-5 text-indigo-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Status Row: Meta info aligned below their parents */}
                    <div className="flex flex-col md:flex-row justify-between items-center -mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Last refreshed on {lastRefreshed}
                            </span>
                        </div>
                    </div>
                </div>

                {/* KPI Row */}
                <KpiStatsRow filters={filters} apiPath={apiPath} onLastDataUpdate={setLastDbUpdateAt} />

                {/* Charts */}
                <div className="flex flex-col gap-10 w-full">
                    <BrandChartCard filters={filters} apiPath={apiPath} />
                    <RtoChartCard filters={filters} apiPath={apiPath} />
                </div>
            </div>
        </div>
    );
}
