import type { ProductVariant } from '@/types/productMaster';

export interface SpecRow {
    category: string;
    label: string;
    values: (string | null)[];
    isDifferent: boolean;
}

export interface SpecCategory {
    name: string;
    specs: SpecRow[];
}

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
    stroke: 'Engine Stroke',
    valves: 'No. of Valves',
    cylinders: 'Cylinders',
    valvetrain: 'Valve Train',
    induction: 'Fuel System',
    type_detail: 'Engine Details',
    segment: 'Vehicle Segment',
    tripmeter: 'Tripmeter',
    killSwitch: 'Kill Switch',
    killswitch: 'Kill Switch',

    // ── Brakes ──────────────────────────────────────────────────────
    'brakes.front': 'Front Brake',
    'brakes.rear': 'Rear Brake',
    'brakes.abs': 'Braking System',
    'brakes.type': 'Brake Type',
    'brakes.cbs': 'CBS Braking',

    // ── Tyres ────────────────────────────────────────────────────────
    'tyres.front': 'Front Tyre',
    'tyres.rear': 'Rear Tyre',
    'tyres.type': 'Tyre Type',
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
    years: 'Warranty (Years)',
    distance: 'Warranty (km)',

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

    front: 'Front',
    rear: 'Rear',
};

export function labelFromKey(key: string): string {
    if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
    const last = key.split('.').pop() || key;
    if (LABEL_OVERRIDES[last]) return LABEL_OVERRIDES[last];
    return last.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
}

export function categoryFromKey(key: string): string {
    const first = key.split('.')[0] || key;
    const cat = first.charAt(0).toUpperCase() + first.slice(1);
    const valid = [
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
    return valid.includes(cat) ? cat : 'Other';
}

// ─── Value Validation & Placeholders ─────────────────────────────

export function isValuableSpec(val: string | null | undefined): boolean {
    if (val === null || val === undefined) return false;
    const s = String(val).trim().toLowerCase();
    if (!s || s === '' || s === '—') return false;

    const PLACEHOLDERS = new Set([
        'na',
        'n/a',
        '-',
        'null',
        'undefined',
        'tbd',
        'coming soon',
        'none',
        'false',
        'no',
        'not available',
        'no available info',
    ]);
    return !PLACEHOLDERS.has(s);
}

// ─── Metric Normalization ──────────────────────────────────────────

export function normalizePower(val: string): string {
    const s = val.trim();
    if (!s || s === '—') return s;
    if (s.includes(' / ')) return s; // Protect

    const valueMatch = s.match(/([\d,.]+)\s*(kW|PS|bhp)/i);
    if (!valueMatch) return s;

    const v = parseFloat(valueMatch[1].replace(/,/g, ''));
    const unit = valueMatch[2].toLowerCase();

    let rest = '';
    const rpmMatch = s.match(/(@[\s\S]*)$/i);
    if (rpmMatch) rest = rpmMatch[1].trim();

    if (isNaN(v)) return s;

    let kw: number;
    if (unit === 'kw') kw = v;
    else if (unit === 'ps') kw = v / 1.35962;
    else kw = v / 1.34102;

    const ps = kw * 1.35962;
    const bhp = kw * 1.34102;

    const f = (n: number) =>
        n.toLocaleString('en-IN', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2,
        });

    return `${f(ps)} PS / ${f(kw)} kW / ${f(bhp)} bhp${rest ? ` ${rest}` : ''}`;
}

export function decomposeModes(val: string | null): { mode: string; value: string; originalIdx: number }[] {
    if (!val) return [];
    const s = val.trim();

    if (s.includes(' / ') && !s.includes('PS /')) {
        const parts = s.split(' / ');
        return parts.map((part, idx) => {
            const modeMatch = part.match(/\(([^)]+)\)/);
            let mode = modeMatch ? modeMatch[1] : 'Standard';
            return {
                mode,
                value: part.replace(/\([^)]+\)/, '').trim(),
                originalIdx: idx,
            };
        });
    }

    return [{ mode: 'Standard', value: s, originalIdx: 0 }];
}

export function normalizeTorque(val: string): string {
    const s = val.trim();
    if (!s || s === '—') return s;
    if (s.includes(' Nm') && s.includes('@')) return s;

    if (s.includes(' / ')) {
        return s
            .split(' / ')
            .map(part => normalizeTorque(part))
            .join(' / ');
    }
    return s
        .replace(/^([\d,.]+)\s*nm/i, '$1 Nm')
        .replace(/@\s*([\d,.]+)/i, '@ $1')
        .replace(/(\d+)\s*rpm/i, '$1 rpm');
}

// ─── Value Formatting ─────────────────────────────────────────────

export function formatSpecValue(val: string | null, label?: string): string {
    if (!val) return '—';
    const l = label?.toLowerCase() || '';
    const isSplitRow = (l.includes('power') || l.includes('torque')) && l.includes('(');

    if (l.includes('power') && !isSplitRow) return normalizePower(val);
    if (l.includes('torque') && !isSplitRow) return normalizeTorque(val);

    const lower = val.trim().toLowerCase();
    if (lower === 'true' || lower === 'yes') return 'Yes';
    if (lower === 'false' || lower === 'no') return 'No';

    const VALUE_OVERRIDES: Record<string, string> = {
        KICK_AND_ELECTRIC: 'Electric & Kick',
        ELECTRIC_AND_KICK: 'Electric & Kick',
        KICK: 'Kick Only',
        ELECTRIC: 'Electric Only',
        SELF_START: 'Electric Only',
        'Self Start': 'Electric Only',
        'Electric Start': 'Electric Only',
        'Kick Start': 'Kick Only',
        ANALOG: 'Analog',
        DIGITAL: 'Digital',
        DIGITAL_TFT: 'Digital TFT',
        LCD_TFT: 'LCD TFT',
        SEMI_DIGITAL: 'Semi-Digital',
        SEMI_DIGITAL_ANALOG: 'Semi-Digital & Analog',
        TELESCOPIC: 'Telescopic',
    };

    let display = val.trim();
    const BRAKING_LABELS: Record<string, string> = {
        ABS: 'Single Channel',
        DUAL_ABS: 'Dual Channel',
        CBS: 'Combined (CBS)',
        SBT: 'Standard',
    };
    if (BRAKING_LABELS[display.toUpperCase()]) return BRAKING_LABELS[display.toUpperCase()];

    if (VALUE_OVERRIDES[display]) return VALUE_OVERRIDES[display];
    return display;
}

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

export function extractRPM(val: string): { rpm: string; residue: string } {
    const rpmMatch = val.match(/(@\s*[\d,.]+\s*(?:rpm)?)/i);
    if (rpmMatch) {
        let rpm = rpmMatch[1].trim();
        if (!rpm.toLowerCase().includes('rpm')) rpm += ' rpm';
        const residue = val.replace(rpmMatch[0], '').replace(/\s+/g, ' ').trim();
        return { rpm, residue };
    }
    return { rpm: '', residue: val };
}

export function extractPowerUnitValue(val: string, requestedUnit: string): string {
    if (!val || !val.includes('/')) return val;
    const { rpm, residue } = extractRPM(val);
    const parts = residue.split('/').map(p => p.trim());
    const matchedPart = parts.find(p => p.toLowerCase().includes(requestedUnit.toLowerCase()));
    if (!matchedPart) return val;
    return `${matchedPart.trim()}${rpm ? ` ${rpm}` : ''}`;
}

export function explodeEngineType(raw: string): Record<string, string> {
    const parts = raw.split(',').map(p => p.trim());
    const result: Record<string, string> = {};
    parts.forEach(p => {
        const lp = p.toLowerCase();
        if (lp.includes('stroke')) result['engine.stroke'] = p;
        else if (lp.includes('cylinder')) result['engine.cylinders'] = p;
        else if (lp.includes('cooled')) result['engine.cooling'] = p;
    });
    return result;
}

export function extractNumeric(val: string): number | null {
    const match = val.match(/[\d,.]+/);
    if (!match) return null;
    const num = parseFloat(match[0].replace(/,/g, ''));
    return isNaN(num) ? null : num;
}

// ─── Best Value Detection ─────────────────────────────────────────

const LOWER_IS_BETTER = new Set(['kerbweight', 'weight', 'chargingtime']);
const HIGHER_IS_BETTER = new Set(['mileage', 'range', 'maxpower', 'maxtorque']);

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
    return bestIdx;
}

// ─── Categories & Ordering ─────────────────────────────────────────

export const CATEGORY_ORDER = [
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

export const SPEC_PRIORITY: Record<string, number> = {
    'max power': 1,
    'max torque': 2,
    displacement: 3,
    mileage: 4,
    range: 1,
    'charging time': 2,
    'seat height': 1,
    'ground clearance': 2,
    'kerb weight': 3,
};

// ─── Core Compute Functions ───────────────────────────────────────

export function computeSpecRows(variants: ProductVariant[]): SpecRow[] {
    if (variants.length === 0) return [];
    const flatSpecs = variants.map(v =>
        normalizeFlatSpecs(flattenObject((v.specifications || {}) as Record<string, any>))
    );
    const allKeys = new Set<string>();
    flatSpecs.forEach(fs =>
        Object.keys(fs).forEach(k => {
            if (isValuableSpec(fs[k])) allKeys.add(k);
        })
    );

    const rows: SpecRow[] = [];
    for (const key of allKeys) {
        const label = labelFromKey(key);
        const isPowerOrTorque = label.toLowerCase().includes('power') || label.toLowerCase().includes('torque');
        const rawValues = flatSpecs.map(fs => fs[key] || null);
        const decomposed = rawValues.map(v => decomposeModes(v));

        if (isPowerOrTorque) {
            const isPower = label.toLowerCase().includes('power');
            const subRowsMap: Record<string, { label: string; values: (string | null)[] }> = {};
            const maxModesAcrossVariants = Math.max(...decomposed.map(d => d.length));

            decomposed.forEach((modes, variantIdx) => {
                modes.forEach(m => {
                    const isStandard = m.mode === 'Standard';
                    // If we have multiple modes and it's standard naming, use "Mode X" for all (including Mode 1)
                    let modePart = '';
                    if (!isStandard) {
                        modePart = ` (${m.mode})`;
                    } else if (maxModesAcrossVariants > 1) {
                        modePart = ` (Mode ${m.originalIdx + 1})`;
                    }

                    const normalizedFull = formatSpecValue(m.value, label);

                    if (isPower && normalizedFull.includes(' / ')) {
                        const unitMap = { PS: 'PS', Bhp: 'bhp', Kw: 'kW' };
                        Object.entries(unitMap).forEach(([labelUnit, searchUnit]) => {
                            const subLabel = `${label} (${labelUnit})${modePart}`;
                            const unitValue = extractPowerUnitValue(normalizedFull, searchUnit);
                            if (!subRowsMap[subLabel])
                                subRowsMap[subLabel] = {
                                    label: subLabel,
                                    values: new Array(variants.length).fill(null),
                                };
                            subRowsMap[subLabel].values[variantIdx] = unitValue;
                        });
                    } else {
                        const subLabel = `${label}${modePart}`;
                        if (!subRowsMap[subLabel])
                            subRowsMap[subLabel] = { label: subLabel, values: new Array(variants.length).fill(null) };
                        subRowsMap[subLabel].values[variantIdx] = normalizedFull;
                    }
                });
            });

            for (const subRow of Object.values(subRowsMap)) {
                const values = subRow.values;
                const normalized = values.map(v => (v ? normalizeForCompare(v) : ''));
                const isDifferent = !normalized.every(v => v === normalized[0]) || values.some(v => v === null);
                rows.push({ category: categoryFromKey(key), label: subRow.label, values, isDifferent });
            }
        } else {
            const allModelModes = Array.from(new Set(decomposed.flatMap(d => d.map(m => m.mode))));
            if (allModelModes.length > 1 || (allModelModes.length === 1 && allModelModes[0] !== 'Standard')) {
                for (const mode of allModelModes) {
                    const modeValues = decomposed.map(d => {
                        const match = d.find(m => m.mode === mode) || d[0];
                        return match ? match.value : null;
                    });
                    const normalized = modeValues.map(v => (v ? normalizeForCompare(v) : ''));
                    const isDifferent = !normalized.every(v => v === normalized[0]) || modeValues.some(v => v === null);
                    rows.push({
                        category: categoryFromKey(key),
                        label: `${label} (${mode})`,
                        values: modeValues.map(v => (v ? formatSpecValue(v, label) : null)),
                        isDifferent,
                    });
                }
            } else {
                const values = rawValues;
                const normalized = values.map(v => (v ? normalizeForCompare(v) : ''));
                const isDifferent = !normalized.every(v => v === normalized[0]) || values.some(v => v === null);
                rows.push({
                    category: categoryFromKey(key),
                    label,
                    values: values.map(v => (v ? formatSpecValue(v, label) : null)),
                    isDifferent,
                });
            }
        }
    }
    return rows;
}

export function computeSpecCategories(variants: ProductVariant[]): SpecCategory[] {
    const rows = computeSpecRows(variants);
    const categories: Record<string, SpecRow[]> = {};
    CATEGORY_ORDER.forEach(name => {
        categories[name] = [];
    });
    rows.forEach(row => {
        const cat = CATEGORY_ORDER.includes(row.category) ? row.category : 'Other';
        categories[cat].push(row);
    });

    return CATEGORY_ORDER.map(name => ({
        name,
        specs: categories[name].sort((a, b) => {
            const al = a.label.toLowerCase();
            const bl = b.label.toLowerCase();
            const pa = SPEC_PRIORITY[al] || 999;
            const pb = SPEC_PRIORITY[bl] || 999;
            if (pa !== pb) return pa - pb;
            return al.localeCompare(bl);
        }),
    })).filter(c => c.specs.length > 0);
}

// ─── Pricing & Unit Maps ─────────────────────────────────────────

export { EMI_FACTORS, getEmiFactor } from '@/lib/constants/pricingConstants';
import { getEmiFactor } from '@/lib/constants/pricingConstants';

export function getDisplayPrice(v: ProductVariant): number {
    return v.price?.offerPrice || v.price?.onRoad || v.price?.exShowroom || 0;
}

export function getEmi(v: ProductVariant, downpayment = 15000, tenure = 36): number {
    const loan = Math.max(0, getDisplayPrice(v) - downpayment);
    return Math.max(0, Math.round(loan * getEmiFactor(tenure)));
}

export const UNIT_MAP: Record<string, string> = {
    mileage: 'km/l',
    'seat height': 'mm',
    'ground clearance': 'mm',
    wheelbase: 'mm',
    'kerb weight': 'kg',
    'fuel capacity': 'L',
};

export const NUMERIC_BAR_SPECS = ['max power', 'max torque', 'displacement', 'mileage', 'top speed', 'kerb weight'];

export function getBarPercent(label: string, value: string): number {
    const num = extractNumeric(value);
    if (!num) return 0;
    const l = label.toLowerCase();
    if (l.includes('power')) return Math.min(100, (num / 100) * 100);
    if (l.includes('torque')) return Math.min(100, (num / 100) * 100);
    if (l.includes('displacement')) return Math.min(100, (num / 1000) * 100);
    if (l.includes('mileage')) return Math.min(100, (num / 100) * 100);
    return 50;
}
