import { InsuranceRule, InsuranceCalculationContext, InsuranceCalculationResult } from '@/types/insurance';

export function calculateInsurance(rule: InsuranceRule, ctx: InsuranceCalculationContext): InsuranceCalculationResult {
    // 1. Calculate IDV
    const idv = ctx.customIdv || Math.round(ctx.exShowroom * (rule.idvPercentage / 100));

    // 2. Calculate OD Premium
    const odBreakdown = (rule.odComponents || []).map(c => ({
        label: c.label || 'Basic OD',
        amount: c.amount || Math.round(idv * 0.018), // Fallback logic if component is just a placeholder
        meta: 'OD Component'
    }));

    const odTotal = odBreakdown.reduce((sum, i) => sum + i.amount, 0);

    // 3. Calculate TP Premium
    const tpRate = ctx.engineCc < 150 ? 714 : (ctx.engineCc < 350 ? 1366 : 2804);
    const tpBreakdown = (rule.tpComponents || []).map(c => ({
        label: c.label || 'Third Party Liability',
        amount: c.amount || tpRate,
        meta: 'Statutory'
    }));

    // Add PA Cover if not present in components but required
    if (!tpBreakdown.some(x => x.label.includes('PA Cover'))) {
        tpBreakdown.push({
            label: 'PA Cover (Owner Driver)',
            amount: 350,
            meta: 'Mandatory'
        });
    }

    const tpTotal = tpBreakdown.reduce((sum, i) => sum + i.amount, 0);

    // 4. Add-ons
    const addonBreakdown = (rule.addons || []).map(a => ({
        label: a.label,
        amount: a.amount || 0,
        meta: 'Optional'
    }));
    const addonsTotal = addonBreakdown.reduce((sum, i) => sum + i.amount, 0);

    // 5. Totals
    const netPremium = odTotal + tpTotal + addonsTotal;
    const gstAmount = Math.round(netPremium * (rule.gstPercentage / 100));
    const totalPremium = netPremium + gstAmount;

    return {
        idv,
        netPremium,
        gstAmount,
        totalPremium,
        odBreakdown,
        tpBreakdown,
        addonBreakdown,

        // Missing fields fixed:
        odTotal,
        tpTotal,
        addonsTotal,
        ruleId: rule.id
    };
}
