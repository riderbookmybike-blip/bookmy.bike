'use client';
import React, { useMemo, useState, useEffect } from 'react';
import {
    ChevronDown,
    ChevronUp,
    MapPin,
    Award,
    Zap,
    Fuel,
    Download,
    TrendingUp,
    Activity,
    Loader2,
    BarChart3,
    Calendar,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList,
    LineChart,
    Line,
} from 'recharts';

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

const RUNNING_SERIES_COLOR_STOPS = [
    { t: 0.0, h: 132, s: 58, l: 28 }, // 0: dark green
    { t: 0.25, h: 118, s: 62, l: 44 }, // 2500: light green
    { t: 0.5, h: 58, s: 74, l: 56 }, // 5000: lighter yellowish
    { t: 0.75, h: 28, s: 80, l: 47 }, // 7500: amber/orange
    { t: 0.9, h: 8, s: 78, l: 40 }, // 9000: red
    { t: 1.0, h: 0, s: 74, l: 28 }, // 10000: dark red
];

const getRunningSeriesColor = (filledTill: number) => {
    const clamped = Math.max(0, Math.min(9999, Number(filledTill) || 0));
    const p = clamped / 9999;

    let left = RUNNING_SERIES_COLOR_STOPS[0];
    let right = RUNNING_SERIES_COLOR_STOPS[RUNNING_SERIES_COLOR_STOPS.length - 1];
    for (let i = 0; i < RUNNING_SERIES_COLOR_STOPS.length - 1; i++) {
        const a = RUNNING_SERIES_COLOR_STOPS[i];
        const b = RUNNING_SERIES_COLOR_STOPS[i + 1];
        if (p >= a.t && p <= b.t) {
            left = a;
            right = b;
            break;
        }
    }

    const span = Math.max(right.t - left.t, 0.0001);
    const local = (p - left.t) / span;
    const h = left.h + (right.h - left.h) * local;
    const s = left.s + (right.s - left.s) * local;
    const l = left.l + (right.l - left.l) * local;
    return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
};

const formatSeriesProgressLabel = (seriesName: string, filledTill: number) => {
    const normalized = String(seriesName || '')
        .trim()
        .toUpperCase();
    const filledNumber = Math.max(0, Number(filledTill) || 0);
    const isNewSeries = filledNumber <= 0;
    const isExpiredSeries = filledNumber >= 9998;
    const filledPart = isNewSeries ? 'NEW' : isExpiredSeries ? 'EXPIRED' : String(filledNumber).padStart(4, '0');
    const m = normalized.match(/^([A-Z]{1,3}\d{1,3})([A-Z]{1,5})$/);
    if (m) return `${m[1]}-${m[2]}-${filledPart}`;
    return `${normalized || 'NA'}-${filledPart}`;
};

const formatOpenAgeLabel = (activeOnDate: string | null | undefined) => {
    if (!activeOnDate) return null;
    const dt = new Date(activeOnDate);
    if (Number.isNaN(dt.getTime())) return null;
    const diffMs = Date.now() - dt.getTime();
    const days = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
    return `opened ${days} day${days === 1 ? '' : 's'} ago`;
};

const formatSeriesOpenDate = (activeOnDate: string | null | undefined, openOnText?: string | null) => {
    if (activeOnDate) {
        const dt = new Date(activeOnDate);
        if (!Number.isNaN(dt.getTime())) {
            return dt.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                timeZone: 'Asia/Kolkata',
            });
        }
    }
    return String(openOnText || 'NA');
};

const getRtoSortNumber = (rtoCode: string) => {
    const code = String(rtoCode || '')
        .toUpperCase()
        .trim();
    const m = code.match(/^MH(\d{1,3})$/);
    return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
};

const compareRtoCodeNumeric = (a: string, b: string) => {
    const aNum = getRtoSortNumber(a);
    const bNum = getRtoSortNumber(b);
    if (aNum !== bNum) return aNum - bNum;
    return String(a || '').localeCompare(String(b || ''), 'en');
};

// ─── Helpers ─────────────────────────────────────────────────
const trunc = (s: string, n: number) => (!s ? '' : s.length <= n ? s : s.slice(0, n) + '…');

const fmtIN = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n));
const fmtCompactUnits = (n: number) => {
    const v = Number(n || 0);
    if (!Number.isFinite(v)) return '0';
    if (Math.abs(v) < 1000) return String(Math.round(v));
    const abs = Math.abs(v);
    if (abs >= 1000000) {
        const m = v / 1000000;
        const d = Math.abs(m) < 10 ? 2 : Math.abs(m) < 100 ? 1 : 0;
        return `${m.toFixed(d)}m`;
    }
    const k = v / 1000;
    const d = Math.abs(k) < 10 ? 2 : Math.abs(k) < 100 ? 1 : 0;
    return `${k.toFixed(d)}k`;
};
const formatLastSyncForTooltip = (timestamp: string | null | undefined) => {
    if (!timestamp) return 'Last Sync: ---';
    const dt = new Date(timestamp);
    if (Number.isNaN(dt.getTime())) return 'Last Sync: ---';
    const date = dt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
    });
    const time = dt.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
    });
    return `Last Sync: ${date}, ${time} IST`;
};

const formatIstDateTime = (value: string | null | undefined) => {
    if (!value) return '---';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '---';
    return dt.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
    });
};

const toDateOnly = (value: string) => {
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? new Date() : dt;
};

const shiftDays = (dt: Date, days: number) => {
    const x = new Date(dt);
    x.setDate(x.getDate() + days);
    return x;
};

const diffDaysInclusive = (from: Date, to: Date) => {
    const ms = to.getTime() - from.getTime();
    return Math.max(1, Math.floor(ms / (24 * 60 * 60 * 1000)) + 1);
};

const computePreviousRange = (fromMonth: string, toMonth: string) => {
    const from = toDateOnly(fromMonth);
    const to = toDateOnly(toMonth);
    const span = diffDaysInclusive(from, to);
    const prevTo = shiftDays(from, -1);
    const prevFrom = shiftDays(prevTo, -(span - 1));
    const fmt = (dt: Date) =>
        `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    return { prevFrom: fmt(prevFrom), prevTo: fmt(prevTo) };
};

const formatMonthYear = (value: string) => {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

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

const calculateDates = (period: string) => {
    const d = new Date();
    const fmt = (dt: Date) => {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    switch (period) {
        case 'this_month':
            return {
                from: fmt(new Date(d.getFullYear(), d.getMonth(), 1)),
                to: fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
            };
        case 'last_month':
            return {
                from: fmt(new Date(d.getFullYear(), d.getMonth() - 1, 1)),
                to: fmt(new Date(d.getFullYear(), d.getMonth(), 0)),
            };
        case 'this_year':
            return {
                from: fmt(new Date(d.getFullYear(), 0, 1)),
                to: fmt(new Date(d.getFullYear(), 11, 31)),
            };
        case 'last_year':
            return {
                from: fmt(new Date(d.getFullYear() - 1, 0, 1)),
                to: fmt(new Date(d.getFullYear() - 1, 11, 31)),
            };
        case 'all_time':
            return {
                from: '2015-01-01',
                to: fmt(d),
            };
        default:
            return {
                from: fmt(new Date(d.getFullYear(), d.getMonth(), 1)),
                to: fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
            };
    }
};

const VAHAN_BRAND_CLASSIFICATION: Record<string, 'ICE' | 'EV'> = {
    AARI: 'ICE',
    AMPERE: 'EV',
    'ANCHI MOTORCYCLE': 'ICE',
    ATHER: 'EV',
    BAJAJ: 'ICE',
    'BATTRE ELECTRIC MOBLITY': 'EV',
    BENLING: 'EV',
    BGAUSS: 'EV',
    BMW: 'ICE',
    BNC: 'EV',
    'BOUNCE INFINITY': 'EV',
    CHANGLING: 'ICE',
    'CHINA HAOCHEN': 'ICE',
    'DAO EV': 'EV',
    DUCATI: 'ICE',
    'E-SPRINTO': 'EV',
    'ECOBIT INTERNATIONAL': 'ICE',
    'ECOPLANET MOTORS': 'EV',
    'ELECTRIC ALLIANCE': 'EV',
    'ELEGO MOTORS': 'EV',
    'ELTHOR ENERGY': 'EV',
    'EVTRIC MOTORS': 'EV',
    'GODAWARI ELECTRIC MOTORS': 'EV',
    'GREAVES ELECTRIC': 'EV',
    'HARLEY-DAVIDSON': 'ICE',
    'HAYASA EV': 'EV',
    HERO: 'ICE',
    'HERO ELECTRIC': 'EV',
    HONDA: 'ICE',
    'HONGKONG RUIQUE': 'EV',
    'HONGKONG WANGYUAN': 'EV',
    'HONGKONG YIXING': 'EV',
    'HOP ELECTRIC': 'EV',
    'INETIC GREEN': 'EV',
    IVOOMI: 'EV',
    'IZANAU ELECTRIC': 'EV',
    'JAWA / YEZDI': 'ICE',
    'JIANGSU SUNHOU': 'ICE',
    'JITENDRA EV': 'EV',
    JIYAYI: 'ICE',
    'JUNENG MOTORCYCLE': 'ICE',
    KABIRA: 'EV',
    KAINING: 'ICE',
    KAWASAKI: 'ICE',
    KEEWAY: 'ICE',
    KINETIC: 'ICE',
    KOMAKI: 'EV',
    'KSR SOLUTION': 'ICE',
    KTM: 'ICE',
    'KYTE ENERGY': 'EV',
    'LECTRIX EV': 'EV',
    'MAC INTERNATIONAL': 'ICE',
    MATTER: 'EV',
    'MECPOWER MOBILITY': 'EV',
    'MERCURY EV TECH': 'EV',
    MOTOVOLT: 'EV',
    'NINGBO LONGJIA': 'ICE',
    NK: 'ICE',
    OBEN: 'EV',
    ODYSSE: 'EV',
    'OKAYA EV': 'EV',
    OKINAWA: 'EV',
    'OLA ELECTRIC': 'EV',
    PIAGGIO: 'ICE',
    'PUR ENERGY': 'EV',
    'QUANTUM ENERGY': 'EV',
    REVOLT: 'EV',
    'RGM BUSINESS PLUS': 'ICE',
    RILOX: 'EV',
    RIVER: 'EV',
    'ROYAL ENFIELD': 'ICE',
    'SEEKA E MOTORS': 'EV',
    'SIMPLE ENERGY': 'EV',
    'SOKUDO ELECTRIC INDIA': 'EV',
    SUZUKI: 'ICE',
    TAYO: 'EV',
    TRIUMPH: 'ICE',
    TVS: 'ICE',
    ULTRAVIOLETTE: 'EV',
    VLF: 'EV',
    VMOTO: 'EV',
    WARDWIZARD: 'EV',
    'WUXI TENGHUI': 'EV',
    XINRI: 'EV',
    YAMAHA: 'ICE',
    ZAP: 'EV',
};

const MIXED_FUEL_BRANDS = new Set(['TVS', 'BAJAJ', 'HERO']);

const normalizeBrandKey = (value: string) => {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
};

const getBrandSegment = (value: string): 'ICE' | 'EV' | 'MIXED' | 'UNCERTAIN' => {
    const normalized = normalizeBrandKey(value);
    if (!normalized) return 'UNCERTAIN';
    if (MIXED_FUEL_BRANDS.has(normalized)) return 'MIXED';
    return VAHAN_BRAND_CLASSIFICATION[normalized] || 'UNCERTAIN';
};

const isEvBrand = (value: string) => {
    const segment = getBrandSegment(value);
    return segment === 'EV' || segment === 'MIXED';
};

const matchesSelectedSegment = (brandValue: string, selected: 'ALL' | 'ICE' | 'EV') => {
    if (selected === 'ALL') return true;
    const segment = getBrandSegment(brandValue);
    if (selected === 'EV') return segment === 'EV' || segment === 'MIXED';
    return segment === 'ICE' || segment === 'MIXED' || segment === 'UNCERTAIN';
};

const formatPeriodShort = (value: string) => {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return String(value || '');
    return dt.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
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
                if (d.kpis) {
                    const nextStats: any = { ...d.kpis };
                    const segmentedRows: any[] = Array.isArray(d?.brand?.share_segmented)
                        ? d.brand.share_segmented
                        : [];
                    if (segmentedRows.length > 0) {
                        let totalUnits = 0;
                        let evUnits = 0;
                        let iceUnits = 0;
                        for (const row of segmentedRows) {
                            const total = Number(row?.total_units || 0);
                            const ev = Number(row?.ev_units || 0);
                            const ice = Number(row?.ice_units || 0);
                            totalUnits += total;
                            evUnits += ev;
                            iceUnits += ice;
                        }
                        nextStats.ev_units_total = evUnits;
                        nextStats.ice_units_total = iceUnits;
                        if (totalUnits > 0) {
                            nextStats.ev_share_pct = Number(((evUnits / totalUnits) * 100).toFixed(1));
                            nextStats.ice_share_pct = Number(((iceUnits / totalUnits) * 100).toFixed(1));
                        }
                    }
                    setStats(nextStats);
                }
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
            icon: BarChart3,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
        },
        {
            label: 'EV Share',
            value:
                stats?.ev_share_pct != null ? `${fmtIN(stats?.ev_units_total || 0)} (${stats.ev_share_pct}%)` : '---',
            icon: Zap,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
        {
            label: 'ICE Share',
            value:
                stats?.ice_share_pct != null
                    ? `${fmtIN(stats?.ice_units_total || 0)} (${stats.ice_share_pct}%)`
                    : '---',
            icon: Fuel,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
        },
        {
            label: 'Prev Period',
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
            icon: TrendingUp,
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
                        className="relative group rounded-[2.8rem] p-8 transition-all duration-700 hover:-translate-y-4 overflow-hidden"
                    >
                        {/* Advanced Glass Physics - Unified with Header */}
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[40px] border border-white/90 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08)] group-hover:shadow-[0_45px_100px_-25px_rgba(15,23,42,0.18)] transition-all duration-700 rounded-[2.8rem]" />

                        {/* Shimmer Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-[2.8rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="flex flex-col gap-8 relative z-10">
                            <div className="flex items-center justify-between">
                                <div
                                    className={`w-16 h-16 flex items-center justify-center rounded-3xl ${item.bg} ${item.color} shadow-2xl shadow-slate-200/50 border border-white/60 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative overflow-hidden`}
                                >
                                    <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <item.icon className="w-7 h-7 stroke-[2.2] relative z-10" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-black tracking-[0.2em] text-slate-400 group-hover:text-slate-500 transition-colors">
                                    {item.label}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xl md:text-2xl font-black text-slate-900 tracking-[-0.03em] leading-tight flex flex-wrap items-baseline gap-2">
                                        {displayValue}
                                    </span>
                                </div>
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
    const { stateCode } = filters;
    const globalLastSyncAt = filters?.lastDbUpdateAt || null;
    const [rtoCode, setRtoCode] = useState('ALL');
    const [segmentView, setSegmentView] = useState<'BOTH' | 'ICE' | 'EV'>('BOTH');
    const [period, setPeriod] = useState('this_month');
    const [fromMonth, setFromMonth] = useState('');
    const [toMonth, setToMonth] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [rtos, setRtos] = useState<any[]>([]);
    const [evCoverage, setEvCoverage] = useState<{
        expected_rto_count: number;
        covered_rto_count: number;
        coverage_pct: number;
        is_partial: boolean;
    } | null>(null);

    useEffect(() => {
        const { from, to } = calculateDates(period);
        setFromMonth(from);
        setToMonth(to);
    }, [period]);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (!fromMonth || !toMonth) return;
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
                setEvCoverage(payload?.meta?.ev_rto_coverage || null);

                setRtos((payload.rto?.share || []).sort((a: any, b: any) => a.rto_code.localeCompare(b.rto_code)));

                const raw: any[] = (payload.brand?.share_segmented || []).filter(
                    (r: any) => Number(r.total_units || 0) > 0
                );

                const total = raw.reduce((s, r) => s + Number(r.total_units || 0), 0);
                const mapped = raw.map((r, i) => {
                    const totalUnits = Number(r.total_units || 0);
                    const iceUnits = Number(r.ice_units || 0);
                    const evUnits = Number(r.ev_units || 0);
                    const pct = total > 0 ? ((totalUnits / total) * 100).toFixed(1) : '0.0';
                    const brandLabelRaw = r.brand_display || r.brand_name;
                    const brandLabel = formatBrandLabel(brandLabelRaw);
                    const segText =
                        evUnits > 0 && iceUnits > 0 ? ` [EV ${fmtIN(evUnits)} | ICE ${fmtIN(iceUnits)}]` : '';

                    return {
                        ...r,
                        total_units: totalUnits,
                        ice_units: iceUnits,
                        ev_units: evUnits,
                        share_pct: pct,
                        brand_label: brandLabel,
                        display_label: isMobile
                            ? `${brandLabel} - ${fmtIN(totalUnits)} (${pct}%)`
                            : `${trunc(brandLabel, 20)}  -  ${fmtIN(totalUnits)} (${pct}%) ${segText}`,
                        _idx: i,
                    };
                });

                setData(mapped.sort((a, b) => Number(b.total_units || 0) - Number(a.total_units || 0)));
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

    const visibleData = useMemo(() => {
        const metricKey = segmentView === 'EV' ? 'ev_units' : segmentView === 'ICE' ? 'ice_units' : 'total_units';
        const rows = (data || [])
            .map((r: any) => {
                const totalUnits = Number(r.total_units || 0);
                const evUnits = Number(r.ev_units || 0);
                const iceUnits = Number(r.ice_units || 0);
                const metricUnits = segmentView === 'EV' ? evUnits : segmentView === 'ICE' ? iceUnits : totalUnits;
                return {
                    ...r,
                    total_units: totalUnits,
                    ev_units: evUnits,
                    ice_units: iceUnits,
                    metric_units: metricUnits,
                    metric_key: metricKey,
                };
            })
            .filter((r: any) => Number(r.metric_units || 0) > 0)
            .sort((a: any, b: any) => Number(b.metric_units || 0) - Number(a.metric_units || 0));

        const metricTotal = rows.reduce((s: number, r: any) => s + Number(r.metric_units || 0), 0);
        return rows.map((r: any) => {
            const pct = metricTotal > 0 ? ((Number(r.metric_units || 0) / metricTotal) * 100).toFixed(1) : '0.0';
            const label = formatBrandLabel(r.brand_display || r.brand_name || '');
            const displayLabel =
                segmentView === 'BOTH'
                    ? isMobile
                        ? `${fmtIN(r.total_units)} (EV ${fmtIN(r.ev_units)} | ICE ${fmtIN(r.ice_units)})`
                        : `${trunc(label, 20)}  -  ${fmtIN(r.total_units)} (${pct}%)  [EV ${fmtIN(r.ev_units)} | ICE ${fmtIN(r.ice_units)}]`
                    : isMobile
                      ? `${fmtIN(r.metric_units)} (${pct}%)`
                      : `${trunc(label, 20)} - ${fmtIN(r.metric_units)} (${pct}%)`;
            return {
                ...r,
                share_pct: pct,
                display_label: displayLabel,
            };
        });
    }, [data, segmentView, isMobile]);

    const h = Math.max(500, visibleData.length * 36);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden group/card shadow-slate-200/50">
            <div className="p-5 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#FFD700]/10 text-yellow-600 rounded-xl border border-[#FFD700]/30 shadow-sm">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-0.5">
                            Analytics
                        </h2>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Performance by Brand</h3>
                            {evCoverage?.is_partial && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    EV partial {evCoverage.covered_rto_count}/{evCoverage.expected_rto_count}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar pt-1 pr-4">
                    {/* Period Selector Pill */}
                    <div className="relative flex items-center gap-2.5 bg-white/60 hover:bg-white/90 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] hover:border-[#FFD700]/50 transition-all cursor-pointer group/pill">
                        <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center shrink-0 group-hover/pill:bg-[#FFD700]/10 transition-colors">
                            <Calendar className="w-3.5 h-3.5 text-amber-600 group-hover/pill:text-amber-700 transition-colors" />
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-[80px] md:min-w-[110px]">
                            <select
                                value={period}
                                onChange={e => setPeriod(e.target.value)}
                                className="text-[11px] md:text-[12px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none w-full text-center h-full flex items-center justify-center"
                            >
                                <option value="this_month">This Month</option>
                                <option value="last_month">Last Month</option>
                                <option value="this_year">This Year</option>
                                <option value="last_year">Last Year</option>
                                <option value="all_time">All Year</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 group-hover/pill:text-slate-600 shrink-0" />
                        </div>
                    </div>

                    {/* RTO Selector Pill */}
                    <div className="relative flex items-center gap-2.5 bg-white/60 hover:bg-white/90 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] hover:border-[#FFD700]/50 transition-all cursor-pointer group/pill">
                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover/pill:bg-blue-100 transition-colors">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 group-hover/pill:text-blue-700 transition-colors" />
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-[100px] md:min-w-[130px]">
                            <select
                                value={rtoCode}
                                onChange={e => setRtoCode(e.target.value)}
                                className="text-[11px] md:text-[12px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none w-full text-center h-full flex items-center justify-center"
                            >
                                <option value="ALL">All RTOs</option>
                                {rtos.map(r => (
                                    <option key={r.rto_code} value={r.rto_code}>
                                        {r.rto_code} · {r.rto_name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 group-hover/pill:text-slate-600 shrink-0" />
                        </div>
                    </div>

                    {/* EV/ICE View Selector */}
                    <div className="relative flex items-center gap-2.5 bg-white/60 hover:bg-white/90 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] hover:border-[#FFD700]/50 transition-all cursor-pointer group/pill">
                        <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover/pill:bg-slate-100 transition-colors">
                            <Zap className="w-3.5 h-3.5 text-slate-600 transition-colors" />
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-[72px] md:min-w-[90px]">
                            <select
                                value={segmentView}
                                onChange={e => setSegmentView(e.target.value as 'BOTH' | 'ICE' | 'EV')}
                                className="text-[11px] md:text-[12px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none w-full text-center h-full flex items-center justify-center"
                            >
                                <option value="BOTH">Both</option>
                                <option value="ICE">ICE</option>
                                <option value="EV">EV</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 group-hover/pill:text-slate-600 shrink-0" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
                    </div>
                )}
                <div style={{ height: h, padding: isMobile ? '24px 10px 24px 5px' : '24px 24px 24px 10px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={visibleData}
                            layout="vertical"
                            margin={{ top: 0, right: isMobile ? 120 : 250, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide domain={[0, 'dataMax']} />
                            <YAxis type="category" dataKey="brand_label" hide />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{
                                    borderRadius: 12,
                                    border: 'none',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0/.1)',
                                }}
                                content={({ active, payload }: any) => {
                                    if (!active || !payload?.length) return null;
                                    const p = payload[0]?.payload || {};
                                    return (
                                        <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-3 py-2 text-[12px] text-slate-700">
                                            <div className="font-black text-slate-900 mb-1">
                                                {p.brand_label || 'Brand'}
                                            </div>
                                            <div>{`Total: ${fmtIN(Number(p.total_units || 0))} (${p.share_pct || 0}%)`}</div>
                                            <div>{`EV: ${fmtIN(Number(p.ev_units || 0))}`}</div>
                                            <div>{`ICE: ${fmtIN(Number(p.ice_units || 0))}`}</div>
                                            <div className="mt-1 text-[10px] font-semibold text-slate-500">
                                                {formatLastSyncForTooltip(globalLastSyncAt)}
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                            {segmentView === 'BOTH' && (
                                <>
                                    <Bar
                                        dataKey="ice_units"
                                        stackId="total"
                                        radius={[6, 0, 0, 6]}
                                        barSize={26}
                                        fill="#f59e0b"
                                    />
                                    <Bar
                                        dataKey="ev_units"
                                        stackId="total"
                                        radius={[0, 6, 6, 0]}
                                        barSize={26}
                                        fill="#10b981"
                                    >
                                        <LabelList
                                            dataKey="display_label"
                                            position="right"
                                            style={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                        />
                                    </Bar>
                                </>
                            )}
                            {segmentView === 'ICE' && (
                                <Bar dataKey="ice_units" radius={[6, 6, 6, 6]} barSize={26} fill="#f59e0b">
                                    <LabelList
                                        dataKey="display_label"
                                        position="right"
                                        style={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                    />
                                </Bar>
                            )}
                            {segmentView === 'EV' && (
                                <Bar dataKey="ev_units" radius={[6, 6, 6, 6]} barSize={26} fill="#10b981">
                                    <LabelList
                                        dataKey="display_label"
                                        position="right"
                                        style={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                    />
                                </Bar>
                            )}
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
    const { stateCode } = filters;
    const globalLastSyncAt = filters?.lastDbUpdateAt || null;
    const [brandName, setBrandName] = useState('ALL');
    const [segmentView, setSegmentView] = useState<'BOTH' | 'ICE' | 'EV'>('BOTH');
    const [period, setPeriod] = useState('this_month');
    const [fromMonth, setFromMonth] = useState('');
    const [toMonth, setToMonth] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [evCoverage, setEvCoverage] = useState<{
        expected_rto_count: number;
        covered_rto_count: number;
        coverage_pct: number;
        is_partial: boolean;
    } | null>(null);

    useEffect(() => {
        const { from, to } = calculateDates(period);
        setFromMonth(from);
        setToMonth(to);
    }, [period]);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (!fromMonth || !toMonth) return;
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
                setEvCoverage(payload?.meta?.ev_rto_coverage || null);

                setBrands((payload.brand?.share || []).filter((b: any) => Number(b.units || 0) > 0));

                const raw: any[] = (payload.rto?.share_segmented || []).filter(
                    (r: any) => Number(r.total_units || 0) > 0
                );
                const total = raw.reduce((s, r) => s + Number(r.total_units || 0), 0);

                const mapped = raw.map(r => {
                    const totalUnits = Number(r.total_units || 0);
                    const iceUnits = Number(r.ice_units || 0);
                    const evUnits = Number(r.ev_units || 0);
                    const name = MMRD_RTO_NAMES[r.rto_code] || r.rto_name || r.rto_code;
                    const pct = total > 0 ? ((totalUnits / total) * 100).toFixed(1) : '0.0';
                    return {
                        ...r,
                        total_units: totalUnits,
                        ice_units: iceUnits,
                        ev_units: evUnits,
                        share_pct: pct,
                        display_label: isMobile
                            ? `${r.rto_code} - ${fmtIN(totalUnits)} (${pct}%)`
                            : `${r.rto_code} – ${name} - ${fmtIN(totalUnits)} (${pct}%)`,
                    };
                });

                setData(mapped.sort((a, b) => Number(b.total_units || 0) - Number(a.total_units || 0)));
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

    const visibleData = useMemo(() => {
        const metricKey = segmentView === 'EV' ? 'ev_units' : segmentView === 'ICE' ? 'ice_units' : 'total_units';
        const rows = (data || [])
            .map((r: any) => {
                const totalUnits = Number(r.total_units || 0);
                const evUnits = Number(r.ev_units || 0);
                const iceUnits = Number(r.ice_units || 0);
                const metricUnits = segmentView === 'EV' ? evUnits : segmentView === 'ICE' ? iceUnits : totalUnits;
                return {
                    ...r,
                    total_units: totalUnits,
                    ev_units: evUnits,
                    ice_units: iceUnits,
                    metric_units: metricUnits,
                    metric_key: metricKey,
                };
            })
            .filter((r: any) => Number(r.metric_units || 0) > 0)
            .sort((a: any, b: any) => Number(b.metric_units || 0) - Number(a.metric_units || 0));

        const metricTotal = rows.reduce((s: number, r: any) => s + Number(r.metric_units || 0), 0);
        return rows.map((r: any) => {
            const pct = metricTotal > 0 ? ((Number(r.metric_units || 0) / metricTotal) * 100).toFixed(1) : '0.0';
            const name = MMRD_RTO_NAMES[r.rto_code] || r.rto_name || r.rto_code;
            const displayLabel =
                segmentView === 'BOTH'
                    ? isMobile
                        ? `${r.rto_code} - ${fmtIN(r.total_units)} (${pct}%)`
                        : `${r.rto_code} – ${name} - ${fmtIN(r.total_units)} (${pct}%)`
                    : isMobile
                      ? `${r.rto_code} - ${fmtIN(r.metric_units)} (${pct}%)`
                      : `${r.rto_code} – ${name} - ${fmtIN(r.metric_units)} (${pct}%)`;
            return {
                ...r,
                share_pct: pct,
                display_label: displayLabel,
            };
        });
    }, [data, segmentView, isMobile]);

    const h = Math.max(500, visibleData.length * 40);

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
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Performance by RTO</h3>
                            {evCoverage?.is_partial && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    EV partial {evCoverage.covered_rto_count}/{evCoverage.expected_rto_count}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar pt-1 pr-4">
                    {/* Period Selector Pill */}
                    <div className="relative flex items-center gap-2.5 bg-white/60 hover:bg-white/90 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] hover:border-[#FFD700]/50 transition-all cursor-pointer group/pill">
                        <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center shrink-0 group-hover/pill:bg-[#FFD700]/10 transition-colors">
                            <Calendar className="w-3.5 h-3.5 text-amber-600 group-hover/pill:text-amber-700 transition-colors" />
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-[80px] md:min-w-[110px]">
                            <select
                                value={period}
                                onChange={e => setPeriod(e.target.value)}
                                className="text-[11px] md:text-[12px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none w-full text-center h-full flex items-center justify-center"
                            >
                                <option value="this_month">This Month</option>
                                <option value="last_month">Last Month</option>
                                <option value="this_year">This Year</option>
                                <option value="last_year">Last Year</option>
                                <option value="all_time">All Year</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 group-hover/pill:text-slate-600 shrink-0" />
                        </div>
                    </div>

                    {/* Brand Selector Pill */}
                    <div className="relative flex items-center gap-2.5 bg-white/60 hover:bg-white/90 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] hover:border-[#FFD700]/50 transition-all cursor-pointer group/pill">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-hover/pill:bg-indigo-100 transition-colors">
                            <Award className="w-3.5 h-3.5 text-indigo-600 group-hover/pill:text-indigo-700 transition-colors" />
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-[120px] md:min-w-[150px]">
                            <select
                                value={brandName}
                                onChange={e => setBrandName(e.target.value)}
                                className="text-[11px] md:text-[12px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none w-full text-center h-full flex items-center justify-center"
                            >
                                <option value="ALL">All Brands</option>
                                {brands.map(b => (
                                    <option key={b.brand_name} value={b.brand_name}>
                                        {formatBrandLabel(b.brand_display || b.brand_name)}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 group-hover/pill:text-slate-600 shrink-0" />
                        </div>
                    </div>

                    {/* EV/ICE View Selector */}
                    <div className="relative flex items-center gap-2.5 bg-white/60 hover:bg-white/90 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] hover:border-[#FFD700]/50 transition-all cursor-pointer group/pill">
                        <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover/pill:bg-slate-100 transition-colors">
                            <Zap className="w-3.5 h-3.5 text-slate-600 transition-colors" />
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-[72px] md:min-w-[90px]">
                            <select
                                value={segmentView}
                                onChange={e => setSegmentView(e.target.value as 'BOTH' | 'ICE' | 'EV')}
                                className="text-[11px] md:text-[12px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none w-full text-center h-full flex items-center justify-center"
                            >
                                <option value="BOTH">Both</option>
                                <option value="ICE">ICE</option>
                                <option value="EV">EV</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 group-hover/pill:text-slate-600 shrink-0" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
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
                            data={visibleData}
                            layout="vertical"
                            margin={{ top: 0, right: isMobile ? 140 : 300, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide domain={[0, 'dataMax']} />
                            <YAxis type="category" dataKey="rto_code" hide />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{
                                    borderRadius: 12,
                                    border: 'none',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0/.1)',
                                }}
                                content={({ active, payload }: any) => {
                                    if (!active || !payload?.length) return null;
                                    const p = payload[0]?.payload || {};
                                    return (
                                        <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-3 py-2 text-[12px] text-slate-700">
                                            <div className="font-black text-slate-900 mb-1">{`${p.rto_code || ''} · ${p.rto_name || ''}`}</div>
                                            <div>{`Total: ${fmtIN(Number(p.total_units || 0))} (${p.share_pct || 0}%)`}</div>
                                            <div>{`EV: ${fmtIN(Number(p.ev_units || 0))}`}</div>
                                            <div>{`ICE: ${fmtIN(Number(p.ice_units || 0))}`}</div>
                                            <div className="mt-1 text-[10px] font-semibold text-slate-500">
                                                {formatLastSyncForTooltip(globalLastSyncAt)}
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                            {segmentView === 'BOTH' && (
                                <>
                                    <Bar
                                        dataKey="ice_units"
                                        stackId="total"
                                        radius={[6, 0, 0, 6]}
                                        barSize={26}
                                        fill="#f59e0b"
                                    />
                                    <Bar
                                        dataKey="ev_units"
                                        stackId="total"
                                        radius={[0, 6, 6, 0]}
                                        barSize={26}
                                        fill="#10b981"
                                    >
                                        <LabelList
                                            dataKey="display_label"
                                            position="right"
                                            style={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                        />
                                    </Bar>
                                </>
                            )}
                            {segmentView === 'ICE' && (
                                <Bar dataKey="ice_units" radius={[6, 6, 6, 6]} barSize={26} fill="#f59e0b">
                                    <LabelList
                                        dataKey="display_label"
                                        position="right"
                                        style={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                    />
                                </Bar>
                            )}
                            {segmentView === 'EV' && (
                                <Bar dataKey="ev_units" radius={[6, 6, 6, 6]} barSize={26} fill="#10b981">
                                    <LabelList
                                        dataKey="display_label"
                                        position="right"
                                        style={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                                    />
                                </Bar>
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// RUNNING SERIES STATUS CARD (mirrors RTO chart style)
// ─────────────────────────────────────────────────────────────
function RunningSeriesStatusCard({ filters, apiPath }: { filters: any; apiPath: string }) {
    const { stateCode, fromMonth, toMonth } = filters;
    const globalLastSyncAt = filters?.lastDbUpdateAt || null;
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

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
                const payload = await fetch(`${apiPath}?${p}&_t=${Date.now()}`).then(r => r.json());
                if (!alive) return;

                const raw: any[] = payload.series?.running || [];
                const syncTs = raw
                    .map((r: any) => String(r?.scraped_at || ''))
                    .filter(Boolean)
                    .sort()
                    .at(-1);
                setLastSyncAt(syncTs || null);

                const dedupedByRto = new Map<string, any>();
                for (const row of raw) {
                    const code = String(row?.rto_code || '')
                        .toUpperCase()
                        .trim();
                    const prev = dedupedByRto.get(code);
                    if (!prev) {
                        dedupedByRto.set(code, row);
                        continue;
                    }
                    const rowFilled = Number(row?.filled_till || 0);
                    const prevFilled = Number(prev?.filled_till || 0);
                    const rowOpen = Number(row?.running_open_count || 0);
                    const prevOpen = Number(prev?.running_open_count || 0);
                    if (rowFilled > prevFilled || (rowFilled === prevFilled && rowOpen > prevOpen)) {
                        dedupedByRto.set(code, row);
                    }
                }

                const mapped = Array.from(dedupedByRto.values()).map((r, i) => {
                    const runningOpenCount = Number(r.running_open_count || 0);
                    const availableCount = Number(r.available_count || 0);
                    const filledTill = Number(r.filled_till || 0);
                    const remaining = Math.max(9999 - filledTill, 0);
                    const metricUnits = Math.max(filledTill, 0);
                    const seriesName = String(r.series_name || '').trim() || 'NA';
                    const openAgeLabel = formatOpenAgeLabel(r.active_on_date || null);
                    return {
                        ...r,
                        metric_units: metricUnits,
                        filled_till: filledTill,
                        remaining,
                        running_open_count: runningOpenCount,
                        available_count: availableCount,
                        display_label: formatSeriesProgressLabel(seriesName, filledTill),
                        open_age_label: openAgeLabel,
                        series_open_date_label: formatSeriesOpenDate(r.active_on_date || null, r.open_on_text || null),
                        _idx: i,
                    };
                });

                setData(
                    mapped.sort((a, b) => {
                        const diff = Number(a.metric_units || 0) - Number(b.metric_units || 0);
                        return diff !== 0 ? diff : compareRtoCodeNumeric(a.rto_code, b.rto_code);
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
    }, [stateCode, fromMonth, toMonth, apiPath, isMobile]);

    const h = Math.max(500, data.length * 40);
    const syncText = (() => {
        if (!lastSyncAt) return 'Last Sync: ---';
        const ts = new Date(lastSyncAt);
        if (Number.isNaN(ts.getTime())) return 'Last Sync: ---';
        const diffMs = Date.now() - ts.getTime();
        const mins = Math.max(0, Math.floor(diffMs / 60000));
        if (mins < 60) return `Last Sync: ${mins} min ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `Last Sync: ${hrs} hour${hrs > 1 ? 's' : ''} ago`;
        const days = Math.floor(hrs / 24);
        return `Last Sync: ${days} day${days > 1 ? 's' : ''} ago`;
    })();

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden group/card shadow-slate-200/50">
            <div className="p-5 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100/50 shadow-sm">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-0.5">
                            Vahan Series
                        </h2>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Running Series Status</h3>
                    </div>
                </div>
            </div>
            <div className="relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
                    </div>
                )}
                {!loading && data.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-bold">
                        No running series data
                    </div>
                )}
                <div style={{ height: h, padding: isMobile ? '24px 10px 24px 5px' : '24px 24px 24px 10px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 0, right: isMobile ? 120 : 250, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide domain={[0, 'dataMax']} />
                            <YAxis type="category" dataKey="rto_code" hide />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{
                                    borderRadius: 12,
                                    border: 'none',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0/.1)',
                                }}
                                content={({ active, payload }) => {
                                    if (!active || !payload || !payload.length) return null;
                                    const p: any = payload[0].payload || {};
                                    return (
                                        <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-3 py-2 text-[12px] text-slate-700">
                                            <div>{`${p.rto_name || 'NA'} - ${p.rto_code || 'NA'}`}</div>
                                            <div>{`Series Open Date - ${p.series_open_date_label || 'NA'}`}</div>
                                            <div>{`Days Ago - ${p.open_age_label ? p.open_age_label.replace('opened ', '').replace(' ago', '') : 'NA'}`}</div>
                                            <div className="mt-1 text-[10px] font-semibold text-slate-500">
                                                {formatLastSyncForTooltip(globalLastSyncAt)}
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                            <Bar dataKey="metric_units" radius={[0, 6, 6, 0]} barSize={26}>
                                {data.map((row: any, i: number) => (
                                    <Cell key={i} fill={getRunningSeriesColor(Number(row?.filled_till || 0))} />
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

function TimelineByBrandCard({ filters, apiPath }: { filters: any; apiPath: string }) {
    const { stateCode, fromMonth, toMonth } = filters;
    const globalLastSyncAt = filters?.lastDbUpdateAt || null;
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [lineKeys, setLineKeys] = useState<string[]>([]);
    const [localPeriod, setLocalPeriod] = useState('this_month');
    const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
    const [brandType, setBrandType] = useState<'ALL' | 'ICE' | 'EV'>('ALL');

    const renderBrandPointDot = (lineKey: string, color: string) => {
        const BrandPointDot = (props: any): React.ReactNode => {
            const row = props?.payload || {};
            const units = Number(row?.[lineKey] || 0);
            if (!Number.isFinite(units) || units <= 0) return null;
            const x = Number(props?.cx || 0);
            const y = Number(props?.cy || 0);
            return (
                <g>
                    <circle cx={x} cy={y} r={3} fill={color} />
                    <text
                        x={x}
                        y={y - 8}
                        fill="#64748b"
                        fontSize={10}
                        fontWeight={800}
                        dominantBaseline="auto"
                        textAnchor="middle"
                    >
                        {fmtCompactUnits(units)}
                    </text>
                </g>
            );
        };
        BrandPointDot.displayName = `BrandPointDot_${lineKey}`;
        return BrandPointDot;
    };

    const renderTimelineTooltip = ({ active, payload, label }: any) => {
        if (!active || !Array.isArray(payload) || payload.length === 0) return null;
        const entries = payload
            .map((p: any) => ({
                name: String(p?.name || ''),
                value: Number(p?.value || 0),
                color: String(p?.color || '#94a3b8'),
            }))
            .filter((p: any) => Number.isFinite(p.value) && p.value > 0)
            .sort((a: any, b: any) => b.value - a.value);
        if (!entries.length) return null;

        const total = entries.reduce((sum: number, e: any) => sum + e.value, 0);
        return (
            <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur px-3 py-2 shadow-lg min-w-[220px]">
                <p className="text-[11px] font-black text-slate-800 mb-1">{String(label || '')}</p>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {entries.map((e: any) => {
                        const pct = total > 0 ? (e.value * 100) / total : 0;
                        return (
                            <div key={e.name} className="flex items-center justify-between gap-3 text-[11px]">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: e.color }}
                                    />
                                    <span className="font-bold text-slate-700 truncate">
                                        {formatBrandLabel(e.name)}
                                    </span>
                                </div>
                                <span className="font-black text-slate-900 whitespace-nowrap">
                                    {fmtIN(e.value)} ({pct.toFixed(1)}%)
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-1 text-[10px] font-semibold text-slate-500">
                    {formatLastSyncForTooltip(globalLastSyncAt)}
                </div>
            </div>
        );
    };

    useEffect(() => {
        let alive = true;
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                let activeFrom = fromMonth;
                let activeTo = toMonth;
                let activeGrain = 'month';
                if (localPeriod !== 'inherit') {
                    const d = new Date();
                    const fmtDate = (dt: Date) =>
                        `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
                    if (localPeriod === 'all_time') {
                        activeFrom = '2015-01-01';
                        activeTo = fmtDate(new Date());
                        activeGrain = 'year';
                    } else if (localPeriod === 'this_month') {
                        activeFrom = fmtDate(new Date(d.getFullYear(), d.getMonth(), 1));
                        activeTo = fmtDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
                        activeGrain = 'month';
                    } else if (localPeriod === 'last_month') {
                        activeFrom = fmtDate(new Date(d.getFullYear(), d.getMonth() - 1, 1));
                        activeTo = fmtDate(new Date(d.getFullYear(), d.getMonth(), 0));
                        activeGrain = 'month';
                    } else if (localPeriod === 'this_year') {
                        activeFrom = fmtDate(new Date(d.getFullYear(), 0, 1));
                        activeTo = fmtDate(new Date(d.getFullYear(), 11, 31));
                        activeGrain = 'month';
                    } else if (localPeriod === 'last_year') {
                        activeFrom = fmtDate(new Date(d.getFullYear() - 1, 0, 1));
                        activeTo = fmtDate(new Date(d.getFullYear() - 1, 11, 31));
                        activeGrain = 'month';
                    }
                }

                const p = new URLSearchParams({
                    state_code: stateCode || 'MH',
                    from_month: activeFrom,
                    to_month: activeTo,
                    grain: activeGrain,
                });
                const payload = await fetch(`${apiPath}?${p}&_t=${Date.now()}`).then(r => r.json());
                if (!alive) return;

                const sourceRows: any[] = payload.brand?.trend || [];
                const rows = sourceRows.filter((r: any) => {
                    const label = String(r.brand_display || r.brand_name || '').trim();
                    return matchesSelectedSegment(label, brandType);
                });
                const totals = new Map<string, number>();
                for (const r of rows) {
                    const k = String(r.brand_display || r.brand_name || '').trim();
                    totals.set(k, (totals.get(k) || 0) + Number(r.units || 0));
                }
                const sortedBrands = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
                const allKeysByVol = sortedBrands.map(([k]) => k);

                const allKeysSorted = [...allKeysByVol].sort((a, b) => a.localeCompare(b, 'en'));

                const periodMap = new Map<string, any>();
                for (const r of rows) {
                    const label = String(r.brand_display || r.brand_name || '').trim();
                    const period = String(r.period_start || '');

                    let pLabel = formatPeriodShort(period);
                    if (activeGrain === 'year') {
                        pLabel = period.substring(0, 4);
                    } else if (activeGrain === 'day') {
                        const dObj = new Date(period);
                        if (!Number.isNaN(dObj.getTime())) {
                            pLabel = dObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                        }
                    }

                    const curr = periodMap.get(period) || { period, period_label: pLabel };
                    curr[label] = (curr[label] || 0) + Number(r.units || 0);
                    periodMap.set(period, curr);
                }
                const merged = Array.from(periodMap.values()).sort((a, b) =>
                    String(a.period).localeCompare(String(b.period), 'en')
                );

                // Default selection rule: always keep the first 3 visible brands selected
                // for the active filter bucket (ALL/ICE/EV).
                const top3Keys = new Set(allKeysSorted.slice(0, 3));
                const initialHidden = new Set(allKeysSorted.filter(k => !top3Keys.has(k)));
                setHiddenKeys(initialHidden);
                setLineKeys(allKeysSorted);
                setChartData(merged);
            } catch (e) {
                console.error(e);
            } finally {
                if (alive) setLoading(false);
            }
        }, 350);

        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [stateCode, fromMonth, toMonth, localPeriod, brandType, apiPath]);

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden group/card shadow-slate-200/50">
                <div className="p-5 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#FFD700]/10 text-yellow-600 rounded-xl border border-[#FFD700]/30 shadow-sm">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-0.5">
                                Timeline
                            </h2>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Timeline by Brand</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center gap-2.5 bg-white/60 hover:bg-white/90 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] hover:border-[#FFD700]/50 transition-all cursor-pointer group/pill">
                            <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover/pill:bg-[#FFD700]/10 transition-colors">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover/pill:text-[#FFD700] transition-colors" />
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-1.5 min-w-[100px] md:min-w-[140px]">
                                <select
                                    value={localPeriod}
                                    onChange={e => setLocalPeriod(e.target.value)}
                                    className="text-[11px] md:text-[12px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none w-full text-center h-full flex items-center justify-center"
                                >
                                    <option value="inherit">Sync (Global)</option>
                                    <option value="this_month">This Month</option>
                                    <option value="last_month">Last Month</option>
                                    <option value="this_year">This Year</option>
                                    <option value="last_year">Last Year</option>
                                    <option value="all_time">All Year</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-slate-400 group-hover/pill:text-slate-600 shrink-0" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="relative flex flex-col h-[800px] p-4">
                    {loading && (
                        <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
                        </div>
                    )}
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 24, right: 36, left: 16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
                                <XAxis dataKey="period_label" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip content={renderTimelineTooltip} />
                                {lineKeys
                                    .filter(k => !hiddenKeys.has(k))
                                    .map(k => {
                                        const i = lineKeys.indexOf(k);
                                        return (
                                            <Line
                                                key={k}
                                                type="monotone"
                                                dataKey={k}
                                                stroke={PALETTE[i % PALETTE.length]}
                                                strokeWidth={2.2}
                                                dot={renderBrandPointDot(k, PALETTE[i % PALETTE.length])}
                                                isAnimationActive={false}
                                            />
                                        );
                                    })}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100/70 shadow-sm">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                                Timeline
                            </p>
                            <p className="text-sm font-black text-slate-900 tracking-tight">Select Brands</p>
                            <p className="text-[10px] md:text-[11px] font-semibold text-slate-400 mt-0.5">
                                Select the brands you want to compare in the timeline chart.
                            </p>
                        </div>
                    </div>
                    <div className="relative flex items-center gap-2.5 bg-white/60 hover:bg-white/90 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] hover:border-[#FFD700]/50 transition-all cursor-pointer group/pill">
                        <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${brandType === 'EV' ? 'bg-emerald-50 group-hover/pill:bg-emerald-100' : 'bg-orange-50 group-hover/pill:bg-orange-100'}`}
                        >
                            <Zap
                                className={`w-3.5 h-3.5 transition-colors ${brandType === 'EV' ? 'text-emerald-600' : 'text-orange-600'}`}
                            />
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-[36px] md:min-w-[50px]">
                            <select
                                value={brandType}
                                onChange={e => setBrandType(e.target.value as 'ALL' | 'ICE' | 'EV')}
                                className="text-[11px] md:text-[12px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none w-full text-center h-full flex items-center justify-center"
                            >
                                <option value="ALL">All</option>
                                <option value="ICE">ICE</option>
                                <option value="EV">EV</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 group-hover/pill:text-slate-600 shrink-0" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 text-[10px] md:text-[11px]">
                    {lineKeys.map((k, i) => {
                        const active = !hiddenKeys.has(k);
                        const color = PALETTE[i % PALETTE.length];
                        return (
                            <button
                                key={k}
                                onClick={() => {
                                    setHiddenKeys(prev => {
                                        const next = new Set(prev);
                                        if (next.has(k)) next.delete(k);
                                        else next.add(k);
                                        return next;
                                    });
                                }}
                                className={`w-full flex items-center justify-center gap-1.5 transition-all px-2.5 py-1.5 rounded-lg border text-center ${active ? 'border-transparent bg-slate-50 opacity-100 hover:bg-slate-100 text-slate-700 shadow-sm' : 'border-dashed border-slate-200 bg-transparent opacity-40 grayscale hover:opacity-60 text-slate-500'}`}
                            >
                                <span
                                    className="font-bold truncate inline-block pb-0.5"
                                    style={{ borderBottom: `2px solid ${color}` }}
                                >
                                    {formatBrandLabel(k)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function TimelineByRtoCard({ filters, apiPath }: { filters: any; apiPath: string }) {
    const { stateCode, fromMonth, toMonth } = filters;
    const globalLastSyncAt = filters?.lastDbUpdateAt || null;
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [lineKeys, setLineKeys] = useState<string[]>([]);
    const [localPeriod, setLocalPeriod] = useState('this_month');
    const [segment, setSegment] = useState<'ALL' | 'ICE' | 'EV'>('ALL');
    const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

    const renderRtoPointDot = (lineKey: string, color: string) => {
        const RtoPointDot = (props: any): React.ReactNode => {
            const row = props?.payload || {};
            const units = Number(row?.[lineKey] || 0);
            if (!Number.isFinite(units) || units <= 0) return null;
            const x = Number(props?.cx || 0);
            const y = Number(props?.cy || 0);
            return (
                <g>
                    <circle cx={x} cy={y} r={3} fill={color} />
                    <text
                        x={x}
                        y={y - 8}
                        fill="#64748b"
                        fontSize={10}
                        fontWeight={800}
                        dominantBaseline="auto"
                        textAnchor="middle"
                    >
                        {fmtCompactUnits(units)}
                    </text>
                </g>
            );
        };
        RtoPointDot.displayName = `RtoPointDot_${lineKey}`;
        return RtoPointDot;
    };

    const renderTimelineTooltip = ({ active, payload, label }: any) => {
        if (!active || !Array.isArray(payload) || payload.length === 0) return null;
        const entries = payload
            .map((p: any) => ({
                name: String(p?.name || ''),
                value: Number(p?.value || 0),
                color: String(p?.color || '#94a3b8'),
            }))
            .filter((p: any) => Number.isFinite(p.value) && p.value > 0)
            .sort((a: any, b: any) => b.value - a.value);
        if (!entries.length) return null;

        const total = entries.reduce((sum: number, e: any) => sum + e.value, 0);
        return (
            <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur px-3 py-2 shadow-lg min-w-[220px]">
                <p className="text-[11px] font-black text-slate-800 mb-1">{String(label || '')}</p>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {entries.map((e: any) => {
                        const pct = total > 0 ? (e.value * 100) / total : 0;
                        return (
                            <div key={e.name} className="flex items-center justify-between gap-3 text-[11px]">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: e.color }}
                                    />
                                    <span className="font-bold text-slate-700 truncate">{e.name}</span>
                                </div>
                                <span className="font-black text-slate-900 whitespace-nowrap">
                                    {fmtIN(e.value)} ({pct.toFixed(1)}%)
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-1 text-[10px] font-semibold text-slate-500">
                    {formatLastSyncForTooltip(globalLastSyncAt)}
                </div>
            </div>
        );
    };

    useEffect(() => {
        let alive = true;
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                let activeFrom = fromMonth;
                let activeTo = toMonth;
                if (localPeriod !== 'inherit') {
                    const d = new Date();
                    const fmtDate = (dt: Date) =>
                        `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
                    if (localPeriod === 'all_time') {
                        activeFrom = '2015-01-01';
                        activeTo = fmtDate(new Date());
                    } else if (localPeriod === 'this_month') {
                        activeFrom = fmtDate(new Date(d.getFullYear(), d.getMonth(), 1));
                        activeTo = fmtDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
                    } else if (localPeriod === 'last_month') {
                        activeFrom = fmtDate(new Date(d.getFullYear(), d.getMonth() - 1, 1));
                        activeTo = fmtDate(new Date(d.getFullYear(), d.getMonth(), 0));
                    } else if (localPeriod === 'this_year') {
                        activeFrom = fmtDate(new Date(d.getFullYear(), 0, 1));
                        activeTo = fmtDate(new Date(d.getFullYear(), 11, 31));
                    } else if (localPeriod === 'last_year') {
                        activeFrom = fmtDate(new Date(d.getFullYear() - 1, 0, 1));
                        activeTo = fmtDate(new Date(d.getFullYear() - 1, 11, 31));
                    }
                }

                const p = new URLSearchParams({
                    state_code: stateCode || 'MH',
                    from_month: activeFrom,
                    to_month: activeTo,
                    grain: 'month',
                });
                p.set('segment', segment);
                const payload = await fetch(`${apiPath}?${p}&_t=${Date.now()}`).then(r => r.json());
                if (!alive) return;

                const rows: any[] = payload.timeline_rto || [];
                const totals = new Map<string, number>();
                const nameByCode = new Map<string, string>();
                for (const r of rows) {
                    const code = String(r.rto_code || '').toUpperCase();
                    totals.set(code, (totals.get(code) || 0) + Number(r.units || 0));
                    nameByCode.set(code, String(r.rto_name || code));
                }
                const sortedRtos = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
                const allCodesByVol = sortedRtos.map(([k]) => k);

                const allCodesSorted = [...allCodesByVol].sort((a, b) => compareRtoCodeNumeric(a, b));
                const allLabelsSorted = allCodesSorted.map(
                    code => `${code} (${trunc(nameByCode.get(code) || code, 12)})`
                );

                const periodMap = new Map<string, any>();
                for (const r of rows) {
                    const code = String(r.rto_code || '').toUpperCase();
                    const period = String(r.period_start || '');

                    let pLabel = formatPeriodShort(period);
                    let activeGrain = 'month';
                    if (localPeriod === 'all_time') activeGrain = 'year';
                    if (activeGrain === 'year') {
                        pLabel = period.substring(0, 4);
                    }

                    const curr = periodMap.get(period) || { period, period_label: pLabel };

                    const lineLabel = `${code} (${trunc(nameByCode.get(code) || code, 12)})`;
                    curr[lineLabel] = (curr[lineLabel] || 0) + Number(r.units || 0);
                    periodMap.set(period, curr);
                }
                const merged = Array.from(periodMap.values()).sort((a, b) =>
                    String(a.period).localeCompare(String(b.period), 'en')
                );

                const defaultRtoCodes = new Set(['MH01', 'MH02', 'MH03']);
                const top3Labels = new Set(
                    allCodesSorted
                        .filter(code => defaultRtoCodes.has(code))
                        .map(code => `${code} (${trunc(nameByCode.get(code) || code, 12)})`)
                );
                const initialHidden = new Set(allLabelsSorted.filter(l => !top3Labels.has(l)));
                setHiddenKeys(initialHidden);
                setLineKeys(allLabelsSorted);
                setChartData(merged);
            } catch (e) {
                console.error(e);
            } finally {
                if (alive) setLoading(false);
            }
        }, 350);

        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [stateCode, fromMonth, toMonth, localPeriod, segment, apiPath]);

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden group/card shadow-slate-200/50">
                <div className="p-5 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50 shadow-sm">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 mb-0.5">
                                Timeline
                            </h2>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Timeline by RTO</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center gap-2.5 bg-white/60 hover:bg-white/90 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] hover:border-[#FFD700]/50 transition-all cursor-pointer group/pill">
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${segment === 'EV' ? 'bg-emerald-50 group-hover/pill:bg-emerald-100' : segment === 'ICE' ? 'bg-orange-50 group-hover/pill:bg-orange-100' : 'bg-slate-50 group-hover/pill:bg-slate-100'}`}
                            >
                                <Zap
                                    className={`w-3.5 h-3.5 transition-colors ${segment === 'EV' ? 'text-emerald-600' : segment === 'ICE' ? 'text-orange-600' : 'text-slate-500'}`}
                                />
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-1.5 min-w-[70px] md:min-w-[88px]">
                                <select
                                    value={segment}
                                    onChange={e => setSegment(e.target.value as 'ALL' | 'ICE' | 'EV')}
                                    className="text-[11px] md:text-[12px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none w-full text-center h-full flex items-center justify-center"
                                >
                                    <option value="ALL">All</option>
                                    <option value="ICE">ICE</option>
                                    <option value="EV">EV</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-slate-400 group-hover/pill:text-slate-600 shrink-0" />
                            </div>
                        </div>
                        <div className="relative flex items-center gap-2.5 bg-white/60 hover:bg-white/90 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] hover:border-[#FFD700]/50 transition-all cursor-pointer group/pill">
                            <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover/pill:bg-[#FFD700]/10 transition-colors">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover/pill:text-[#FFD700] transition-colors" />
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-1.5 min-w-[100px] md:min-w-[140px]">
                                <select
                                    value={localPeriod}
                                    onChange={e => setLocalPeriod(e.target.value)}
                                    className="text-[11px] md:text-[12px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer appearance-none w-full text-center h-full flex items-center justify-center"
                                >
                                    <option value="this_month">This Month</option>
                                    <option value="last_month">Last Month</option>
                                    <option value="this_year">This Year</option>
                                    <option value="last_year">Last Year</option>
                                    <option value="all_time">All Year</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-slate-400 group-hover/pill:text-slate-600 shrink-0" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="relative flex flex-col h-[800px] p-4">
                    {loading && (
                        <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
                        </div>
                    )}
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 24, right: 36, left: 16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ecfeff" />
                                <XAxis dataKey="period_label" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip content={renderTimelineTooltip} />
                                {lineKeys
                                    .filter(k => !hiddenKeys.has(k))
                                    .map(k => {
                                        const i = lineKeys.indexOf(k);
                                        return (
                                            <Line
                                                key={k}
                                                type="monotone"
                                                dataKey={k}
                                                stroke={PALETTE[i % PALETTE.length]}
                                                strokeWidth={2.2}
                                                dot={renderRtoPointDot(k, PALETTE[i % PALETTE.length])}
                                                isAnimationActive={false}
                                            />
                                        );
                                    })}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/70 shadow-sm">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                                Timeline
                            </p>
                            <p className="text-sm font-black text-slate-900 tracking-tight">Select RTOs</p>
                            <p className="text-[10px] md:text-[11px] font-semibold text-slate-400 mt-0.5">
                                Select the RTOs you want to compare in the timeline chart.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 text-[10px] md:text-[11px]">
                    {lineKeys.map((k, i) => {
                        const active = !hiddenKeys.has(k);
                        const color = PALETTE[i % PALETTE.length];
                        return (
                            <button
                                key={k}
                                onClick={() => {
                                    setHiddenKeys(prev => {
                                        const next = new Set(prev);
                                        if (next.has(k)) next.delete(k);
                                        else next.add(k);
                                        return next;
                                    });
                                }}
                                className={`w-full flex items-center justify-center gap-1.5 transition-all px-2.5 py-1.5 rounded-lg border text-center ${active ? 'border-transparent bg-slate-50 opacity-100 hover:bg-slate-100 text-slate-700 shadow-sm' : 'border-dashed border-slate-200 bg-transparent opacity-40 grayscale hover:opacity-60 text-slate-500'}`}
                            >
                                <span
                                    className="font-bold truncate inline-block pb-0.5"
                                    style={{ borderBottom: `2px solid ${color}` }}
                                >
                                    {k}
                                </span>
                            </button>
                        );
                    })}
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
            case 'this_month':
                setFromMonth(fmt(new Date(d.getFullYear(), d.getMonth(), 1)));
                setToMonth(fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0)));
                break;
            case 'last_month':
                setFromMonth(fmt(new Date(d.getFullYear(), d.getMonth() - 1, 1)));
                setToMonth(fmt(new Date(d.getFullYear(), d.getMonth(), 0)));
                break;
            case 'this_year':
                setFromMonth(fmt(new Date(d.getFullYear(), 0, 1)));
                setToMonth(fmt(new Date(d.getFullYear(), 11, 31)));
                break;
            case 'last_year':
                setFromMonth(fmt(new Date(d.getFullYear() - 1, 0, 1)));
                setToMonth(fmt(new Date(d.getFullYear() - 1, 11, 31)));
                break;
            case 'all_time':
                setFromMonth('2015-01-01');
                setToMonth(fmt(d));
                break;
        }
    }, [period]);

    const [lastDbUpdateAt, setLastDbUpdateAt] = useState<string | null>(null);
    const filters = { stateCode, period, fromMonth, toMonth, lastDbUpdateAt };
    const [activeChartTab, setActiveChartTab] = useState<
        'series' | 'brand' | 'rto' | 'timeline_rto' | 'timeline_brand'
    >('series');
    const [isPdfExporting, setIsPdfExporting] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'Live' | 'Synchronizing' | 'Busy'>('Live');
    const lastRefreshed = (() => {
        if (!lastDbUpdateAt) return '---';
        const dt = new Date(lastDbUpdateAt);
        if (Number.isNaN(dt.getTime())) return '---';

        const day = dt.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' });
        const dateNum = dt.toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' });
        const month = dt.toLocaleDateString('en-IN', { month: 'long', timeZone: 'Asia/Kolkata' });
        const year = dt.toLocaleDateString('en-IN', { year: 'numeric', timeZone: 'Asia/Kolkata' });

        const time = dt.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
        });

        return `${day}, ${dateNum}, ${month}, ${year}, ${time} IST`;
    })();
    const isLiveSyncFresh = (() => {
        if (!lastDbUpdateAt) return false;
        const ts = new Date(lastDbUpdateAt).getTime();
        if (!Number.isFinite(ts)) return false;
        const ageMs = Date.now() - ts;
        return ageMs >= 0 && ageMs <= 24 * 60 * 60 * 1000;
    })();

    useEffect(() => {
        const pickStatus = () => {
            const r = Math.random();
            if (isLiveSyncFresh) {
                if (r < 0.68) return 'Live' as const;
                if (r < 0.96) return 'Synchronizing' as const;
                return 'Busy' as const;
            }
            if (r < 0.35) return 'Live' as const;
            if (r < 0.85) return 'Synchronizing' as const;
            return 'Busy' as const;
        };

        setSyncStatus(isLiveSyncFresh ? 'Live' : 'Synchronizing');
        const timer = window.setInterval(() => {
            setSyncStatus(pickStatus());
        }, 7000);
        return () => window.clearInterval(timer);
    }, [isLiveSyncFresh]);

    const statusTone =
        syncStatus === 'Live'
            ? {
                  dot: 'bg-emerald-500',
                  dotPing: 'bg-emerald-500/60',
              }
            : syncStatus === 'Synchronizing'
              ? {
                    dot: 'bg-amber-500',
                    dotPing: 'bg-amber-500/60',
                }
              : {
                    dot: 'bg-red-500',
                    dotPing: 'bg-red-500/60',
                };

    const handleDownloadInsightsPdf = async () => {
        if (!fromMonth || !toMonth || !stateCode) return;
        setIsPdfExporting(true);
        try {
            const pCurrent = new URLSearchParams({
                state_code: stateCode,
                from_month: fromMonth,
                to_month: toMonth,
                grain: 'month',
            });
            const { prevFrom, prevTo } = computePreviousRange(fromMonth, toMonth);
            const pPrev = new URLSearchParams({
                state_code: stateCode,
                from_month: prevFrom,
                to_month: prevTo,
                grain: 'month',
            });

            const [currentRes, prevRes] = await Promise.all([
                fetch(`${apiPath}?${pCurrent}`).then(r => r.json()),
                fetch(`${apiPath}?${pPrev}`).then(r => r.json()),
            ]);

            const currentBrandSeg = Array.isArray(currentRes?.brand?.share_segmented)
                ? currentRes.brand.share_segmented
                : [];
            const currentRtoSeg = Array.isArray(currentRes?.rto?.share_segmented) ? currentRes.rto.share_segmented : [];
            const prevBrandSeg = Array.isArray(prevRes?.brand?.share_segmented) ? prevRes.brand.share_segmented : [];

            const sumSeg = (rows: any[]) =>
                rows.reduce(
                    (acc, r) => {
                        acc.total += Number(r?.total_units || 0);
                        acc.ev += Number(r?.ev_units || 0);
                        acc.ice += Number(r?.ice_units || 0);
                        return acc;
                    },
                    { total: 0, ev: 0, ice: 0 }
                );

            const curAgg = sumSeg(currentBrandSeg);
            const prevAgg = sumSeg(prevBrandSeg);
            const evShare = curAgg.total > 0 ? (curAgg.ev * 100) / curAgg.total : 0;
            const iceShare = curAgg.total > 0 ? (curAgg.ice * 100) / curAgg.total : 0;
            const prevEvShare = prevAgg.total > 0 ? (prevAgg.ev * 100) / prevAgg.total : 0;
            const prevIceShare = prevAgg.total > 0 ? (prevAgg.ice * 100) / prevAgg.total : 0;

            const timelineRows: any[] = Array.isArray(currentRes?.timeline) ? currentRes.timeline : [];
            const sortedTimeline = [...timelineRows].sort((a, b) =>
                String(a.period_start || '').localeCompare(String(b.period_start || ''), 'en')
            );
            const lastPoint = sortedTimeline.at(-1);
            const prevPoint = sortedTimeline.at(-2);
            const lastUnits = Number(lastPoint?.units || 0);
            const prevUnits = Number(prevPoint?.units || 0);
            const momentum = prevUnits > 0 ? (lastUnits - prevUnits) / prevUnits : 0;
            const boundedMomentum = Math.max(-0.18, Math.min(0.22, momentum));

            const forecastMonthDate = (() => {
                const dt = toDateOnly(toMonth);
                return new Date(dt.getFullYear(), dt.getMonth() + 1, 1);
            })();
            const forecastMonthLabel = forecastMonthDate.toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
            });
            const forecastTotal = Math.max(0, Math.round(lastUnits * (1 + boundedMomentum)));
            const forecastEvShare = Math.max(0, Math.min(100, evShare + (evShare - prevEvShare) * 0.4));
            const forecastEvUnits = Math.round((forecastTotal * forecastEvShare) / 100);
            const forecastIceUnits = Math.max(0, forecastTotal - forecastEvUnits);

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const brandDisplayName = 'bookmy.bike';
            const brandPrimaryHex = '#F4B000';
            const brandLogoUrl = '';

            const parseHexToRgb = (hex: string, fallback: [number, number, number]) => {
                const cleaned = String(hex || '')
                    .replace('#', '')
                    .trim();
                if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return fallback;
                const r = Number.parseInt(cleaned.slice(0, 2), 16);
                const g = Number.parseInt(cleaned.slice(2, 4), 16);
                const b = Number.parseInt(cleaned.slice(4, 6), 16);
                if (![r, g, b].every(Number.isFinite)) return fallback;
                return [r, g, b] as [number, number, number];
            };

            const loadImageAsDataUrl = async (url: string) => {
                if (!url) return null;
                try {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    await new Promise<void>((resolve, reject) => {
                        img.onload = () => resolve();
                        img.onerror = () => reject();
                        img.src = url;
                    });
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || 1;
                    canvas.height = img.naturalHeight || 1;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return null;
                    ctx.drawImage(img, 0, 0);
                    return {
                        dataUrl: canvas.toDataURL('image/png'),
                        width: img.naturalWidth || 1,
                        height: img.naturalHeight || 1,
                    };
                } catch {
                    return null;
                }
            };

            const brandPrimary = parseHexToRgb(brandPrimaryHex, [244, 176, 0]);
            const logoAsset = await loadImageAsDataUrl(brandLogoUrl);

            const addPageHeader = (title: string, subtitle?: string) => {
                pdf.setFillColor(248, 250, 252);
                pdf.rect(0, 0, pageWidth, 26, 'F');
                pdf.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
                pdf.rect(0, 0, pageWidth, 4, 'F');
                if (logoAsset) {
                    const h = 9;
                    const w = (logoAsset.width / logoAsset.height) * h;
                    pdf.addImage(logoAsset.dataUrl, 'PNG', pageWidth - w - 14, 8, w, h);
                }
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(14);
                pdf.setTextColor(15, 23, 42);
                pdf.text(title, 14, 15);
                if (subtitle) {
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(9);
                    pdf.setTextColor(71, 85, 105);
                    pdf.text(subtitle, 14, 21);
                }
            };

            // Cover page (dossier-style branding)
            pdf.setFillColor(245, 247, 250);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            pdf.setFillColor(15, 23, 42);
            pdf.rect(0, 0, pageWidth, 88, 'F');
            pdf.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
            pdf.rect(0, 86, pageWidth, 8, 'F');

            if (logoAsset) {
                const h = 16;
                const w = (logoAsset.width / logoAsset.height) * h;
                pdf.addImage(logoAsset.dataUrl, 'PNG', 14, 14, w, h);
            }

            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(24);
            pdf.text('VAHAN INSIGHTS REPORT', 14, 44);
            pdf.setFontSize(12);
            pdf.text(`${brandDisplayName} | ${stateCode} Two-Wheeler Intelligence`, 14, 53);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10.5);
            pdf.text(`Reporting Window: ${fromMonth} to ${toMonth}`, 14, 62);
            pdf.text(`Generated on: ${formatIstDateTime(lastDbUpdateAt)} IST`, 14, 69);

            pdf.setTextColor(30, 41, 59);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(13);
            pdf.text('Report Contents', 14, 114);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10.5);
            const sections = [
                '1. KPI Summary (Current vs Previous Equivalent Period)',
                '2. Performance by Brand (EV/ICE Segregation)',
                '3. Performance by RTO (EV/ICE Segregation)',
                '4. RTO Trend Snapshot (Latest Month Comparison)',
                '5. Brand Trend Snapshot (Latest Month Comparison)',
                '6. Conclusion + Directional Forecast',
            ];
            let sy = 123;
            for (const section of sections) {
                pdf.text(`• ${section}`, 16, sy);
                sy += 8;
            }

            // Page 2: KPI narrative
            pdf.addPage();
            addPageHeader('KPI Summary', `${stateCode} | Current vs Previous Equivalent Window`);
            const kpiRows = [
                [
                    'Total Volume',
                    fmtIN(curAgg.total),
                    fmtIN(prevAgg.total),
                    `${(curAgg.total - prevAgg.total >= 0 ? '+' : '') + (prevAgg.total > 0 ? ((curAgg.total - prevAgg.total) * 100) / prevAgg.total : 0).toFixed(1)}%`,
                ],
                [
                    'EV Units',
                    fmtIN(curAgg.ev),
                    fmtIN(prevAgg.ev),
                    `${(curAgg.ev - prevAgg.ev >= 0 ? '+' : '') + (prevAgg.ev > 0 ? ((curAgg.ev - prevAgg.ev) * 100) / prevAgg.ev : 0).toFixed(1)}%`,
                ],
                [
                    'ICE Units',
                    fmtIN(curAgg.ice),
                    fmtIN(prevAgg.ice),
                    `${(curAgg.ice - prevAgg.ice >= 0 ? '+' : '') + (prevAgg.ice > 0 ? ((curAgg.ice - prevAgg.ice) * 100) / prevAgg.ice : 0).toFixed(1)}%`,
                ],
                [
                    'EV Share',
                    `${evShare.toFixed(1)}%`,
                    `${prevEvShare.toFixed(1)}%`,
                    `${(evShare - prevEvShare >= 0 ? '+' : '') + (evShare - prevEvShare).toFixed(1)} pp`,
                ],
                [
                    'ICE Share',
                    `${iceShare.toFixed(1)}%`,
                    `${prevIceShare.toFixed(1)}%`,
                    `${(iceShare - prevIceShare >= 0 ? '+' : '') + (iceShare - prevIceShare).toFixed(1)} pp`,
                ],
            ];
            autoTable(pdf, {
                startY: 32,
                head: [['Metric', 'Current', 'Previous', 'Change']],
                body: kpiRows,
                styles: { fontSize: 10 },
                headStyles: { fillColor: [15, 23, 42] },
            });

            // Page 3: Performance by Brand
            pdf.addPage();
            addPageHeader('Performance by Brand', 'Top brands with EV/ICE split');
            autoTable(pdf, {
                startY: 32,
                head: [['#', 'Brand', 'Total', 'EV', 'ICE', 'EV%', 'Share%']],
                body: currentBrandSeg.map((r: any, idx: number) => {
                    const total = Number(r.total_units || 0);
                    const ev = Number(r.ev_units || 0);
                    const ice = Number(r.ice_units || 0);
                    const evPct = total > 0 ? (ev * 100) / total : 0;
                    return [
                        String(idx + 1),
                        formatBrandLabel(String(r.brand_display || r.brand_name || '')),
                        fmtIN(total),
                        fmtIN(ev),
                        fmtIN(ice),
                        `${evPct.toFixed(1)}%`,
                        `${Number(r.share_pct || 0).toFixed(1)}%`,
                    ];
                }),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [234, 179, 8] },
            });

            // Page 4: Performance by RTO
            pdf.addPage();
            addPageHeader('Performance by RTO', 'Top RTOs with EV/ICE split');
            autoTable(pdf, {
                startY: 32,
                head: [['#', 'RTO', 'Total', 'EV', 'ICE', 'EV%', 'Share%']],
                body: currentRtoSeg.map((r: any, idx: number) => {
                    const total = Number(r.total_units || 0);
                    const ev = Number(r.ev_units || 0);
                    const ice = Number(r.ice_units || 0);
                    const evPct = total > 0 ? (ev * 100) / total : 0;
                    return [
                        String(idx + 1),
                        `${r.rto_code} - ${MMRD_RTO_NAMES[r.rto_code] || r.rto_name || r.rto_code}`,
                        fmtIN(total),
                        fmtIN(ev),
                        fmtIN(ice),
                        `${evPct.toFixed(1)}%`,
                        `${Number(r.share_pct || 0).toFixed(1)}%`,
                    ];
                }),
                styles: { fontSize: 8.8 },
                headStyles: { fillColor: [16, 185, 129] },
            });

            // Page 5: RTO trend
            pdf.addPage();
            addPageHeader('RTO Trend Snapshot', 'Latest month vs previous month');
            const rtoTrendRows: any[] = Array.isArray(currentRes?.timeline_rto) ? currentRes.timeline_rto : [];
            const periods = Array.from(new Set(rtoTrendRows.map((r: any) => String(r.period_start || '')))).sort();
            const latestPeriod = periods.at(-1) || '';
            const previousPeriod = periods.at(-2) || '';
            const rtoNow = new Map<string, number>();
            const rtoPrev = new Map<string, number>();
            for (const row of rtoTrendRows) {
                const code = String(row.rto_code || '');
                const units = Number(row.units || 0);
                if (String(row.period_start || '') === latestPeriod) rtoNow.set(code, (rtoNow.get(code) || 0) + units);
                if (String(row.period_start || '') === previousPeriod)
                    rtoPrev.set(code, (rtoPrev.get(code) || 0) + units);
            }
            const rtoRows = Array.from(rtoNow.entries())
                .map(([code, nowVal]) => {
                    const prevVal = rtoPrev.get(code) || 0;
                    const growth = prevVal > 0 ? ((nowVal - prevVal) * 100) / prevVal : 0;
                    return { code, nowVal, prevVal, growth };
                })
                .sort((a, b) => b.nowVal - a.nowVal)
                .map(r => [
                    r.code,
                    fmtIN(r.nowVal),
                    fmtIN(r.prevVal),
                    `${r.growth >= 0 ? '+' : ''}${r.growth.toFixed(1)}%`,
                ]);
            autoTable(pdf, {
                startY: 32,
                head: [
                    [
                        'RTO',
                        `Units (${formatMonthYear(latestPeriod)})`,
                        `Units (${formatMonthYear(previousPeriod)})`,
                        'MoM Change',
                    ],
                ],
                body: rtoRows,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [59, 130, 246] },
            });

            // Page 6: Brand trend
            pdf.addPage();
            addPageHeader('Brand Trend Snapshot', 'Latest month vs previous month');
            const brandTrendRows: any[] = Array.isArray(currentRes?.brand?.trend) ? currentRes.brand.trend : [];
            const brandPeriods = Array.from(
                new Set(brandTrendRows.map((r: any) => String(r.period_start || '')))
            ).sort();
            const bLatest = brandPeriods.at(-1) || '';
            const bPrev = brandPeriods.at(-2) || '';
            const bNow = new Map<string, number>();
            const bPast = new Map<string, number>();
            for (const row of brandTrendRows) {
                const key = formatBrandLabel(String(row.brand_display || row.brand_name || ''));
                const units = Number(row.units || 0);
                if (String(row.period_start || '') === bLatest) bNow.set(key, (bNow.get(key) || 0) + units);
                if (String(row.period_start || '') === bPrev) bPast.set(key, (bPast.get(key) || 0) + units);
            }
            const brandRows = Array.from(bNow.entries())
                .map(([brand, nowVal]) => {
                    const prevVal = bPast.get(brand) || 0;
                    const growth = prevVal > 0 ? ((nowVal - prevVal) * 100) / prevVal : 0;
                    return { brand, nowVal, prevVal, growth };
                })
                .sort((a, b) => b.nowVal - a.nowVal)
                .map(r => [
                    r.brand,
                    fmtIN(r.nowVal),
                    fmtIN(r.prevVal),
                    `${r.growth >= 0 ? '+' : ''}${r.growth.toFixed(1)}%`,
                ]);
            autoTable(pdf, {
                startY: 32,
                head: [
                    ['Brand', `Units (${formatMonthYear(bLatest)})`, `Units (${formatMonthYear(bPrev)})`, 'MoM Change'],
                ],
                body: brandRows,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [245, 158, 11] },
            });

            // Page 7: Conclusion + forecast
            pdf.addPage();
            addPageHeader('Conclusion & Forecast', `Directional projection for ${forecastMonthLabel}`);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            pdf.setTextColor(15, 23, 42);
            pdf.text('Key conclusions', 14, 38);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            const lines = [
                `1. Current total volume stands at ${fmtIN(curAgg.total)} units, EV share at ${evShare.toFixed(1)}% and ICE share at ${iceShare.toFixed(1)}%.`,
                `2. Vs previous equivalent window, EV share moved ${evShare - prevEvShare >= 0 ? 'up' : 'down'} by ${Math.abs(evShare - prevEvShare).toFixed(1)} percentage points.`,
                `3. Momentum check (latest monthly point) implies ${boundedMomentum >= 0 ? 'positive' : 'negative'} short-term demand drift.`,
                `4. Report sync timestamp: ${formatIstDateTime(lastDbUpdateAt)} IST.`,
            ];
            let y = 46;
            for (const line of lines) {
                const wrapped = pdf.splitTextToSize(line, pageWidth - 28);
                pdf.text(wrapped, 14, y);
                y += wrapped.length * 6 + 2;
            }
            y += 2;
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Forecast for ${forecastMonthLabel}`, 14, y);
            y += 8;
            pdf.setFont('helvetica', 'normal');
            const fLines = [
                `Projected Total Volume: ${fmtIN(forecastTotal)} units`,
                `Projected EV: ${fmtIN(forecastEvUnits)} units (${forecastEvShare.toFixed(1)}%)`,
                `Projected ICE: ${fmtIN(forecastIceUnits)} units (${(100 - forecastEvShare).toFixed(1)}%)`,
                'Method: short-window momentum + EV share drift heuristic (directional, not audited forecast).',
            ];
            for (const line of fLines) {
                pdf.text(line, 14, y);
                y += 7;
            }

            // Final branded closing page (dossier-style ending)
            pdf.addPage();
            pdf.setFillColor(15, 23, 42);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            pdf.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
            pdf.rect(0, pageHeight - 18, pageWidth, 18, 'F');
            if (logoAsset) {
                const h = 18;
                const w = (logoAsset.width / logoAsset.height) * h;
                pdf.addImage(logoAsset.dataUrl, 'PNG', 14, 20, w, h);
            }
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(24);
            pdf.text('Thank You', 14, 72);
            pdf.setFontSize(14);
            pdf.text('for reading this market intelligence report.', 14, 84);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11);
            pdf.text(
                'This report is prepared for strategic storytelling across LinkedIn, blogs, and social media.',
                14,
                102
            );
            pdf.text('Use insights with directional caution. Forecast is indicative and non-audited.', 14, 110);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            pdf.text(brandDisplayName, 14, pageHeight - 7);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Powered by bookmy.bike', pageWidth - 14, pageHeight - 7, { align: 'right' });

            const safeState = String(stateCode || 'MH');
            const fileName = `bookmybike_vahan_${safeState}_${fromMonth}_to_${toMonth}.pdf`;
            pdf.save(fileName);
        } catch (err) {
            console.error('Vahan PDF export failed:', err);
        } finally {
            setIsPdfExporting(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#f8fafc]">
            {/* Cinematic Background Mesh */}
            <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#FFD700]/20 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-[0%] right-[-10%] w-[50vw] h-[50vw] bg-orange-100/30 rounded-full blur-[140px]" />
                <div className="absolute top-[30%] right-[5%] w-[40vw] h-[40vw] bg-emerald-50/40 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute inset-0 opacity-[0.015] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
            </div>

            <div className="page-container flex flex-col gap-6 pb-20 pt-16">
                <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-2">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            {/* Tricolour Signature */}
                            <div className="w-1.5 h-12 rounded-full bg-gradient-to-b from-[#FF9933] via-[#FFFFFF] to-[#138808] shadow-[0_4px_12px_rgba(0,0,0,0.1)] shrink-0" />
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-[-0.04em]">
                                Vahan Dashboard
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-10">
                        {/* Region Island - Floating */}
                        <div className="flex items-center px-4 py-2 group/state relative cursor-pointer hover:bg-white/40 rounded-3xl transition-all duration-500">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100/50 transition-all duration-500 group-hover/state:scale-105 group-hover/state:rotate-3">
                                <MapPin className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <div className="flex flex-col ml-4">
                                <select
                                    value={stateCode}
                                    onChange={e => {
                                        setStateCode(e.target.value);
                                    }}
                                    className="bg-transparent text-lg font-black text-slate-900 border-none p-0 focus:ring-0 cursor-pointer appearance-none leading-none"
                                >
                                    <option value="MH">Maharashtra</option>
                                    <option value="GUJ">Gujarat</option>
                                    <option value="KA">Karnataka</option>
                                </select>
                            </div>
                            <ChevronDown className="w-5 h-5 text-slate-400 ml-3 group-hover/state:translate-y-0.5 transition-transform" />
                        </div>

                        {/* Timeline Island - Floating */}
                        <div className="flex items-center px-4 py-2 group/timeline cursor-pointer hover:bg-white/40 rounded-3xl transition-all duration-500">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50 transition-all duration-500 group-hover/timeline:scale-105 group-hover/timeline:-rotate-3">
                                <Calendar className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <div className="flex flex-col ml-4">
                                <select
                                    value={period}
                                    onChange={e => setPeriod(e.target.value)}
                                    className="bg-transparent text-lg font-black text-slate-800 tracking-tight border-none p-0 focus:ring-0 cursor-pointer appearance-none leading-none"
                                >
                                    <option value="this_month">This Month</option>
                                    <option value="last_month">Last Month</option>
                                    <option value="this_year">This Year</option>
                                    <option value="last_year">Last Year</option>
                                    <option value="all_time">All Year</option>
                                </select>
                            </div>
                            <ChevronDown className="w-5 h-5 text-slate-400 ml-3 group-hover/timeline:translate-y-0.5 transition-transform" />
                        </div>
                    </div>
                </header>

                {/* KPI Row */}
                <KpiStatsRow filters={filters} apiPath={apiPath} onLastDataUpdate={setLastDbUpdateAt} />

                {/* Chart Tabs */}
                <div className="w-full">
                    <div className="relative bg-white/40 backdrop-blur-3xl border border-white/60 p-2 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] flex overflow-x-auto no-scrollbar gap-2 items-center">
                        {[
                            { id: 'series', label: 'Running Series', icon: TrendingUp },
                            { id: 'brand', label: 'Brands', icon: Award },
                            { id: 'rto', label: 'RTOs', icon: MapPin },
                            { id: 'timeline_rto', label: 'RTO Trends', icon: Activity },
                            { id: 'timeline_brand', label: 'Brand Trends', icon: Zap },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveChartTab(tab.id as any)}
                                className={`flex-1 min-w-max flex items-center justify-center gap-4 px-10 py-5 rounded-[1.8rem] text-base font-black transition-all duration-700 whitespace-nowrap relative group/tab overflow-hidden ${
                                    activeChartTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                {activeChartTab === tab.id && (
                                    <div className="absolute inset-0 bg-[#FFD700] shadow-[0_12px_32px_-8px_rgba(255,215,0,0.5)] transition-all duration-700">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] animate-[shimmer_2.5s_infinite]" />
                                    </div>
                                )}
                                {activeChartTab !== tab.id && (
                                    <div className="absolute inset-0 bg-white/80 opacity-0 group-hover/tab:opacity-100 transition-opacity duration-500" />
                                )}
                                <tab.icon
                                    className={`w-5 h-5 relative z-10 transition-transform duration-500 ${
                                        activeChartTab === tab.id
                                            ? 'text-slate-900 scale-110'
                                            : 'text-slate-400 group-hover/tab:text-slate-600'
                                    }`}
                                />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Charts */}
                <div className="flex flex-col gap-10 w-full">
                    {activeChartTab === 'brand' && <BrandChartCard filters={filters} apiPath={apiPath} />}
                    {activeChartTab === 'rto' && <RtoChartCard filters={filters} apiPath={apiPath} />}
                    {activeChartTab === 'series' && <RunningSeriesStatusCard filters={filters} apiPath={apiPath} />}
                    {activeChartTab === 'timeline_rto' && <TimelineByRtoCard filters={filters} apiPath={apiPath} />}
                    {activeChartTab === 'timeline_brand' && <TimelineByBrandCard filters={filters} apiPath={apiPath} />}
                </div>
            </div>
        </div>
    );
}
