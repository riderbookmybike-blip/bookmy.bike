/**
 * Shared spec comparison utilities for Desktop and Mobile Compare components.
 * Eliminates ~200 lines of duplicated code between DesktopCompare and MobileCompare.
 */
import type { ProductVariant } from '@/types/productMaster';

// ─── Spec Flattening ─────────────────────────────────────────────

export function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    if (!obj || typeof obj !== 'object') return result;
    for (const [key, val] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val)) {
            Object.assign(result, flattenObject(val, path));
        } else if (val !== null && val !== undefined && val !== '') {
            result[path] = String(val);
        }
    }
    return result;
}

// ─── Label Overrides ─────────────────────────────────────────────

export const LABEL_OVERRIDES: Record<string, string> = {
    // ── Generic camelCase keys (unambiguous) ────────────────────────
    mileage: 'ARAI Mileage',
    headlampType: 'Headlamp Type',
    tailLampType: 'Tail Lamp',
    startType: 'Starting Method',
    consoleType: 'Console Type',
    usbCharging: 'USB Charging',
    kerbWeight: 'Kerb Weight',
    seatHeight: 'Seat Height',
    groundClearance: 'Ground Clearance',
    fuelCapacity: 'Fuel Capacity',
    topSpeed: 'Top Speed',
    maxPower: 'Max Power',
    maxTorque: 'Max Torque',
    numValves: 'No. of Valves',
    rideModes: 'Ride Modes',
    boreStroke: 'Bore × Stroke',
    compressionRatio: 'Compression Ratio',
    overallLength: 'Overall Length',
    overallWidth: 'Overall Width',
    overallHeight: 'Overall Height',
    chassisType: 'Chassis Type',
    wheelType: 'Wheel Type',
    frontWheelSize: 'Front Wheel Size',
    rearWheelSize: 'Rear Wheel Size',
    lowFuelIndicator: 'Fuel Indicator',
    lowOilIndicator: 'Oil Indicator',
    lowBatteryIndicator: 'Battery Indicator',
    pillionSeat: 'Pillion Seat',
    pillionFootrest: 'Pillion Footrest',
    standAlarm: 'Side Stand Alert',
    passLight: 'Pass Light',
    serviceInterval: 'Service Interval',
    fuelType: 'Fuel Type',
    bodyType: 'Body Type',
    abs: 'ABS / Braking',
    cooling: 'Cooling System',
    displacement: 'Displacement (cc)',
    segment: 'Vehicle Segment',
    tripmeter: 'Tripmeter',
    killSwitch: 'Kill Switch',
    killswitch: 'Kill Switch',
    // ⚠️  'type' is intentionally omitted as a short-key fallback
    //     to avoid false matches (e.g., tyres.type → "Engine Type").
    //     All 'type' labels are handled via full-path overrides below.

    // ── Brakes ──────────────────────────────────────────────────────
    'brakes.front': 'Front Brake',
    'brakes.rear': 'Rear Brake',
    'brakes.abs': 'ABS System',
    'brakes.type': 'Brake Type',
    'brakes.cbs': 'CBS Braking',

    // ── Tyres ────────────────────────────────────────────────────────
    'tyres.front': 'Front Tyre',
    'tyres.rear': 'Rear Tyre',
    'tyres.type': 'Tyre Type', // ← was "Engine Type" bug — fixed
    'tyres.frontWheelSize': 'Front Wheel Size',
    'tyres.rearWheelSize': 'Rear Wheel Size',
    'tyres.wheelType': 'Wheel Type',

    // ── Suspension ────────────────────────────────────────────────────
    'suspension.front': 'Front Suspension',
    'suspension.rear': 'Rear Suspension',
    'suspension.type': 'Suspension Type',

    // ── Engine ───────────────────────────────────────────────────────
    'engine.type': 'Engine Type',
    'engine.displacement': 'Displacement (cc)',
    'engine.cooling': 'Cooling System',
    'engine.maxPower': 'Max Power',
    'engine.maxTorque': 'Max Torque',
    'engine.mileage': 'ARAI Mileage',
    'engine.topSpeed': 'Top Speed',
    'engine.startType': 'Starting Method',
    'engine.numValves': 'No. of Valves',
    'engine.boreStroke': 'Bore × Stroke',
    'engine.compressionRatio': 'Compression Ratio',
    'engine.cylinders': 'Cylinders',
    'engine.fuelSystem': 'Fuel System',

    // ── Transmission ──────────────────────────────────────────────────
    'transmission.type': 'Transmission Type',
    'transmission.gears': 'No. of Gears',
    'transmission.clutch': 'Clutch Type',

    // ── Dimensions ────────────────────────────────────────────────────
    'dimensions.kerbWeight': 'Kerb Weight',
    'dimensions.seatHeight': 'Seat Height',
    'dimensions.groundClearance': 'Ground Clearance',
    'dimensions.fuelCapacity': 'Fuel Capacity',
    'dimensions.wheelbase': 'Wheelbase',
    'dimensions.overallLength': 'Overall Length',
    'dimensions.overallWidth': 'Overall Width',
    'dimensions.overallHeight': 'Overall Height',
    'dimensions.chassisType': 'Chassis Type',

    // ── Warranty ──────────────────────────────────────────────────────
    'warranty.years': 'Warranty (Years)',
    'warranty.year': 'Warranty (Years)',
    'warranty.distance': 'Warranty (km)',
    'warranty.km': 'Warranty (km)',
    'warranty.period': 'Warranty Period',
    'warranty.type': 'Warranty Type',
    years: 'Warranty (Years)', // top-level fallback
    distance: 'Warranty (km)', // top-level fallback

    // ── Features ──────────────────────────────────────────────────────
    'features.bluetooth': 'Bluetooth',
    'features.usbCharging': 'USB Charging',
    'features.navigation': 'Navigation',
    'features.consoleType': 'Console Type',
    'features.headlampType': 'Headlamp Type',
    'features.tailLampType': 'Tail Lamp',
    'features.passLight': 'Pass Light',
    'features.standAlarm': 'Side Stand Alert',
    'features.pillionSeat': 'Pillion Seat',
    'features.pillionFootrest': 'Pillion Footrest',
    'features.rideModes': 'Ride Modes',
    'features.killSwitch': 'Kill Switch',
    'features.killswitch': 'Kill Switch',
    'features.tripmeter': 'Tripmeter',
    'features.serviceInterval': 'Service Interval',

    // ── Ambiguous short keys — kept only where truly unambiguous ──────
    front: 'Front',
    rear: 'Rear',
};

export function labelFromKey(key: string): string {
    // 1. Check full dotted-path first (most specific, avoids 'Front' / 'Rear' ambiguity)
    if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
    // 2. Check last segment
    const last = key.split('.').pop() || key;
    if (LABEL_OVERRIDES[last]) return LABEL_OVERRIDES[last];
    // 3. Humanize camelCase
    return last.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
}

export function categoryFromKey(key: string): string {
    const first = key.split('.')[0] || key;
    return first.replace(/^./, s => s.toUpperCase());
}

// ─── Value Formatting ─────────────────────────────────────────────

export function formatSpecValue(val: string | null): string {
    if (!val) return '—';
    const lower = val.trim().toLowerCase();
    if (lower === 'true' || lower === 'yes') return 'Yes';
    if (lower === 'false' || lower === 'no') return 'No';

    const VALUE_OVERRIDES: Record<string, string> = {
        // ── Starting Method ───────────────────────────────────────────
        KICK_AND_ELECTRIC: 'Electric & Kick',
        ELECTRIC_AND_KICK: 'Electric & Kick',
        KICK: 'Kick Only',
        ELECTRIC: 'Electric Only',
        SELF_START: 'Electric Only', // Self Start = Electric Only
        'Self Start': 'Electric Only', // DB literal value
        'Electric Start': 'Electric Only',
        'Kick Start': 'Kick Only',
        'Kick And Electric': 'Electric & Kick',
        // ── Console ───────────────────────────────────────────────────
        DIGITAL_TFT: 'Digital TFT',
        DIGITAL_LCD: 'Digital LCD',
        DIGITAL: 'Digital',
        ANALOG: 'Analog',
        // ── Brakes ────────────────────────────────────────────────────
        COMBI_BRAKE: 'Combi Brake',
        SINGLE_CHANNEL_ABS: 'Single Channel ABS',
        DUAL_CHANNEL_ABS: 'Dual Channel ABS',
        DISC_DRUM: 'Disc + Drum',
        DRUM_DRUM: 'Drum + Drum',
        DISC_DISC: 'Disc + Disc',
        SBT: 'Combi Brake',
        CBS: 'Combi Brake',
        ABS: 'ABS',
        // ── Tyres ─────────────────────────────────────────────────────
        TUBELESS: 'Tubeless',
        TUBE_TYPE: 'Tube Type',
        ALLOY: 'Alloy',
        SPOKE: 'Spoke',
        STEEL: 'Steel',
        // ── Transmission ──────────────────────────────────────────────
        CVT: 'CVT (Automatic)',
        MANUAL: 'Manual',
        // ── Cooling ───────────────────────────────────────────────────
        AIR_COOLED: 'Air Cooled',
        LIQUID_COOLED: 'Liquid Cooled',
        OIL_COOLED: 'Oil Cooled',
        // ── Suspension / Chassis ──────────────────────────────────────
        TELESCOPIC: 'Telescopic',
        UNDER_BONE: 'Under Bone',
        DIAMOND: 'Diamond',
        NONE: 'None',
    };

    let display = val.trim();

    // ── Tyre size human-readable formatter ─────────────────────────
    // Matches patterns like: 90/90-12 54J  |  90/90 - 10 - 50J  |  100/80-14
    const tyreMatch = display.match(/^(\d+)\/(\d+)\s*[-–]\s*(\d+)\s*[-–]?\s*([0-9]*[A-Z]*)?$/);
    if (tyreMatch) {
        const width = tyreMatch[1]; // e.g. 90
        const rim = tyreMatch[3]; // e.g. 12 or 10
        const code = tyreMatch[4] ? ` (${tyreMatch[4]})` : '';
        display = `${width}mm Wide · ${rim}" Rim${code}`;
        return display;
    }

    if (VALUE_OVERRIDES[display]) {
        display = VALUE_OVERRIDES[display];
    } else if (/^[A-Z][A-Z_]+$/.test(display)) {
        display = display
            .split('_')
            .map(w => w.charAt(0) + w.slice(1).toLowerCase())
            .join(' ');
    }
    return display;
}

// ─── Synonyms & Normalization ─────────────────────────────────────

export const SPEC_SYNONYMS: Record<string, string> = {
    'dimensions.curbWeight': 'dimensions.kerbWeight',
    curbWeight: 'kerbWeight',
};

export function normalizeFlatSpecs(flat: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(flat)) {
        const canonical = SPEC_SYNONYMS[key] || key;
        if (!result[canonical]) result[canonical] = val;
    }
    return result;
}

export function normalizeForCompare(val: string): string {
    let s = val.trim().replace(/\s+/g, ' ').toLowerCase();
    s = s.replace(/(\d+\.\d*?)0+(\s|$)/g, '$1$2').replace(/\.(\s|$)/g, '$1');
    return s;
}

// ─── Numeric Extraction ───────────────────────────────────────────

export function extractNumeric(val: string): number | null {
    const match = val.match(/[\d,.]+/);
    if (!match) return null;
    const num = parseFloat(match[0].replace(/,/g, ''));
    return isNaN(num) ? null : num;
}

// ─── Spec Row Types ───────────────────────────────────────────────

export type SpecRow = {
    category: string;
    label: string;
    values: (string | null)[];
    isDifferent: boolean;
};

export type SpecCategory = {
    name: string;
    specs: { label: string; key: string }[];
};

// ─── Best Value Detection ─────────────────────────────────────────

export const LOWER_IS_BETTER = new Set(['kerbweight', 'curbweight', 'weight', 'chargingtime']);

export const HIGHER_IS_BETTER = new Set([
    'mileage',
    'range',
    'rangekm',
    'fuelcapacity',
    'groundclearance',
    'maxpower',
    'maxtorque',
    'displacement',
    'topspeed',
]);

export function findBestValueIndex(row: SpecRow): number | null {
    const labelLower = row.label.toLowerCase().replace(/\s+/g, '');
    const isLowerBetter = LOWER_IS_BETTER.has(labelLower);
    const isHigherBetter = HIGHER_IS_BETTER.has(labelLower);
    if (!isLowerBetter && !isHigherBetter) return null;
    const numerics = row.values.map(v => (v ? extractNumeric(v) : null));
    const validIndices = numerics.map((n, i) => (n !== null ? i : -1)).filter(i => i >= 0);
    if (validIndices.length < 2) return null;
    let bestIdx = validIndices[0];
    for (const idx of validIndices) {
        const current = numerics[idx]!;
        const best = numerics[bestIdx]!;
        if (isLowerBetter && current < best) bestIdx = idx;
        if (isHigherBetter && current > best) bestIdx = idx;
    }
    const bestVal = numerics[bestIdx]!;
    if (validIndices.every(i => i === bestIdx || numerics[i] === bestVal)) return null;
    return bestIdx;
}

// ─── Compute Spec Rows (DesktopCompare format) ────────────────────

export function computeSpecRows(variants: ProductVariant[]): SpecRow[] {
    if (variants.length === 0) return [];
    const flatSpecs = variants.map(v => {
        const raw = flattenObject((v.specifications || {}) as Record<string, any>);
        return normalizeFlatSpecs(raw);
    });
    const extraFields = ['displacement', 'fuelType', 'bodyType', 'segment'] as const;
    for (let i = 0; i < variants.length; i++) {
        for (const field of extraFields) {
            const val = (variants[i] as any)[field];
            if (val !== null && val !== undefined && val !== '') {
                const canonical = SPEC_SYNONYMS[field] || field;
                if (!flatSpecs[i][canonical]) flatSpecs[i][canonical] = String(val);
            }
        }
    }
    const allKeys = new Set<string>();
    flatSpecs.forEach(fs => Object.keys(fs).forEach(k => allKeys.add(k)));
    const rows: SpecRow[] = [];
    for (const key of allKeys) {
        const values = flatSpecs.map(fs => fs[key] || null);
        const nonNull = values.filter((v): v is string => v !== null && v !== '');
        if (nonNull.length === 0) continue;
        const normalized = nonNull.map(normalizeForCompare);
        const allSame = normalized.every(v => v === normalized[0]);
        const isDifferent = !allSame || nonNull.length < variants.length;
        rows.push({ category: categoryFromKey(key), label: labelFromKey(key), values, isDifferent });
    }
    rows.sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));
    return rows;
}

// ─── Compute Spec Categories (MobileCompare format) ───────────────

export function computeSpecCategories(variants: ProductVariant[]): SpecCategory[] {
    const allKeys = new Set<string>();
    const vSpecs = variants.map(v => flattenObject(v.specifications || {}));
    vSpecs.forEach(sp => Object.keys(sp).forEach(k => allKeys.add(k)));

    const categories: Record<string, { label: string; key: string }[]> = {
        Engine: [],
        Transmission: [],
        Brakes: [],
        Suspension: [],
        Battery: [],
        Dimensions: [],
        Tyres: [],
        Features: [],
        Other: [],
    };

    Array.from(allKeys).forEach(key => {
        const p = key.toLowerCase();
        let cat = 'Other';
        if (
            p.includes('engine') ||
            p.includes('power') ||
            p.includes('torque') ||
            p.includes('cylinders') ||
            p.includes('valves') ||
            p.includes('stroke') ||
            p.includes('compression') ||
            p.includes('cooling') ||
            p.includes('mileage') ||
            p.includes('speed') ||
            p.includes('fuel system')
        )
            cat = 'Engine';
        else if (p.includes('gear') || p.includes('clutch') || p.includes('transmission')) cat = 'Transmission';
        else if (p.includes('brake') || p.includes('abs') || p.includes('front') || p.includes('rear')) cat = 'Brakes';
        else if (p.includes('suspension') || p.includes('fork') || p.includes('shock')) cat = 'Suspension';
        else if (p.includes('battery') || p.includes('range') || p.includes('charging') || p.includes('motor'))
            cat = 'Battery';
        else if (
            p.includes('weight') ||
            p.includes('height') ||
            p.includes('clearance') ||
            p.includes('wheelbase') ||
            p.includes('length') ||
            p.includes('width') ||
            p.includes('capacity') ||
            p.includes('chassis')
        )
            cat = 'Dimensions';
        else if (p.includes('tyre') || p.includes('wheel')) cat = 'Tyres';
        else if (
            p.includes('headlamp') ||
            p.includes('tail') ||
            p.includes('indicator') ||
            p.includes('console') ||
            p.includes('bluetooth') ||
            p.includes('usb') ||
            p.includes('navigation') ||
            p.includes('seat') ||
            p.includes('stand')
        )
            cat = 'Features';

        categories[cat].push({ label: labelFromKey(key), key });
    });

    const orderedCats = [
        'Engine',
        'Battery',
        'Transmission',
        'Brakes',
        'Suspension',
        'Tyres',
        'Dimensions',
        'Features',
        'Other',
    ];
    return orderedCats
        .map(name => ({
            name,
            specs: categories[name].sort((a, b) => a.label.localeCompare(b.label)),
        }))
        .filter(c => c.specs.length > 0);
}

// ─── Pricing Helpers ─────────────────────────────────────────────

// Re-export from centralized source
export { EMI_FACTORS, getEmiFactor } from '@/lib/constants/pricingConstants';
import { getEmiFactor } from '@/lib/constants/pricingConstants';

export function getDisplayPrice(v: ProductVariant): number {
    return v.price?.offerPrice || v.price?.onRoad || v.price?.exShowroom || 0;
}

export function getEmi(v: ProductVariant, downpayment = 15000, tenure = 36): number {
    const loan = Math.max(0, getDisplayPrice(v) - downpayment);
    return Math.max(0, Math.round(loan * getEmiFactor(tenure)));
}

// ─── Unit Maps ───────────────────────────────────────────────────

export const UNIT_MAP: Record<string, string> = {
    'arai mileage': 'km/l',
    mileage: 'km/l',
    'seat height': 'mm',
    'ground clearance': 'mm',
    wheelbase: 'mm',
    'kerb weight': 'kg',
    'fuel capacity': 'L',
    'overall length': 'mm',
    'overall width': 'mm',
    'overall height': 'mm',
};

export const NUMERIC_BAR_SPECS = new Set([
    'arai mileage',
    'mileage',
    'seat height',
    'ground clearance',
    'kerb weight',
    'fuel capacity',
    'top speed',
    'max power',
    'max torque',
    'displacement',
    'overall length',
    'overall width',
    'overall height',
    'wheelbase',
]);

export function getBarPercent(val: string | null, allValues: (string | null)[]): number | null {
    if (!val) return null;
    const num = extractNumeric(val);
    if (num === null) return null;
    const nums = allValues.map(v => (v ? extractNumeric(v) : null)).filter((n): n is number => n !== null);
    if (nums.length < 2) return null;
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    if (max === min) return 100;
    return Math.round(((num - min) / (max - min)) * 60 + 40);
}
