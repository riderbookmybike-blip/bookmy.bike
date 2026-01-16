import { InsuranceRule, InsuranceCalculationContext, InsuranceCalculationResult, InsuranceVariable } from '@/types/insurance';
import { FormulaComponent, CalculationResultItem, SlabRange } from '@/types/registration';

export function calculateInsurance(rule: InsuranceRule, ctx: InsuranceCalculationContext): InsuranceCalculationResult {
    const isNew = ctx.isNewVehicle ?? true;
    const odTenure = ctx.odTenure ?? 1;
    const tpTenure = ctx.tpTenure ?? (isNew ? 5 : 1);
    const ncb = ctx.ncbPercentage ?? 0;

    const idv = ctx.customIdv || Math.round(ctx.exShowroom * (rule.idvPercentage / 100));

    const resolveBasisValue = (basis: InsuranceVariable | undefined): number => {
        switch (basis) {
            case 'IDV': return idv;
            case 'ENGINE_CC': return ctx.engineCc;
            case 'EX_SHOWROOM':
            default: return ctx.exShowroom;
        }
    };

    const processComponents = (components: FormulaComponent[], multiplier: number): { items: CalculationResultItem[], total: number } => {
        const items: CalculationResultItem[] = [];
        let total = 0;

        components.forEach(comp => {
            let amount = 0;
            const basisValue = resolveBasisValue(comp.basis as any);

            if (comp.type === 'PERCENTAGE') {
                amount = Math.round(basisValue * ((comp.percentage || 0) / 100));
            } else if (comp.type === 'FIXED') {
                amount = comp.amount || 0;
            } else if (comp.type === 'SLAB') {
                const slabBasis = comp.slabVariable || 'ENGINE_CC';
                const range = comp.ranges?.find((r: SlabRange) => {
                    const rowBasis = r.slabBasis || slabBasis;
                    const val = rowBasis === 'ENGINE_CC'
                        ? ctx.engineCc
                        : (rowBasis === 'IDV' ? idv : ctx.exShowroom);
                    const min = r.min || 0;
                    const max = r.max === null ? Infinity : r.max;
                    return val >= min && val <= max;
                });
                if (range) {
                    const slabValueType = comp.slabValueType ?? 'FIXED';
                    if (slabValueType === 'FIXED') {
                        amount = range.amount ?? range.percentage ?? 0;
                    } else {
                        const basisForPercent = comp.basis === 'IDV' ? idv : ctx.exShowroom;
                        amount = Math.round(basisForPercent * ((range.percentage || 0) / 100));
                    }
                }
            }

            // Apply Tenure Multiplier
            amount = amount * multiplier;

            if (amount > 0) {
                items.push({
                    label: comp.label,
                    amount,
                    meta: comp.type === 'PERCENTAGE' ? `${comp.percentage}% of ${comp.basis || 'EX_SHOWROOM'} x ${multiplier}y` : 'Formula Applied'
                });
                total += amount;
            }
        });

        return { items, total };
    };

    // Calculate Raw Premiums with Tenure Multiplier
    const odInternal = processComponents(rule.odComponents || [], odTenure);
    const tpInternal = processComponents(rule.tpComponents || [], tpTenure);

    // Addons usually follow OD Tenure
    // But check if they are tied to TP? (Usually matched to OD in industry)
    const addonsInternal = processComponents(rule.addons || [], odTenure);

    // Apply NCB to OD (Subtract)
    // NCB is typically applied on the OD Premium
    let odTotal = odInternal.total;
    const ncbAmount = Math.round(odTotal * (ncb / 100));
    odTotal -= ncbAmount;

    // OD Breakdown update to reflect NCB
    if (ncb > 0) {
        odInternal.items.push({
            label: `No Claim Bonus (${ncb}%)`,
            amount: -ncbAmount,
            meta: 'Discount applied on OD'
        });
    }

    const netPremium = odTotal + tpInternal.total + addonsInternal.total;
    const gstAmount = Math.round(netPremium * (rule.gstPercentage / 100));
    const totalPremium = netPremium + gstAmount;

    return {
        idv,
        odBreakdown: odInternal.items,
        tpBreakdown: tpInternal.items,
        addonBreakdown: addonsInternal.items,
        odTotal,
        tpTotal: tpInternal.total,
        addonsTotal: addonsInternal.total,
        netPremium,
        gstAmount,
        totalPremium,
        ruleId: rule.id
    };
}
