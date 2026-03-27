'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend,
} from 'recharts';
import {
    RefreshCcw,
    Sparkles,
    TrendingUp,
    Upload,
    BarChart2,
    PieChart as PieIcon,
    Activity,
    MapPin,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface VahanRow {
    year: number;
    stateCode: string;
    axis: 'RTO' | 'MAKER';
    rowLabel: string;
    twoWheelerTotal: number;
}
interface MonthlyRow {
    rtoCode?: string;
    rtoName?: string;
    year: number;
    monthNo: number;
    monthLabel: string;
    maker: string;
    units: number;
}
interface MonthWiseTotal {
    year: number;
    monthNo: number;
    monthLabel: string;
    total: number;
}
interface VahanApiResponse {
    rows: VahanRow[];
    monthlyRows: MonthlyRow[];
    monthWiseTotals: MonthWiseTotal[];
    latestYear: number | null;
    source: 'db' | 'seed';
    yearWiseTotals: { year: number; total: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATE_NAME_MAP: Record<string, string> = {
    MH: 'Maharashtra',
    DL: 'Delhi',
    KA: 'Karnataka',
    TN: 'Tamil Nadu',
    GJ: 'Gujarat',
    RJ: 'Rajasthan',
    UP: 'Uttar Pradesh',
    WB: 'West Bengal',
    TS: 'Telangana',
    AP: 'Andhra Pradesh',
};

const FULL_RTO_MAP: Record<string, string> = {
    'MUMBAI (CENTRAL)': 'MH-01',
    'MUMBAI (WEST)': 'MH-02',
    'MUMBAI (EAST)': 'MH-03',
    THANE: 'MH-04',
    'MIRA BHAYANDAR': 'MH-04',
    KALYAN: 'MH-05',
    PEN: 'MH-06',
    SINDHUDURG: 'MH-07',
    RATNAGIRI: 'MH-08',
    'DY RTO RATNAGIRI': 'MH-08',
    KOLHAPUR: 'MH-09',
    ICHALKARANJI: 'MH-09',
    SANGLI: 'MH-10',
    SATARA: 'MH-11',
    PUNE: 'MH-12',
    SOLAPUR: 'MH-13',
    'PIMPRI CHINCHWAD': 'MH-14',
    NASHIK: 'MH-15',
    AHMEDNAGAR: 'MH-16',
    SHRIRAMPUR: 'MH-17',
    DHULE: 'MH-18',
    JALGAON: 'MH-19',
    CHALISGAON: 'MH-19',
    AURANGABAD: 'MH-20',
    'CHHATRAPATI SAMBHAJINAGAR': 'MH-20',
    JALANA: 'MH-21',
    PARBHANI: 'MH-22',
    BEED: 'MH-23',
    LATUR: 'MH-24',
    OSMANABAD: 'MH-25',
    DHARASHIV: 'MH-25',
    NANDED: 'MH-26',
    AMRAWATI: 'MH-27',
    BULDHANA: 'MH-28',
    KHAMGAON: 'MH-28',
    YAVATMAL: 'MH-29',
    AKOLA: 'MH-30',
    'NAGPUR (U)': 'MH-31',
    WARDHA: 'MH-32',
    GADCHIROLI: 'MH-33',
    CHANDRAPUR: 'MH-34',
    GONDHIA: 'MH-35',
    BHANDARA: 'MH-36',
    WASHIM: 'MH-37',
    HINGOLI: 'MH-38',
    'DY REGIONAL TRANSPORT OFFICE, HINGOLI': 'MH-38',
    NANDURBAR: 'MH-39',
    'NAGPUR (RURAL)': 'MH-40',
    MALEGAON: 'MH-41',
    BARAMATI: 'MH-42',
    'NAVI MUMBAI': 'MH-43',
    AMBEJOGAI: 'MH-44',
    AKLUJ: 'MH-45',
    PANVEL: 'MH-46',
    'MUMBAI NORTH': 'MH-47',
    VASAI: 'MH-48',
    PALGHAR: 'MH-48',
    'NAGPUR (EAST)': 'MH-49',
    KARAD: 'MH-50',
    'PEN (RAIGAD)': 'MH-06',
    BHADGAON: 'MH-19',
};

const RTO_AREA_MAP: Record<string, string> = {
    MH01: 'Mumbai South',
    MH02: 'Mumbai West',
    MH03: 'Mumbai East',
    MH04: 'Thane',
    MH05: 'Kalyan',
    MH06: 'Raigad',
    MH09: 'Nashik City',
    MH12: 'Pune City',
    MH14: 'Kolhapur',
    MH15: 'Sangli',
    MH20: 'Aurangabad',
    MH43: 'Pimpri-Chinchwad',
    MH44: 'Navi Mumbai',
    MH46: 'Nashik Rural',
    MH47: 'Pune Rural',
    MH48: 'Solapur Rural',
    MH49: 'Nagpur Rural',
};

const OEM_BRAND_MAP: Record<string, string> = {
    // ── Tier-1 Legacy OEMs ──
    'HERO MOTOCORP LTD': 'Hero',
    'HERO HONDA MOTORS  LTD': 'Hero',
    'HONDA MOTORCYCLE AND SCOOTER INDIA (P) LTD': 'Honda',
    'HONDA MOTORCYCLE & SCOOTER INDIA PVT. LTD.': 'Honda',
    'TVS MOTOR COMPANY LTD': 'TVS',
    'BAJAJ AUTO LTD': 'Bajaj',
    'SUZUKI MOTORCYCLE INDIA PVT LTD': 'Suzuki',
    'ROYAL-ENFIELD (UNIT OF EICHER LTD)': 'Royal Enfield',
    'ROYAL ENFIELD': 'Royal Enfield',
    'EICHER MOTORS LTD': 'Royal Enfield',
    'INDIA YAMAHA MOTOR PVT LTD': 'Yamaha',
    'MAHINDRA & MAHINDRA LIMITED': 'Mahindra',
    'MARUTI SUZUKI INDIA LTD': 'Maruti Suzuki',

    // ── Premium / International ──
    'BMW INDIA PVT LTD': 'BMW Motorrad',
    'INDIA KAWASAKI MOTORS PVT LTD': 'Kawasaki',
    'KTM MOTORRAD AG': 'KTM',
    'DUCATI INDIA PVT LTD': 'Ducati',
    'TRIUMPH MOTORCYCLES (INDIA) PVT LTD': 'Triumph',
    'H-D MOTOR COMPANY INDIA PVT LTD': 'Harley-Davidson',
    'HARLEY DAVIDSON (IMPORTER: HERO MOTOCORP)': 'Harley-Davidson',
    'PIAGGIO VEHICLES PVT LTD': 'Piaggio',
    'POLARIS INDIA PVT LTD': 'Indian Motorcycle',
    'VINFAST AUTO INDIA PVT LTD': 'VinFast',
    'VELOCIFERO (IMPORTER: KAWVELOCE MOTORS PVT LTD)': 'Velocifero',

    // ── Hero Group EVs ──
    'HERO ELECTRIC VEHICLES PVT. LTD': 'Hero Electric',
    'HERO ELECTRIC VEHICLE PVT LTD': 'Hero Electric',

    // ── EV Startups (India) ──
    'ATHER ENERGY LTD': 'Ather',
    'OLA ELECTRIC TECHNOLOGIES PVT LTD': 'OLA',
    'REVOLT INTELLICORP PVT LTD': 'Revolt',
    'TORK MOTORS PVT LTD': 'Tork',
    'ULTRAVIOLETTE AUTOMOTIVE PVT LTD': 'Ultraviolette',
    'RIVER MOBILITY PVT LTD': 'River',
    'OBEN ELECTRIC VEHICLES PVT LTD': 'Oben',
    'SIMPLEENERGY PVT LTD': 'Simple Energy',
    'BOUNCE ELECTRIC 1 PVT LTD': 'Bounce',
    'MATTER MOTOR WORKS PVT LTD': 'Matter',
    'CLASSIC LEGENDS PVT LTD': 'Jawa',
    'CHETAK TECHNOLOGY LIMITED': 'Chetak',
    'TI CLEAN MOBILITY PVT LTD': 'Montra',
    'KABIRA MOBILITY LLP': 'Kabira',
    'EVOLET INDIA PVT LTD': 'Evolet',
    'ODYSSE ELECTRIC VEHICLES PVT LTD': 'Odysse',
    'OKAYA EV PVT LTD': 'Okaya EV',
    'OKINAWA AUTOTECH PVT LTD': 'Okinawa',
    'WARDWIZARD INNOVATIONS & MOBILITY LIMITED': 'Joy e-bike',
    'GREAVES ELECTRIC MOBILITY PVT LTD': 'Ampere',
    'AMPERE VEHICLES PRIVATE LIMITED': 'Ampere',
    'KINETIC GREEN ENERGY & POWER SOLUTIONS LTD': 'Kinetic Green',
    'KINETIC WATTS AND VOLTS LTD': 'Kinetic W&V',
    'KLB KOMAKI PVT LTD': 'Komaki',
    'GODAWARI ELECTRIC MOTORS PVT LTD': 'Godawari',
    'BENLING INDIA ENERGY AND TECHNOLOGY PVT LTD': 'Benling',
    'BGAUSS AUTO PRIVATE LIMITED': 'BGauss',
    'NEXZU MOBILITY PVT LTD': 'Nexzu',
    'NUMEROS MOTORS PVT LTD': 'Numeros',
    'TERRA MOTORS INDIA PVT LTD': 'Terra Motors',
    'MOTOVOLT MOBILITY PVT LTD': 'Motovolt',
    'SOKUDO ELECTRIC INDIA PVT LTD': 'Sokudo',
    'ELECTRICA VEHICLES': 'Electrica',
    'JITENDRA NEW EV-TECH PVT. LTD': 'Jitendra EV',
    'LECTRIX E VEHICLES PVT LTD': 'Lectrix',
    'IVOOMII INNOVATION PVT LTD': 'iVooMi',
    'EVTRIC MOTORS PVT LTD': 'Evtric',
    'DAO EVTECH PRIVATE LIMITED': 'DAO EV',
    'TUNWAL E MOTORS PVT LTD': 'Tunwal',
    'TUNWAL E VEHICLE(I) PVT LTD': 'Tunwal',
    'BATTRE ELECTRIC MOBLITY PVT LTD': 'Battre',
    'AMO MOBILITY SOLUTIONS PVT LTD': 'AMO',
    'E-SPRINTO GREEN ENERGY PVT LTD': 'E-Sprinto',
    'BOOMA INNOVATIVE TRANSPORT SULUTIONS PVT LTD': 'Booma',
    'QUANTUMM ENERGY LTD.': 'Quantum Energy',
    'QUANTUM ENERGY LTD.': 'Quantum Energy',
    'ATUMOBILE PVT LTD': 'Atu',
    'ADRIS ELECTRIC PVT LTD': 'Adris',
    'ALTIUS EV TECH PVT LTD': 'Altius EV',
    'HAYASA E-MOBILITY (INDIA) PVT LTD': 'Hayasa',
    'HOP ELECTRIC MOBILITY PVT LTD': 'HOP Electric',
    'KYTE ENERGY PVT. LTD.': 'Kyte',
    'NDS ECO MOTORS PVT LTD': 'NDS Eco',
    'ROWWET MOBILITY PVT LTD': 'Rowwet',
    'TYST DRIVE INDIA PVT LTD': 'Tyst',
    'SUPERECO AUTOMOTIVE CO': 'Supereco',
    'THUKRAL ELECTRIC BIKES PVT LTD': 'Thukral',
    'WHITE CARBON MOTORS PVT LTD': 'White Carbon',
    'SBTEK E MOTO PVT LTD': 'SBTek',
    'SEEKA E MOTORS PVT LTD': 'Seeka',
    'SAI SAMEER POWER ELECTRIC VEHICLES PVT LTD': 'Sai Sameer',
    'GOREEN E-MOBILITY PVT LTD': 'GoReen',
    'PUR ENERGY PVT LTD': 'Pur Energy',
    'HOUSTAN INNOVATION LLP': 'Houstan',
    'FADO INDUSTRIES PVT LTD': 'Fado',
    'FSTMOTO (IMPORTER: AUTOICARE INNOVATION)': 'FSTMoto',
    'ELEGO MOTORS PVT LTD': 'Elego',
    'ELTHOR ENERGY PRIVATE LIMITED': 'Elthor',
    'ECOPLANET MOTORS PVT LTD': 'EcoPlanet',
    'ENGTIAN ELECTRIC BIKE PVT LTD': 'Engtian',
    'EXERVAL PVT LTD': 'Exerval',
    'MECPOWER MOBILITY PVT. LTD.': 'MecPower',
    'OMJAY EV LIMITED': 'OmjaY EV',
    'IVOOMI INNOVATION PVT LTD': 'iVooMi',
    'IRA EDUTECH PVT LTD': 'IRA',
    'IZANAU ELECTRIC LLP': 'Izanau',

    // ── Chinese Importers (grouped by importer brand) ──
    'KAINING (HONGKONG) (IMPORTER: COMPTECH MOTOCORP)': 'Comptech',
    'KAINING (HONGKONG) (IMPORTER: BMR EV INDUSTRIES)': 'BMR EV',
    'KAINING (HONGKONG) (IMPORTER: ENERGY AUTOMOBILE)': 'Energy Auto',
    'KAINING (HONGKONG) (IMPORTER: ENIGMA AUTOMOBILES)': 'Enigma',
    'KAINING (HONGKONG) (IMPORTER: SEEKA E MOTORS)': 'Seeka (Kaining)',
    'KAINING (HONGKONG) (IMPORTER:M/S IZANAU ELECTRIC)': 'Izanau (Kaining)',
    'WUXI SAIGE (IMPORTER: DM GREEN ENERGY)': 'DM Green',
    'WUXI SAIGE (IMPORTER: E-VISHWA ELECTOBIKE)': 'E-Vishwa',
    'WUXI SAIGE ELECTRIC (IMPORTER: DELTA AUTOCORP LLP)': 'Delta Autocorp',
    'WUXI SAIGE ELECTRIC (IMPORTER: GLORIOUS DIGITAL)': 'Glorious Digital',
    'WUXI TENGHUI (IMPORTER: FLYCON MOTORS)': 'Flycon',
    'WUXI TENGHUI (IMPORTER: HOP ELECTRIC MOBILITY)': 'HOP (Wuxi)',
    'WUXI TENGHUI (IMPORTER: SEEKA E MOTORS)': 'Seeka (Tenghui)',
    'WUXI TENGHUI (IMPORTER: CAL-ON INDUSTRIES)': 'Cal-On',
    'WUXI TOURWE (IMPORTER: GOREEN E-MOBILITY)': 'GoReen (Tourwe)',
    'WUXI DONGMA (IMPORTER: DYNAM PRECISION)': 'Dynam',
    'WUXI JIYAYI (IMPORTER: IZANAU ELECTRIC LLP)': 'Izanau EV',
    'WUXI MAYA (IMPORTER: DYNAMO ELECTRIC P. LTD.)': 'Dynamo',
    'WUXI MDKA NEW ENERGY (IMPORTER: HESTUR ENERGY)': 'Hestur',
    'WUXI NOOMA (IMPORTER: SMARTNK  ELECTRIC VEHICLE)': 'SmartNK',
    'JIANGSU AIMA (IMPORTER: QUANTUM ENERGY)': 'Aima (Quantum)',
    'JIANGSU DALONG (IMPORTER: ENGTIAN ELECTRIC)': 'Dalong (Engtian)',
    'JIANGSU DALONG (IMPORTER: KINGCHE MOBILITY)': 'Kingche',
    'JIANGSU DALONG (IMPORTER: RILOX EV PVT LTD)': 'Rilox EV',
    'JIANGSU GUOWEI (IMPORTER: REVEAL ELECTRIC)': 'Reveal Electric',
    'JIANGSU SUNHOU (IMPORTER: SABOO TOR)': 'Saboo Tor',
    'JIANGSU XINRI (IMPORTER: ECO FUEL SYSTEMS LTD)': 'Xinri (Eco Fuel)',
    'JIANGSU XINRI E-VEHICLE(IMPORTER SWIFT CUR.TECH.)': 'Xinri (Swift)',
    'JIANGSU ZHEENAIDA (IMPORTER: KLB GLOBAL)': 'KLB Global',
    'ZHEJIANG CFMOTO (IMPORTER: ADISHWAR AUTO)': 'CFMoto',
    'ZHEJIANG CHANGLING (IMPORTER: ADISHWAR AUTO)': 'Changling',
    'ZHEJIANG LUYUAN (IMPORTER: DYNAM EV TECH)': 'Luyuan',
    'ZHEJIANG MORNI (IMPORTER: ADISHWAR AUTO)': 'Morni',
    'ZHEJIANG QIANJIANG (IMPORTER: ADISHWAR AUTO)': 'Qianjiang',
    'QIANJIANG-KEEWAY (IMPORTER: ADISHWAR AUTO)': 'Keeway',
    'GUANGDONG TAYO (IMPORTER: ADISHWAR AUTO)': 'Tayo',
    'GUANGXI MEIBAO(IMPORTER: DYNAMO ELECTRIC)': 'Meibao',
    'ANCHI MOTORCYCLE  (IMPORTER: ECOTRINITY AUTOMOBILE': 'Anchi',
    'ANCHI MOTORCYCLE(IMPORTER:GREEN FUEL ALTERNATIVES)': 'Anchi',
    'JUNENG MOTORCYCLE (IMPORTER: ADMS MARKETING)': 'Juneng (ADMS)',
    'JUNENG MOTORCYCLE (IMPORTER: ISCOOT MOTERS)': 'iScoot',
    'JUNENG MOTORCYCLE (IMPORTER: JHEV MOTORS PVT LTD)': 'JHEV',
    'JUNENG MOTORCYCLE TECH. (IMPORTER: DELTA AUTOCORP)': 'Delta Autocorp',
    'NANJING VMOTO (IMPORTER: VAJRAM ELECTRIC MOBILITY)': 'Vmoto',
    'NINGO LONGJIA (IMPORTER: ADISHWAR AUTO)': 'Longjia',
    'NINGBO LONGJIA (IMPORTER: ADISHWAR AUTO)': 'Longjia',
    'HONGHUA INTER CO LTD': 'Honghua',
    'HONGKONG RUIQUE (IMPORTER: DAO EVTECH)': 'Ruique',
    'HONGKONG WANGYUAN (IMPORTER: GBB E MOBILITY)': 'GBB E Mobility',
    'HONGKONG YIXING (IMPORTER: ADMS MARKETING)': 'Yixing',
    'HSU DRAGON (IMPORTER: DARK FIGHT POWER PVT LTD)': 'Hsu Dragon',
    'KSR SOLUTION (IMPORTER: KAWVELOCE MOTORS PVT LTD)': 'KSR',
    'YANGGUAN LINGMU (IMPORTER: REMARK ELECTRIC)': 'Remark Electric',
    'YOUYAKU ELECTRIC (IMPORTER: HAYASA E-MOBILITY)': 'Hayasa EV',
    'YOUYAKU ELECTRIC (IMPORTER: HOUSTAN INNOVATION)': 'Houstan EV',
    'ZAP (HK) (IMPORTER: IZANAU ELECTRIC)': 'ZAP',
    'ZAP (IMPORTER:ELLYSIUM AUTOMOTIVES PVT LTD)': 'Ellysium',
    'CHINA HAOCHEN (IMPORTER: ADMS MARKETING)': 'Haochen',
    'SMAP VEHICLES (IMPORTER: ELEGO MOTORS)': 'Smap (Elego)',
    'QICHENG VEHICLE (IMPORTER: AUTOICARE INNOVATION)': 'Qicheng',
    'ECOBIT INTERNATIONAL(IMPORTER: JHEV MOTORS)': 'EcoBit',
    'ELECTRIC ALLIANCE(IMPORTER: ELLYSIUM AUTOMOTIVES)': 'Ellysium',
    'GOLDENLION (IMPORTER:ELLYSIUM AUTOMOTIVES PVT LTD)': 'GoldenLion',
};

const getBrand = (l: string) => OEM_BRAND_MAP[l] ?? l;

const CHART_COLORS = [
    '#FF9933',
    '#0284C7',
    '#7C3AED',
    '#059669',
    '#DC2626',
    '#D97706',
    '#0891B2',
    '#9333EA',
    '#16A34A',
    '#EA580C',
    '#1D4ED8',
    '#BE185D',
    '#047857',
    '#B45309',
    '#6D28D9',
    '#374151',
    '#64748B',
];
const DONUT_OTHERS_COLOR = '#CBD5E1';

function rtoSortKey(l: string) {
    const m = l.match(/^MH(\d+)/i);
    return m ? parseInt(m[1], 10) : 999;
}
function rtoSortLabel(l: string) {
    if (!l || l === 'ALL') return 'All RTOs';
    const raw = l.toUpperCase().trim();
    const mapCode = FULL_RTO_MAP[raw];
    if (mapCode) return mapCode; // "MH-45"
    return `zz-${raw}`; // sink to bottom if no MH code
}

function rtoLabel(l: string) {
    if (!l || l === 'ALL') return 'All RTOs';
    const raw = l.toUpperCase().trim();
    const mapCode = FULL_RTO_MAP[raw];
    if (mapCode) {
        const titleCase = raw
            .split(' ')
            .map(w => w.charAt(0) + w.slice(1).toLowerCase())
            .join(' ');
        return `${mapCode} - ${titleCase}`;
    }
    // Fallback exactly as it was
    const a = RTO_AREA_MAP[raw];
    return a ? `${l} – ${a}` : l;
}
function fmtIN(n: number): string {
    if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(2)}Cr`;
    if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(2)}L`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

// ─── Small reusable section header ────────────────────────────────────────────
function ChartSection({
    title,
    subtitle,
    badge,
    children,
}: {
    title: string;
    subtitle?: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">{title}</h2>
                    {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
                </div>
                {badge}
            </div>
            {children}
        </section>
    );
}

// Year select pill
function YearPill({
    years,
    value,
    onChange,
    allLabel = 'All Years',
}: {
    years: number[];
    value: number | 'ALL';
    onChange: (v: number | 'ALL') => void;
    allLabel?: string;
}) {
    return (
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Year</span>
            <select
                value={value}
                onChange={e => onChange(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700"
            >
                <option value="ALL">{allLabel}</option>
                {years.map(y => (
                    <option key={y} value={y}>
                        {y}
                    </option>
                ))}
            </select>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function VahanTwoWheelerPage({
    title = 'Vahan 2W Intelligence',
    showUpload = true,
    dataApiPath = '/api/aums/vahan-2w',
}: {
    title?: string;
    showUpload?: boolean;
    dataApiPath?: string;
}) {
    const [data, setData] = useState<VahanApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // ── Chart-level filter state ──
    const [growthRto, setGrowthRto] = useState<string>('ALL');
    const [rtoYear, setRtoYear] = useState<number | 'ALL'>('ALL');
    const [brandYear, setBrandYear] = useState<number | 'ALL'>('ALL');
    const [donutYear, setDonutYear] = useState<number | 'ALL'>('ALL');
    const [donutMonth, setDonutMonth] = useState<number | 'ALL'>('ALL');
    const [monthlyYear, setMonthlyYear] = useState<number | 'ALL'>('ALL');
    const [monthlyBrand, setMonthlyBrand] = useState<string>('ALL');
    const [showAllBrands, setShowAllBrands] = useState(false);
    const [showAllRtos, setShowAllRtos] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(dataApiPath, { cache: 'no-store' });
            const json = (await res.json()) as VahanApiResponse;
            setData(json);
        } catch {
            toast.error('Unable to load Vahan data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [dataApiPath]);

    // ── Base computed values ──
    const years = useMemo(() => Array.from(new Set((data?.rows || []).map(r => r.year))).sort((a, b) => a - b), [data]);

    const latestYear = data?.latestYear ?? null;

    const top13YearlyBrands = useMemo(() => {
        if (!data?.rows?.length) return [];
        const makerTotals: Record<string, number> = {};
        data.rows
            .filter(r => r.axis === 'MAKER')
            .forEach(r => {
                makerTotals[r.rowLabel] = (makerTotals[r.rowLabel] || 0) + r.twoWheelerTotal;
            });

        return Object.entries(makerTotals)
            .filter(([_, total]) => total > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 13)
            .map(([brand]) => brand);
    }, [data]);

    const globalRtoList = useMemo(() => {
        const unique = Array.from(new Set((data?.rows || []).filter(r => r.axis === 'RTO').map(r => r.rowLabel)));
        return unique.sort((a, b) => rtoSortLabel(a).localeCompare(rtoSortLabel(b)));
    }, [data]);

    const stackedYearlyData = useMemo(() => {
        if (!years.length) return [];
        return years.map(yr => {
            const yearData: any = { year: yr };
            let othersTotal = 0;
            const topCounts: Record<string, number> = {};

            if (growthRto === 'ALL') {
                const mm = (data?.rows || []).filter(r => r.year === yr && r.axis === 'MAKER');
                mm.forEach(r => {
                    if (top13YearlyBrands.includes(r.rowLabel)) {
                        topCounts[r.rowLabel] = (topCounts[r.rowLabel] || 0) + r.twoWheelerTotal;
                    } else {
                        othersTotal += r.twoWheelerTotal;
                    }
                });
            } else {
                const mm = (data?.monthlyRows || []).filter(r => r.year === yr && r.rtoCode === growthRto);
                mm.forEach(r => {
                    if (top13YearlyBrands.includes(r.maker)) {
                        topCounts[r.maker] = (topCounts[r.maker] || 0) + r.units;
                    } else {
                        othersTotal += r.units;
                    }
                });
            }

            top13YearlyBrands.forEach(b => {
                yearData[b] = topCounts[b] || 0;
            });
            yearData['Others'] = othersTotal;

            return yearData;
        });
    }, [data, years, top13YearlyBrands]);

    const statesInData = useMemo(() => Array.from(new Set((data?.rows || []).map(r => r.stateCode))), [data]);
    const stateLabel = useMemo(
        () => statesInData.map(c => `${STATE_NAME_MAP[c] || c} (${c})`).join(', ') || '—',
        [statesInData]
    );

    const resolveYear = (v: number | 'ALL') => (v === 'ALL' ? latestYear : v);

    // ── Chart 1: RTO Ranking ──
    const rtoChartData = useMemo(() => {
        const yr = resolveYear(rtoYear);
        return (data?.rows || [])
            .filter(r => r.axis === 'RTO' && r.twoWheelerTotal > 0 && (yr === null || r.year === yr))
            .sort((a, b) => rtoSortKey(a.rowLabel) - rtoSortKey(b.rowLabel));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, rtoYear, latestYear]);

    const rtoStateTotal = useMemo(() => rtoChartData.reduce((s, r) => s + r.twoWheelerTotal, 0), [rtoChartData]);

    // ── Chart 2: Brand Ranking ──
    const brandChartData = useMemo(() => {
        const yr = resolveYear(brandYear);
        return (data?.rows || [])
            .filter(r => r.axis === 'MAKER' && r.twoWheelerTotal > 0 && (yr === null || r.year === yr))
            .sort((a, b) => b.twoWheelerTotal - a.twoWheelerTotal);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, brandYear, latestYear]);

    const brandStateTotal = useMemo(() => brandChartData.reduce((s, r) => s + r.twoWheelerTotal, 0), [brandChartData]);

    // ── Chart 3: Donut — cascades Year then Month ──
    const monthsInDonutYear = useMemo(() => {
        const yr = resolveYear(donutYear);
        const rows = (data?.monthlyRows || []).filter(r => yr === null || r.year === yr);
        const monthMap = new Map<number, string>();
        rows.forEach(r => monthMap.set(r.monthNo, r.monthLabel));
        return Array.from(monthMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([no, label]) => ({ no, label }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, donutYear, latestYear]);

    const donutData = useMemo(() => {
        const yr = resolveYear(donutYear);

        // Month-level: use per-maker monthlyRows
        if (donutMonth !== 'ALL') {
            const rows = (data?.monthlyRows || []).filter(
                r => (yr === null || r.year === yr) && r.monthNo === donutMonth
            );
            const total = rows.reduce((s, r) => s + r.units, 0);
            const sorted = [...rows].sort((a, b) => b.units - a.units);
            const top = sorted.slice(0, 10);
            const otherTotal = sorted.slice(10).reduce((s, r) => s + r.units, 0);
            const result = top.map(r => ({
                name: getBrand(r.maker),
                fullName: r.maker,
                value: r.units,
                pct: total > 0 ? Number(((r.units / total) * 100).toFixed(1)) : 0,
            }));
            if (otherTotal > 0)
                result.push({
                    name: 'Others',
                    fullName: 'Others',
                    value: otherTotal,
                    pct: Number(((otherTotal / total) * 100).toFixed(1)),
                });
            return result;
        }

        // Year-level: use yearly rows
        const rows = (data?.rows || [])
            .filter(r => r.axis === 'MAKER' && r.twoWheelerTotal > 0 && (yr === null || r.year === yr))
            .sort((a, b) => b.twoWheelerTotal - a.twoWheelerTotal);
        const total = rows.reduce((s, r) => s + r.twoWheelerTotal, 0);
        const top = rows.slice(0, 10);
        const otherTotal = rows.slice(10).reduce((s, r) => s + r.twoWheelerTotal, 0);
        const result = top.map(r => ({
            name: getBrand(r.rowLabel),
            fullName: r.rowLabel,
            value: r.twoWheelerTotal,
            pct: total > 0 ? Number(((r.twoWheelerTotal / total) * 100).toFixed(1)) : 0,
        }));
        if (otherTotal > 0)
            result.push({
                name: 'Others',
                fullName: 'Others',
                value: otherTotal,
                pct: Number(((otherTotal / total) * 100).toFixed(1)),
            });
        return result;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, donutYear, donutMonth, latestYear]);

    // ── Chart 4: Monthly Market Pulse ──
    const monthlyBrands = useMemo(() => {
        const yr = resolveYear(monthlyYear);
        return Array.from(
            new Set((data?.monthlyRows || []).filter(r => yr === null || r.year === yr).map(r => r.maker))
        ).sort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, monthlyYear, latestYear]);

    const monthlyChartData = useMemo(() => {
        const yr = resolveYear(monthlyYear);
        const rows = (data?.monthlyRows || []).filter(r => yr === null || r.year === yr);

        if (monthlyBrand === 'ALL') {
            // Aggregate all brands by month
            const byMonth = new Map<string, { monthNo: number; monthLabel: string; total: number }>();
            rows.forEach(r => {
                const key = `${r.year}-${r.monthNo}`;
                const prev = byMonth.get(key) || { monthNo: r.monthNo, monthLabel: r.monthLabel, total: 0 };
                prev.total += r.units;
                byMonth.set(key, prev);
            });
            return Array.from(byMonth.values()).sort((a, b) => a.monthNo - b.monthNo);
        }
        // Single brand
        return rows
            .filter(r => r.maker === monthlyBrand)
            .sort((a, b) => a.monthNo - b.monthNo)
            .map(r => ({ monthNo: r.monthNo, monthLabel: r.monthLabel, total: r.units }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, monthlyYear, monthlyBrand, latestYear]);

    // KPI summary (fallback for annual only)
    const latestTotal = useMemo(
        () =>
            (data?.rows || [])
                .filter(r => r.year === latestYear && r.axis === 'RTO')
                .reduce((s, r) => s + r.twoWheelerTotal, 0),
        [data, latestYear]
    );
    const prevYear = latestYear ? latestYear - 1 : null;
    const prevTotal = useMemo(
        () =>
            (data?.rows || [])
                .filter(r => r.year === prevYear && r.axis === 'RTO')
                .reduce((s, r) => s + r.twoWheelerTotal, 0),
        [data, prevYear]
    );
    const yoyPct = prevTotal > 0 ? Number((((latestTotal - prevTotal) / prevTotal) * 100).toFixed(1)) : null;

    // Advanced MtoM / YTD via monthly records
    const advancedKpis = useMemo(() => {
        const rows = data?.monthlyRows || [];
        if (rows.length === 0) return null;
        const now = new Date();
        const cm = now.getMonth() + 1;
        const cy = now.getFullYear();

        const ytd = rows.filter(r => r.year === cy && r.monthNo <= cm).reduce((s, r) => s + r.units, 0);
        const lastYtd = rows.filter(r => r.year === cy - 1 && r.monthNo <= cm).reduce((s, r) => s + r.units, 0);
        const ytdD = lastYtd > 0 ? Number((((ytd - lastYtd) / lastYtd) * 100).toFixed(1)) : null;

        const mtm = rows.filter(r => r.year === cy && r.monthNo === cm).reduce((s, r) => s + r.units, 0);
        const lm = cm === 1 ? 12 : cm - 1;
        const ly = cm === 1 ? cy - 1 : cy;
        const lastMtm = rows.filter(r => r.year === ly && r.monthNo === lm).reduce((s, r) => s + r.units, 0);
        const mtmD = lastMtm > 0 ? Number((((mtm - lastMtm) / lastMtm) * 100).toFixed(1)) : null;

        return { ytd, ytdD, mtm, mtmD, cm, cy, ly, lm };
    }, [data]);

    const rtoCoverage = useMemo(
        () => new Set((data?.rows || []).filter(r => r.axis === 'RTO').map(r => r.rowLabel)).size,
        [data]
    );
    const oemCoverage = useMemo(
        () => new Set((data?.rows || []).filter(r => r.axis === 'MAKER').map(r => r.rowLabel)).size,
        [data]
    );

    // ── Time-period snapshot (uses monthly data) ──
    const [snapPeriod, setSnapPeriod] = useState<string>('THIS_MONTH');
    const [snapRto, setSnapRto] = useState<string>('ALL');

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-based
    const currentYear = now.getFullYear();
    const currentQ = Math.ceil(currentMonth / 3);

    const snapRtoList = useMemo(
        () =>
            Array.from(new Set((data?.rows || []).filter(r => r.axis === 'RTO').map(r => r.rowLabel))).sort(
                (a, b) => rtoSortKey(a) - rtoSortKey(b)
            ),
        [data]
    );

    // RTO yearly weight for distributing monthly totals to specific RTOs
    const rtoWeights = useMemo(() => {
        if (!latestYear) return new Map<string, number>();
        const rtoRows = (data?.rows || []).filter(r => r.axis === 'RTO' && r.year === latestYear);
        const total = rtoRows.reduce((s, r) => s + r.twoWheelerTotal, 0);
        const map = new Map<string, number>();
        rtoRows.forEach(r => map.set(r.rowLabel, total > 0 ? r.twoWheelerTotal / total : 0));
        return map;
    }, [data, latestYear]);

    const snapData = useMemo(() => {
        const rows = data?.monthlyRows || [];
        let current: MonthlyRow[] = [];
        let previous: MonthlyRow[] = [];

        if (snapPeriod === 'THIS_MONTH') {
            current = rows.filter(r => r.year === currentYear && r.monthNo === currentMonth);
            previous = rows.filter(
                r =>
                    (r.year === currentYear && r.monthNo === currentMonth - 1) ||
                    (r.year === currentYear - 1 && currentMonth === 1 && r.monthNo === 12)
            );
        } else if (snapPeriod === 'LAST_MONTH') {
            const lm = currentMonth === 1 ? 12 : currentMonth - 1;
            const ly = currentMonth === 1 ? currentYear - 1 : currentYear;
            current = rows.filter(r => r.year === ly && r.monthNo === lm);
            const llm = lm === 1 ? 12 : lm - 1;
            const lly = lm === 1 ? ly - 1 : ly;
            previous = rows.filter(r => r.year === lly && r.monthNo === llm);
        } else if (snapPeriod === 'THIS_QUARTER') {
            const qMonths = [currentQ * 3 - 2, currentQ * 3 - 1, currentQ * 3];
            current = rows.filter(r => r.year === currentYear && qMonths.includes(r.monthNo));
            const pq = currentQ === 1 ? 4 : currentQ - 1;
            const py = currentQ === 1 ? currentYear - 1 : currentYear;
            const pqMonths = [pq * 3 - 2, pq * 3 - 1, pq * 3];
            previous = rows.filter(r => r.year === py && pqMonths.includes(r.monthNo));
        } else if (snapPeriod === 'LAST_QUARTER') {
            const lq = currentQ === 1 ? 4 : currentQ - 1;
            const ly = currentQ === 1 ? currentYear - 1 : currentYear;
            const lqMonths = [lq * 3 - 2, lq * 3 - 1, lq * 3];
            current = rows.filter(r => r.year === ly && lqMonths.includes(r.monthNo));
            const plq = lq === 1 ? 4 : lq - 1;
            const ply = lq === 1 ? ly - 1 : ly;
            const plqMonths = [plq * 3 - 2, plq * 3 - 1, plq * 3];
            previous = rows.filter(r => r.year === ply && plqMonths.includes(r.monthNo));
        } else if (snapPeriod === 'THIS_YEAR') {
            current = rows.filter(r => r.year === currentYear);
            previous = rows.filter(r => r.year === currentYear - 1);
        } else if (snapPeriod === 'LAST_YEAR') {
            current = rows.filter(r => r.year === currentYear - 1);
            previous = rows.filter(r => r.year === currentYear - 2);
        }

        const sumRows = (arr: MonthlyRow[]) => arr.reduce((s, r) => s + r.units, 0);

        // If specific RTO selected, scale by RTO weight (approximate)
        const weight = snapRto !== 'ALL' ? (rtoWeights.get(snapRto) ?? 0) : 1;
        const currentTotal = Math.round(sumRows(current) * weight);
        const previousTotal = Math.round(sumRows(previous) * weight);
        const delta =
            previousTotal > 0 ? Number((((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1)) : null;

        return { currentTotal, previousTotal, delta, hasData: current.length > 0 };
    }, [data, snapPeriod, snapRto, currentMonth, currentYear, currentQ, rtoWeights]);

    const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/aums/vahan-2w', { method: 'POST', body: formData });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json?.error || 'Upload failed');
            } else {
                toast.success(`Uploaded ${json.axis ?? 'monthly'} ${json.year} (${json.uploadedRows} rows)`);
                await loadData();
            }
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#FF9933]" />
                    <p className="text-sm font-bold text-slate-500">Loading Vahan data…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Hero ── */}
            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div
                    className="absolute left-0 top-0 h-1 w-full"
                    style={{
                        background:
                            'linear-gradient(90deg,#FF9933 0%,#FF9933 33%,#e5e7eb 33%,#e5e7eb 66%,#138808 66%,#138808 100%)',
                    }}
                />
                <div className="p-6 pt-7 md:p-8 md:pt-9">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-2xl space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF9933]/40 bg-[#FF9933]/8 px-3 py-1.5">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF9933]" />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#c97a1a]">
                                    <Sparkles size={10} className="mr-1 inline-block" />
                                    BookMyBike · Market Intelligence
                                </span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                                    {title}
                                </h1>
                                <p className="mt-1.5 text-sm text-slate-500">
                                    State-level two-wheeler registration data from VAHAN. Drill into RTO ranking, brand
                                    share, and monthly trends.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="chip-emerald">📍 {stateLabel}</span>
                                <span className="chip-sky">{rtoCoverage} RTOs tracked</span>
                                <span className="chip-violet">{oemCoverage} brands indexed</span>
                                {years.length > 0 && (
                                    <span className="chip-amber">
                                        {years[0]}–{years[years.length - 1]} data
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-shrink-0 flex-col gap-2">
                            <button
                                onClick={loadData}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 transition hover:bg-slate-100"
                            >
                                <RefreshCcw size={14} /> Refresh
                            </button>
                            {showUpload && (
                                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FF9933] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm transition hover:brightness-105">
                                    <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload Excel'}
                                    <input
                                        type="file"
                                        accept=".xlsx"
                                        className="hidden"
                                        onChange={onUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 md:grid-cols-4">
                        {advancedKpis ? (
                            <>
                                <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-sky-500">
                                        M-to-M (Month {advancedKpis.cm})
                                    </div>
                                    <div className="mt-1 text-2xl font-black text-sky-700">
                                        {fmtIN(advancedKpis.mtm)}
                                    </div>
                                    {advancedKpis.mtmD !== null && (
                                        <div
                                            className={`mt-1 text-[11px] font-black ${advancedKpis.mtmD >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                                        >
                                            {advancedKpis.mtmD >= 0 ? '▲' : '▼'} {Math.abs(advancedKpis.mtmD)}% vs Last
                                            Month
                                        </div>
                                    )}
                                </div>
                                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                                        YTD ({advancedKpis.cy})
                                    </div>
                                    <div className="mt-1 text-2xl font-black text-amber-700">
                                        {fmtIN(advancedKpis.ytd)}
                                    </div>
                                    {advancedKpis.ytdD !== null && (
                                        <div
                                            className={`mt-1 text-[11px] font-black ${advancedKpis.ytdD >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                                        >
                                            {advancedKpis.ytdD >= 0 ? '▲' : '▼'} {Math.abs(advancedKpis.ytdD)}% vs{' '}
                                            {advancedKpis.cy - 1} YTD
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Latest Year
                                    </div>
                                    <div className="mt-1 text-2xl font-black text-slate-900">{latestYear || '—'}</div>
                                </div>
                                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                                        2W Registered ({latestYear})
                                    </div>
                                    <div className="mt-1 text-2xl font-black text-amber-700">{fmtIN(latestTotal)}</div>
                                    {yoyPct !== null && (
                                        <div
                                            className={`mt-1 text-[11px] font-black ${yoyPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                                        >
                                            {yoyPct >= 0 ? '▲' : '▼'} {Math.abs(yoyPct)}% vs {prevYear}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-sky-500">
                                RTO Coverage
                            </div>
                            <div className="mt-1 text-2xl font-black text-sky-700">{rtoCoverage} RTOs</div>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Data Source
                            </div>
                            <div className="mt-1 text-xl font-black text-emerald-700">
                                {data?.source === 'db' ? 'Live DB' : 'Seed'}
                            </div>
                            <div className="text-[10px] text-slate-400">{fmtIN(data?.rows.length || 0)} records</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Year-wise Growth (Stacked Bar) ── */}
            <ChartSection
                title="Year-wise 2W Growth"
                subtitle={
                    growthRto === 'ALL'
                        ? `Cumulative registrations across all RTOs · ${stateLabel}`
                        : `Cumulative registrations for RTO: ${rtoLabel(growthRto)}`
                }
                badge={
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">RTO</span>
                            <select
                                value={growthRto}
                                onChange={e => setGrowthRto(e.target.value)}
                                className="bg-transparent text-[11px] font-bold text-slate-700"
                            >
                                <option value="ALL">All RTOs</option>
                                {globalRtoList.map(r => (
                                    <option key={r} value={r}>
                                        {rtoLabel(r)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
                            <TrendingUp size={11} /> Growth Lens
                        </span>
                    </div>
                }
            >
                <div className="h-[460px] py-4 md:py-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stackedYearlyData} margin={{ top: 10, right: 20, bottom: 8, left: 36 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="year" tick={{ fill: '#334155', fontWeight: 700, fontSize: 13 }} />
                            <YAxis
                                width={88}
                                tickFormatter={v => fmtIN(Number(v))}
                                tick={{ fill: '#64748b', fontSize: 11 }}
                            />
                            <Tooltip
                                formatter={(value, name) => [
                                    fmtIN(Number(value || 0)),
                                    name === 'Others' ? 'Others' : getBrand(String(name)),
                                ]}
                                contentStyle={{
                                    fontSize: 12,
                                    borderRadius: 10,
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: 14 }}
                                content={() => (
                                    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-bold text-slate-600">
                                        {top13YearlyBrands.map((brand, i) => (
                                            <li key={brand} className="flex items-center gap-1.5">
                                                <span
                                                    className="block h-2.5 w-2.5 rounded-[2px]"
                                                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                                                />
                                                {getBrand(brand)}
                                            </li>
                                        ))}
                                        <li className="flex items-center gap-1.5">
                                            <span
                                                className="block h-2.5 w-2.5 rounded-[2px]"
                                                style={{ backgroundColor: DONUT_OTHERS_COLOR }}
                                            />
                                            Others
                                        </li>
                                    </ul>
                                )}
                            />
                            {top13YearlyBrands.map((brand, i) => (
                                <Bar
                                    key={brand}
                                    dataKey={brand}
                                    stackId="a"
                                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                                />
                            ))}
                            <Bar dataKey="Others" stackId="a" fill={DONUT_OTHERS_COLOR} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartSection>

            {/* ── Chart 1: RTO Market Ranking (Horizontal Bar) ── */}
            <ChartSection
                title="RTO Market Ranking"
                subtitle="2W registrations by RTO — sorted by RTO code"
                badge={
                    <div className="flex items-center gap-2">
                        <YearPill years={years} value={rtoYear} onChange={setRtoYear} />
                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
                            <MapPin size={11} /> RTO Performance
                        </span>
                    </div>
                }
            >
                {rtoChartData.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        No RTO data for selected year. Upload a yearly RTO file in AUMS.
                    </p>
                ) : (
                    <>
                        <div
                            style={{
                                height: Math.max(
                                    480,
                                    (showAllRtos ? rtoChartData.length : Math.min(rtoChartData.length, 13)) * 34
                                ),
                            }}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={showAllRtos ? rtoChartData : rtoChartData.slice(0, 13)}
                                    layout="vertical"
                                    margin={{ left: 8, right: 72 }}
                                >
                                    <defs>
                                        <linearGradient id="rtoBarGrad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#0284C7" />
                                            <stop offset="100%" stopColor="#7dd3fc" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tickFormatter={v => fmtIN(Number(v))}
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="rowLabel"
                                        width={145}
                                        tick={{ fill: '#334155', fontSize: 10 }}
                                        tickFormatter={v => rtoLabel(String(v))}
                                    />
                                    <Tooltip
                                        formatter={v => [
                                            fmtIN(Number(v || 0)),
                                            `${rtoStateTotal > 0 ? ((Number(v) / rtoStateTotal) * 100).toFixed(1) : 0}% state share`,
                                        ]}
                                        labelFormatter={l => `RTO: ${rtoLabel(String(l))}`}
                                        contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                                    />
                                    <Bar
                                        dataKey="twoWheelerTotal"
                                        fill="url(#rtoBarGrad)"
                                        radius={[0, 6, 6, 0]}
                                        barSize={20}
                                    >
                                        <LabelList
                                            dataKey="twoWheelerTotal"
                                            position="right"
                                            fill="#475569"
                                            fontSize={10}
                                            fontWeight={700}
                                            formatter={v => fmtIN(Number(v || 0))}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {rtoChartData.length > 13 && (
                            <div className="mt-3 flex justify-center">
                                <button
                                    onClick={() => setShowAllRtos(!showAllRtos)}
                                    className="rounded-full border border-slate-200 bg-white px-5 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
                                >
                                    {showAllRtos ? 'Show Top 13 Only' : `View All ${rtoChartData.length} RTOs`}
                                </button>
                            </div>
                        )}
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-xs">
                            <span className="font-bold text-sky-700">
                                {rtoChartData.length} RTOs · {rtoYear === 'ALL' ? latestYear : rtoYear}
                            </span>
                            <span className="text-sky-600">
                                State total: <strong>{fmtIN(rtoStateTotal)}</strong> 2W units
                            </span>
                        </div>
                    </>
                )}
            </ChartSection>

            {/* ── Chart 2: Brand Market Ranking (Colored Horizontal Bar) ── */}
            <ChartSection
                title="Brand Market Ranking"
                subtitle="2W registrations by OEM brand — sorted by volume"
                badge={
                    <div className="flex items-center gap-2">
                        <YearPill years={years} value={brandYear} onChange={setBrandYear} />
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-violet-700">
                            <BarChart2 size={11} /> Brand Performance
                        </span>
                    </div>
                }
            >
                {brandChartData.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        No brand data for selected year. Upload a yearly OEM file in AUMS.
                    </p>
                ) : (
                    <>
                        <div
                            style={{
                                height: Math.max(
                                    420,
                                    (showAllBrands ? brandChartData.length : Math.min(brandChartData.length, 13)) * 34
                                ),
                            }}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={showAllBrands ? brandChartData : brandChartData.slice(0, 13)}
                                    layout="vertical"
                                    margin={{ left: 8, right: 72 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tickFormatter={v => fmtIN(Number(v))}
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="rowLabel"
                                        width={150}
                                        tick={{ fill: '#334155', fontSize: 10 }}
                                        tickFormatter={v => getBrand(String(v))}
                                    />
                                    <Tooltip
                                        formatter={v => [
                                            fmtIN(Number(v || 0)),
                                            `${brandStateTotal > 0 ? ((Number(v) / brandStateTotal) * 100).toFixed(1) : 0}% market share`,
                                        ]}
                                        labelFormatter={l => getBrand(String(l))}
                                        contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                                    />
                                    <Bar dataKey="twoWheelerTotal" radius={[0, 6, 6, 0]} barSize={20}>
                                        {(showAllBrands ? brandChartData : brandChartData.slice(0, 13)).map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                        <LabelList
                                            dataKey="twoWheelerTotal"
                                            position="right"
                                            fill="#475569"
                                            fontSize={10}
                                            fontWeight={700}
                                            formatter={v => fmtIN(Number(v || 0))}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {brandChartData.length > 13 && (
                            <div className="mt-3 flex justify-center">
                                <button
                                    onClick={() => setShowAllBrands(!showAllBrands)}
                                    className="rounded-full border border-slate-200 bg-white px-5 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
                                >
                                    {showAllBrands ? 'Show Top 13 Only' : `View All ${brandChartData.length} Brands`}
                                </button>
                            </div>
                        )}
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-2.5 text-xs">
                            <span className="font-bold text-violet-700">
                                {brandChartData.length} brands · {brandYear === 'ALL' ? latestYear : brandYear}
                            </span>
                            <span className="text-violet-600">
                                State total: <strong>{fmtIN(brandStateTotal)}</strong> 2W units
                            </span>
                        </div>
                    </>
                )}
            </ChartSection>

            {/* ── Chart 3: Brand Market Share (Donut) ── */}
            <ChartSection
                title="Brand Market Share"
                subtitle="Brand-wise 2W share · State level · RTO-specific brand split not available in standard VAHAN export"
                badge={
                    <div className="flex flex-wrap items-center gap-2">
                        {/* State — fixed */}
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                State
                            </span>
                            <span className="text-sm font-bold text-slate-600">
                                {statesInData.map(c => STATE_NAME_MAP[c] || c).join(', ')}
                            </span>
                        </div>
                        <span className="text-slate-300">›</span>
                        {/* Year */}
                        <YearPill
                            years={years}
                            value={donutYear}
                            onChange={v => {
                                setDonutYear(v);
                                setDonutMonth('ALL');
                            }}
                        />
                        {/* Month — only if year selected and monthly data exists */}
                        {donutYear !== 'ALL' && monthsInDonutYear.length > 0 && (
                            <>
                                <span className="text-slate-300">›</span>
                                <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                        Month
                                    </span>
                                    <select
                                        value={donutMonth}
                                        onChange={e =>
                                            setDonutMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                                        }
                                        className="bg-transparent text-sm font-bold text-slate-700"
                                    >
                                        <option value="ALL">Full Year</option>
                                        {monthsInDonutYear.map(m => (
                                            <option key={m.no} value={m.no}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
                            <PieIcon size={11} /> Share Analysis
                        </span>
                    </div>
                }
            >
                {donutData.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        No brand data for selected year.
                    </p>
                ) : (
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                        {/* Donut */}
                        <div className="h-[340px] flex-shrink-0 lg:w-[380px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={90}
                                        outerRadius={155}
                                        paddingAngle={2}
                                        label={(props: any) => (props.pct >= 3 ? `${props.pct}%` : '')}
                                        labelLine={false}
                                    >
                                        {donutData.map((entry, i) => (
                                            <Cell
                                                key={entry.name}
                                                fill={
                                                    entry.name === 'Others'
                                                        ? DONUT_OTHERS_COLOR
                                                        : CHART_COLORS[i % (CHART_COLORS.length - 1)]
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(v, name) => [`${fmtIN(Number(v))} units`, name]}
                                        contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Legend table */}
                        <div className="flex-1">
                            <div className="space-y-1.5">
                                {donutData.map((entry, i) => (
                                    <div
                                        key={entry.name}
                                        className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                                                style={{
                                                    background:
                                                        entry.name === 'Others'
                                                            ? DONUT_OTHERS_COLOR
                                                            : CHART_COLORS[i % (CHART_COLORS.length - 1)],
                                                }}
                                            />
                                            <span className="text-sm font-semibold text-slate-700">{entry.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-black text-slate-900">
                                                {fmtIN(entry.value)}
                                            </span>
                                            <span className="w-10 text-right text-xs font-bold text-slate-400">
                                                {entry.pct}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </ChartSection>

            {/* ── Chart 4: Monthly Market Pulse (Line/Area, per-brand) ── */}
            <ChartSection
                title="Monthly Market Pulse"
                subtitle="Month-wise 2W registrations from OEM monthly reports"
                badge={
                    <div className="flex flex-wrap items-center gap-2">
                        <YearPill
                            years={years}
                            value={monthlyYear}
                            onChange={v => {
                                setMonthlyYear(v);
                                setMonthlyBrand('ALL');
                            }}
                        />
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Brand
                            </span>
                            <select
                                value={monthlyBrand}
                                onChange={e => setMonthlyBrand(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-700"
                            >
                                <option value="ALL">All Brands</option>
                                {monthlyBrands.map(b => (
                                    <option key={b} value={b}>
                                        {getBrand(b)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                            <Activity size={11} /> Monthly Pulse
                        </span>
                    </div>
                }
            >
                {monthlyChartData.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <p className="text-sm font-bold text-slate-500">No monthly data available.</p>
                        <p className="mt-1 text-xs text-slate-400">
                            Upload a month-wise OEM Excel file in AUMS to unlock this chart.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="h-[340px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={monthlyChartData}
                                    margin={{ top: 10, right: 20, bottom: 16, left: 36 }}
                                >
                                    <defs>
                                        <linearGradient id="monthlyFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.22} />
                                            <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.03} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="monthLabel"
                                        tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                                        interval={0}
                                        angle={-30}
                                        textAnchor="end"
                                        height={48}
                                    />
                                    <YAxis
                                        tickFormatter={v => fmtIN(Number(v))}
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        width={80}
                                    />
                                    <Tooltip
                                        formatter={v => [
                                            fmtIN(Number(v || 0)),
                                            monthlyBrand === 'ALL' ? 'All Brands' : getBrand(monthlyBrand),
                                        ]}
                                        contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#7C3AED"
                                        strokeWidth={3}
                                        fill="url(#monthlyFill)"
                                        dot={{ r: 4, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {monthlyBrand !== 'ALL' && (
                            <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-2.5 text-xs text-violet-700">
                                Showing <strong>{getBrand(monthlyBrand)}</strong> monthly units ·{' '}
                                {monthlyYear === 'ALL' ? latestYear : monthlyYear}
                            </div>
                        )}
                    </>
                )}
            </ChartSection>

            {/* ── RTO Time-Period Snapshot ── */}
            <ChartSection
                title="RTO Registrations Snapshot"
                subtitle="Period-wise 2W volume — select period and RTO to compare"
                badge={
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Period
                            </span>
                            <select
                                value={snapPeriod}
                                onChange={e => setSnapPeriod(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-700"
                            >
                                <option value="THIS_MONTH">This Month</option>
                                <option value="LAST_MONTH">Last Month</option>
                                <option value="THIS_QUARTER">This Quarter</option>
                                <option value="LAST_QUARTER">Last Quarter</option>
                                <option value="THIS_YEAR">This Year</option>
                                <option value="LAST_YEAR">Last Year</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-sky-500">RTO</span>
                            <select
                                value={snapRto}
                                onChange={e => setSnapRto(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-700"
                            >
                                <option value="ALL">All RTOs</option>
                                {snapRtoList.map(r => (
                                    <option key={r} value={r}>
                                        {rtoLabel(r)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                }
            >
                {!snapData.hasData ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <p className="text-sm font-bold text-slate-500">No monthly data for this period.</p>
                        <p className="mt-1 text-xs text-slate-400">
                            Upload month-wise OEM files in AUMS to populate this snapshot.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-[#FF9933]/20 bg-amber-50/60 p-5">
                            <div className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                                Current Period
                            </div>
                            <div className="mt-3 text-4xl font-black text-amber-800">
                                {fmtIN(snapData.currentTotal)}
                            </div>
                            <div className="mt-1 text-xs text-amber-600">
                                2W units · {snapRto === 'ALL' ? 'All RTOs' : rtoLabel(snapRto)}
                            </div>
                            {snapRto !== 'ALL' && (
                                <div className="mt-2 text-[10px] italic text-slate-400">
                                    ~Estimated using RTO annual share
                                </div>
                            )}
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Previous Period
                            </div>
                            <div className="mt-3 text-4xl font-black text-slate-600">
                                {fmtIN(snapData.previousTotal)}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">2W units · same duration prior</div>
                        </div>
                        <div
                            className={`rounded-2xl border p-5 ${
                                snapData.delta === null
                                    ? 'border-slate-200 bg-slate-50'
                                    : snapData.delta >= 0
                                      ? 'border-emerald-200 bg-emerald-50/60'
                                      : 'border-red-200 bg-red-50/60'
                            }`}
                        >
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                vs Previous Period
                            </div>
                            {snapData.delta === null ? (
                                <div className="mt-3 text-xl font-black text-slate-400">No prior data</div>
                            ) : (
                                <>
                                    <div
                                        className={`mt-3 text-4xl font-black ${snapData.delta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}
                                    >
                                        {snapData.delta >= 0 ? '▲' : '▼'} {Math.abs(snapData.delta)}%
                                    </div>
                                    <div
                                        className={`mt-1 text-xs font-bold ${snapData.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                                    >
                                        {snapData.delta >= 0 ? '+' : ''}
                                        {fmtIN(snapData.currentTotal - snapData.previousTotal)} units{' '}
                                        {snapData.delta >= 0 ? 'growth' : 'decline'}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
                <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-[11px] text-amber-700">
                    <strong>ℹ️ Data Note:</strong> VAHAN provides monthly-level data — daily/weekly granularity not
                    available. Per-RTO estimates use proportional annual share from yearly VAHAN data.
                </div>
            </ChartSection>
        </div>
    );
}
