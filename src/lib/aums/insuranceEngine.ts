import {
    InsuranceRule,
    InsuranceCalculationContext,
    InsuranceCalculationResult,
    InsuranceVariable
} from "@/types/insurance";
import {
    FormulaComponent,
    CalculationResultItem,
    CalculationContext,
    RegistrationType
} from "@/types/registration";

const applyRounding = (amount: number, mode?: 'NONE' | 'ROUND' | 'CEIL' | 'FLOOR'): number => {
    if (mode === 'FLOOR') return Math.floor(amount);
    if (mode === 'ROUND') return Math.round(amount);
    if (mode === 'NONE') return amount;
    return Math.ceil(amount);
};

// Map Insurance Variables to Registration Variables for reuse
const mapBasis = (insuranceBasis: string | undefined): any => {
    if (insuranceBasis === 'IDV') return 'EX_SHOWROOM'; // We'll handle this specially
    return insuranceBasis;
};

const evaluateInsuranceComponent = (
    comp: FormulaComponent,
    ctx: InsuranceCalculationContext,
    idv: number,
    accumulatedResults: CalculationResultItem[] = []
): CalculationResultItem[] => {

    // Create a pseudo CalculationContext for generic formula evaluation
    const pseudoCtx: CalculationContext = {
        exShowroom: idv, // When basis is IDV, we treat IDV as the "Price"
        engineCc: ctx.engineCc,
        fuelType: ctx.fuelType,
        regType: 'STATE_INDIVIDUAL', // Default for insurance
    };

    // Helper: Get Value from Component (handling fuel matrix)
    const getMatrixValue = (comp: FormulaComponent, defaultVal: number, fuel: string): number => {
        if (!comp.fuelMatrix) return defaultVal;
        const f = fuel.toUpperCase();
        if (f.includes('PETROL')) return comp.fuelMatrix.PETROL ?? defaultVal;
        if (f.includes('DIESEL')) return comp.fuelMatrix.DIESEL ?? defaultVal;
        if (f.includes('EV') || f.includes('ELECTRIC')) return comp.fuelMatrix.EV ?? defaultVal;
        if (f.includes('CNG')) return comp.fuelMatrix.CNG ?? defaultVal;
        return defaultVal;
    };

    const results: CalculationResultItem[] = [];
    const runningTotal = accumulatedResults.reduce((sum, item) => sum + item.amount, 0);

    if (comp.type === 'PERCENTAGE') {
        const isIdvBasis = comp.basis === 'IDV' || !comp.basis;
        const basisValue = isIdvBasis ? idv : (comp.basis === 'EX_SHOWROOM' ? ctx.exShowroom : runningTotal);
        const basisLabel = isIdvBasis ? 'IDV' : (comp.basis === 'EX_SHOWROOM' ? 'Ex-Showroom' : 'Running Total');

        const pct = getMatrixValue(comp, comp.percentage || 0, ctx.fuelType);
        const rawAmt = basisValue * (pct / 100);
        const finalAmt = applyRounding(rawAmt, comp.roundingMode);

        results.push({
            label: comp.label,
            amount: finalAmt,
            meta: `${pct}% of ${basisLabel} (₹${basisValue.toLocaleString()})`,
            componentId: comp.id
        });
    }
    else if (comp.type === 'FIXED') {
        const amtValue = getMatrixValue(comp, comp.amount || 0, ctx.fuelType);
        results.push({
            label: comp.label,
            amount: applyRounding(amtValue, comp.roundingMode),
            meta: 'Fixed Premium',
            componentId: comp.id
        });
    }
    else if (comp.type === 'SLAB') {
        // TP is often slab-based on CC
        const ranges = comp.ranges || [];
        let match = null;
        const val = ctx.engineCc;

        for (const range of ranges) {
            if (val >= range.min && (range.max === null || val <= range.max)) {
                match = range;
                break;
            }
        }

        if (match) {
            results.push({
                label: comp.label,
                amount: applyRounding(match.percentage, comp.roundingMode), // For TP, percentage field often stores the fixed amount
                meta: `Slab ${match.min}-${match.max || '∞'} CC`,
                componentId: comp.id
            });
        }
    }

    return results;
};

export const calculateInsurance = (
    rule: InsuranceRule,
    context: InsuranceCalculationContext
): InsuranceCalculationResult => {

    const idv = context.customIdv || (context.exShowroom * (rule.idvPercentage / 100));

    const odBreakdown: CalculationResultItem[] = [];
    rule.odComponents.forEach(comp => {
        odBreakdown.push(...evaluateInsuranceComponent(comp, context, idv, odBreakdown));
    });

    const tpBreakdown: CalculationResultItem[] = [];
    rule.tpComponents.forEach(comp => {
        tpBreakdown.push(...evaluateInsuranceComponent(comp, context, idv, tpBreakdown));
    });

    const addonBreakdown: CalculationResultItem[] = [];
    const netOdAndTp = [...odBreakdown, ...tpBreakdown];
    rule.addons.forEach(comp => {
        addonBreakdown.push(...evaluateInsuranceComponent(comp, context, idv, netOdAndTp));
    });

    const odTotal = odBreakdown.reduce((sum, i) => sum + i.amount, 0);
    const tpTotal = tpBreakdown.reduce((sum, i) => sum + i.amount, 0);
    const addonsTotal = addonBreakdown.reduce((sum, i) => sum + i.amount, 0);

    const netPremium = odTotal + tpTotal + addonsTotal;
    const gstAmount = applyRounding(netPremium * (rule.gstPercentage / 100));
    const totalPremium = netPremium + gstAmount;

    return {
        idv,
        odBreakdown,
        tpBreakdown,
        addonBreakdown,
        odTotal,
        tpTotal,
        addonsTotal,
        netPremium,
        gstAmount,
        totalPremium,
        ruleId: rule.id
    };
};
