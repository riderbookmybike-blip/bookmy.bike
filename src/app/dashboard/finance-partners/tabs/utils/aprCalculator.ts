import { BankScheme, SchemeCharge, ChargeCalculationBasis } from '@/types/bankPartner';

export interface APRCalculation {
    schemeId: string;
    schemeName: string;
    roi: number;
    interestType: 'REDUCING' | 'FLAT';
    upfrontCharges: number;
    fundedCharges: number;
    dealerPayout: {
        value: number;
        type: 'PERCENTAGE' | 'FIXED';
        basis?: string;
        amount?: number;
    };
    netMargin?: number;
    downpayment: number;
    emi: number;
    totalCost: number;
    irr: number;
    apr: number;
    isActive: boolean;
    tenure: number;
    assetValue: number;
}

/**
 * Calculate charge amount based on charge type and basis
 */
function calculateCharge(
    charge: SchemeCharge,
    loanAmount: number,
    grossLoanAmount: number,
    assetValue: number
): number {
    if (charge.type === 'TABLE') {
        // For matrix charges, use average or zero for calculation
        return 0;
    }

    if (charge.type === 'FIXED') {
        return charge.value;
    }

    // PERCENTAGE type
    let basis = loanAmount;
    switch (charge.calculationBasis) {
        case 'LOAN_AMOUNT':
            basis = loanAmount;
            break;
        case 'GROSS_LOAN_AMOUNT':
            basis = grossLoanAmount;
            break;
        case 'VEHICLE_PRICE':
            basis = assetValue;
            break;
        case 'DISBURSAL_AMOUNT':
            basis = loanAmount; // Simplified for now
            break;
        default:
            basis = loanAmount;
    }

    return (basis * charge.value) / 100;
}

/**
 * Calculate EMI using reducing balance method
 */
function calculateReducingEMI(principal: number, ratePerMonth: number, tenure: number): number {
    if (ratePerMonth === 0) {
        return principal / tenure;
    }

    const factor = Math.pow(1 + ratePerMonth, tenure);
    return (principal * ratePerMonth * factor) / (factor - 1);
}

/**
 * Calculate EMI using flat rate method
 */
function calculateFlatEMI(principal: number, annualRate: number, tenure: number): number {
    const totalInterest = (principal * annualRate * (tenure / 12)) / 100;
    return (principal + totalInterest) / tenure;
}

/**
 * Calculate APR using binary search (iterative solver)
 * This matches the calculation from SchemeEditor.tsx
 * 
 * APR = effective annual rate on net disbursal that results in the given EMI
 * netDisbursal = Gross Loan - Upfront Charges (what customer actually receives)
 */
function calculateAPRBinarySearch(netDisbursal: number, emi: number, tenure: number): number {
    if (netDisbursal <= 0 || emi <= 0 || tenure <= 0) return 0;

    let low = 0;
    let high = 2.0; // 200% max annual rate

    // Binary search for 20 iterations
    for (let i = 0; i < 20; i++) {
        let mid = (low + high) / 2;
        let monthlyRate = mid / 12;

        // Calculate present value of EMI stream at this rate
        let pv = monthlyRate === 0
            ? emi * tenure
            : emi * (1 - Math.pow(1 + monthlyRate, -tenure)) / monthlyRate;

        // Adjust search bounds
        if (pv > netDisbursal) {
            low = mid;  // Rate too low, PV too high
        } else {
            high = mid;  // Rate too high, PV too low
        }
    }

    // Return APR as percentage
    return ((low + high) / 2) * 100;
}

/**
 * Calculate IRR (Internal Rate of Return) for a loan using Newton-Raphson method
 * This calculates the true annual percentage rate (APR) for the loan.
 * 
 * Cash flow model (from borrower's perspective):
 * - Month 0: +grossLoan (amount borrowed/received)
 * - Months 1-N: -emi (monthly payments)
 * 
 * IRR makes NPV = 0:
 * grossLoan = Σ(emi / (1+r)^n) for n=1 to N
 */
function calculateIRR(
    grossLoan: number,
    emi: number,
    tenure: number
): number {
    // Helper function to calculate NPV at a given monthly rate
    const calculateNPV = (monthlyRate: number): number => {
        let npv = grossLoan; // Amount borrowed (inflow/positive)

        // EMI payments (outflows)
        for (let month = 1; month <= tenure; month++) {
            npv -= emi / Math.pow(1 + monthlyRate, month);
        }

        return npv;
    };

    // Helper function to calculate derivative of NPV (for Newton-Raphson)
    const calculateNPVDerivative = (monthlyRate: number): number => {
        let derivative = 0;

        // Derivative of EMI payments
        for (let month = 1; month <= tenure; month++) {
            derivative += (month * emi) / Math.pow(1 + monthlyRate, month + 1);
        }

        return derivative;
    };

    // Newton-Raphson iteration to find the rate where NPV = 0
    let monthlyRate = 0.01; // Initial guess (1% per month = 12% annual)
    const maxIterations = 100;
    const tolerance = 0.000001;

    for (let i = 0; i < maxIterations; i++) {
        const npv = calculateNPV(monthlyRate);
        const derivative = calculateNPVDerivative(monthlyRate);

        if (Math.abs(npv) < tolerance) {
            break; // Converged
        }

        if (Math.abs(derivative) < tolerance) {
            // Derivative too small, avoid division by zero
            break;
        }

        // Newton-Raphson update
        monthlyRate = monthlyRate - npv / derivative;

        // Ensure rate stays positive
        if (monthlyRate < 0) {
            monthlyRate = 0.0001;
        }
    }

    // Convert monthly rate to annual percentage
    const annualRate = monthlyRate * 12 * 100;

    // Sanity check: APR should be realistic (between 0% and 120%)
    if (annualRate < 0 || annualRate > 120 || isNaN(annualRate)) {
        // Fallback to simple effective rate if IRR calculation fails
        const totalPaid = emi * tenure;
        const totalInterest = totalPaid - grossLoan;
        const yearsInTenure = tenure / 12;
        return (totalInterest / grossLoan / yearsInTenure) * 100;
    }

    return annualRate;
}

/**
 * Calculate APR for a scheme with standardized parameters
 */
export function calculateAPR(
    scheme: BankScheme,
    assetValue: number = 100000,
    tenure: number = 36
): APRCalculation {
    // 1. Calculate Initial Loan Potential
    // Respects scheme's Max LTV and Max Loan Amount
    const ltvLoan = assetValue * (scheme.maxLTV / 100);
    const capLoan = scheme.maxLoanAmount || Infinity; // If 0/undefined, assume no cap (or very high)

    // Initial working loan amount
    let loanAmount = Math.min(ltvLoan, capLoan);

    // 2. Helper to calculate charges and downpayment for a given loan amount
    const calculateMetrics = (currentLoan: number) => {
        let tempUpfront = 0;
        let tempFunded = 0;

        // Charges Pass 1 (Independent of Gross Loan)
        scheme.charges.forEach(c => {
            // Note: GROSS_LOAN_AMOUNT basis is approximated as currentLoan in first pass
            // Ideally we solve for Gross Loan, but iteration is safer given complex dependencies
            const basisGross = currentLoan;
            const chargeAmount = calculateCharge(c, currentLoan, basisGross, assetValue);
            if (c.impact === 'UPFRONT') tempUpfront += chargeAmount;
            else tempFunded += chargeAmount;
        });

        // Gross Loan 1 (Approx)
        let grossLoan = currentLoan + tempFunded;

        // Charges Pass 2 (With Dependent Gross Loan)
        tempUpfront = 0;
        tempFunded = 0;
        scheme.charges.forEach(c => {
            const chargeAmount = calculateCharge(c, currentLoan, grossLoan, assetValue);
            if (c.impact === 'UPFRONT') tempUpfront += chargeAmount;
            else tempFunded += chargeAmount;
        });

        // Finalize metrics for this iteration
        grossLoan = currentLoan + tempFunded;
        const downpayment = (assetValue - currentLoan) + tempUpfront;

        return { upfrontCharges: tempUpfront, fundedCharges: tempFunded, grossLoan, downpayment };
    };

    // 3. Initial Calculation
    let metrics = calculateMetrics(loanAmount);

    // 4. Constraint Check: Downpayment cannot be negative
    // If Downpayment < 0, it means Loan > (Asset + UpfrontConstraints)
    // We must reduce the loan amount to make Downpayment == 0
    // Downpayment = Asset - Loan + Upfront(Loan)
    // solving for Downpayment = 0 is hard because Upfront depends on Loan
    // So we use a simple iterative reduction (since Upfront is usually monotonic with Loan)

    if (metrics.downpayment < 0) {
        // We need to reduce loan.
        // Approx reduction: excess amount
        // New Loan = Current Loan - (-Downpayment) = Current Loan + Downpayment (since DP is neg)
        // But reducing loan reduces upfront charges too, so we might under-correct.
        // We iterate 3 times to converge.

        for (let i = 0; i < 5; i++) {
            if (metrics.downpayment >= 0) break; // Converged

            // Adjust loan by the deficit
            // If we have -5000 downpayment, we reduce loan by 5000.
            loanAmount = loanAmount + metrics.downpayment;

            // Re-calculate
            metrics = calculateMetrics(loanAmount);
        }

        // Hard clamp to ensure display is clean (in case of rounding noise)
        if (metrics.downpayment < 0) {
            // If still negative after iteration (rare), just force Loan such that DP=0
            // Simplified: Loan = Asset + Upfront. 
            // We just set Display Downpayment to 0 and accept slight mathematical drift in Loan
        }
    }

    // Final values
    const upfrontCharges = metrics.upfrontCharges;
    const fundedCharges = metrics.fundedCharges;
    const finalGrossLoan = metrics.grossLoan;
    const downpayment = Math.max(0, metrics.downpayment); // Clamp for display safety

    // 5. Calculate EMI
    const monthlyRate = scheme.interestRate / 12 / 100;
    let emi: number;

    if (scheme.interestType === 'REDUCING') {
        emi = calculateReducingEMI(finalGrossLoan, monthlyRate, tenure);
    } else {
        // FLAT rate
        emi = calculateFlatEMI(finalGrossLoan, scheme.interestRate, tenure);
    }

    // 6. Calculate IRR (Internal Rate of Return)
    const irr = calculateIRR(finalGrossLoan, emi, tenure);

    // 7. Calculate APR using Binary Search
    // Use the correctly adjusted net disbursal
    const netDisbursal = finalGrossLoan - upfrontCharges;
    const apr = calculateAPRBinarySearch(netDisbursal, emi, tenure);

    // 9. Calculate dealer payout
    let payoutValue: number;
    let totalPayoutAmount = 0;

    if (scheme.payoutType === 'PERCENTAGE') {
        let payoutBasis = loanAmount;
        switch (scheme.payoutBasis) {
            case 'LOAN_AMOUNT': payoutBasis = loanAmount; break;
            case 'GROSS_LOAN_AMOUNT': payoutBasis = finalGrossLoan; break;
            case 'DISBURSAL_AMOUNT': payoutBasis = loanAmount - upfrontCharges; break;
            default: payoutBasis = loanAmount;
        }
        payoutValue = scheme.payout;
        totalPayoutAmount = (payoutBasis * scheme.payout) / 100;
    } else {
        payoutValue = scheme.payout;
        totalPayoutAmount = scheme.payout;
    }

    // 10. Calculate Net Margin (Dealer Earn - Dealer Subvention Cost)
    const subventionVal = scheme.subvention || 0;
    const totalSubvention = scheme.subventionType === 'PERCENTAGE'
        ? (finalGrossLoan * subventionVal / 100)
        : subventionVal;

    const netMargin = totalPayoutAmount - totalSubvention;

    return {
        schemeId: scheme.id,
        schemeName: scheme.name,
        roi: scheme.interestRate,
        interestType: scheme.interestType,
        upfrontCharges: Math.round(upfrontCharges),
        fundedCharges: Math.round(fundedCharges),
        // 11. Calculate Total Cost (Extra amount paid over Asset Value)
        // Total Paid (Downpayment + EMIs) - Asset Value
        const totalPaid = downpayment + (emi * tenure);
        const totalCost = totalPaid - assetValue;

        return {
            schemeId: scheme.id,
            schemeName: scheme.name,
            roi: scheme.interestRate,
            interestType: scheme.interestType,
            upfrontCharges: Math.round(upfrontCharges),
            fundedCharges: Math.round(fundedCharges),
            dealerPayout: {
                value: scheme.payoutType === 'PERCENTAGE' ? scheme.payout : Math.round(payoutValue),
                type: scheme.payoutType,
                basis: scheme.payoutBasis,
                amount: Math.round(totalPayoutAmount)
            },
            netMargin: Math.round(netMargin),
            downpayment: Math.round(downpayment),
            emi: Math.round(emi),
            totalCost: Math.round(totalCost),
            irr: Math.round(irr * 100) / 100,
            apr: Math.round(apr * 100) / 100,
            isActive: scheme.isActive,
            tenure,
            assetValue
        };
    }

    /**
     * Calculate APR for all schemes
     */
    export function calculateAPRForAllSchemes(
        schemes: BankScheme[],
        assetValue: number = 100000,
        tenure: number = 36
    ): APRCalculation[] {
        return schemes.map(scheme => calculateAPR(scheme, assetValue, tenure));
    }
