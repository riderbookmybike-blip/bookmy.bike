import { InsuranceRule, InsuranceCalculationContext, InsuranceCalculationResult, InsuranceVariable } from '@/types/insurance';
import { FormulaComponent, CalculationResultItem, SlabRange } from '@/types/registration';

export function calculateInsurance(rule: InsuranceRule, ctx: InsuranceCalculationContext): InsuranceCalculationResult {
    const idv = ctx.customIdv || Math.round(ctx.exShowroom * (rule.idvPercentage / 100));

    const resolveBasisValue = (basis: InsuranceVariable | undefined): number => {
        switch (basis) {
            case 'IDV': return idv;
            case 'ENGINE_CC': return ctx.engineCc;
            case 'EX_SHOWROOM':
            default: return ctx.exShowroom;
        }
    };

    const processComponents = (components: FormulaComponent[]): { items: CalculationResultItem[], total: number } => {
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
                const val = basisValue;
                const range = comp.ranges?.find((r: SlabRange) => {
                    const min = r.min || 0;
                    const max = r.max === null ? Infinity : r.max;
                    return val >= min && val <= max;
                });
                if (range) {
                    // Range-based fixed amount or percentage of basis
                    const slabValueType = comp.slabValueType ?? 'FIXED';
                    if (slabValueType === 'FIXED') {
                        amount = range.amount ?? range.percentage ?? 0;
                    } else {
                        amount = Math.round(basisValue * ((range.percentage || 0) / 100));
                    }
                }
            }

            if (amount > 0) {
                items.push({
                    label: comp.label,
                    amount,
                    meta: comp.type === 'PERCENTAGE' ? `${comp.percentage}% of ${comp.basis || 'EX_SHOWROOM'}` : 'Formula Applied'
                });
                total += amount;
            }
        });

        return { items, total };
    };

    const od = processComponents(rule.odComponents || []);
    const tp = processComponents(rule.tpComponents || []);
    const addons = processComponents(rule.addons || []);

    const netPremium = od.total + tp.total + addons.total;
    const gstAmount = Math.round(netPremium * (rule.gstPercentage / 100));
    const totalPremium = netPremium + gstAmount;

    return {
        idv,
        odBreakdown: od.items,
        tpBreakdown: tp.items,
        addonBreakdown: addons.items,
        odTotal: od.total,
        tpTotal: tp.total,
        addonsTotal: addons.total,
        netPremium,
        gstAmount,
        totalPremium,
        ruleId: rule.id
    };
}
