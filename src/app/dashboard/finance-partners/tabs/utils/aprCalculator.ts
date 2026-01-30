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
    };
    downpayment: number;
    emi: number;
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
    // 1. Calculate loan amount (assetValue × LTV%)
    const loanAmount = assetValue * (scheme.maxLTV / 100);

    // 2. Calculate upfront charges (need to iterate twice since some charges depend on gross loan)
    // First pass: calculate charges that don't depend on gross loan
    let tempUpfront = 0;
    let tempFunded = 0;

    scheme.charges.forEach(c => {
        const chargeAmount = calculateCharge(c, loanAmount, loanAmount, assetValue);
        if (c.impact === 'UPFRONT') {
            tempUpfront += chargeAmount;
        } else {
            tempFunded += chargeAmount;
        }
    });

    // Gross loan includes funded charges
    const grossLoan = loanAmount + tempFunded;

    // Second pass with accurate gross loan for percentage-based charges on gross loan
    let upfrontCharges = 0;
    let fundedCharges = 0;

    scheme.charges.forEach(c => {
        const chargeAmount = calculateCharge(c, loanAmount, grossLoan, assetValue);
        if (c.impact === 'UPFRONT') {
            upfrontCharges += chargeAmount;
        } else {
            fundedCharges += chargeAmount;
        }
    });

    // 3. Calculate downpayment (what customer pays upfront)
    const downpayment = (assetValue - loanAmount) + upfrontCharges;

    // 4. Recalculate gross loan with accurate funded charges
    const finalGrossLoan = loanAmount + fundedCharges;

    // 5. Calculate EMI
    const monthlyRate = scheme.interestRate / 12 / 100;
    let emi: number;

    if (scheme.interestType === 'REDUCING') {
        emi = calculateReducingEMI(finalGrossLoan, monthlyRate, tenure);
    } else {
        // FLAT rate
        emi = calculateFlatEMI(finalGrossLoan, scheme.interestRate, tenure);
    }

    // 6. Calculate Total Amount Paid
    const totalPaid = downpayment + (emi * tenure);

    // 7. Calculate IRR (Internal Rate of Return) - true cost of the loan
    // IRR is the monthly rate where: finalGrossLoan = Present Value of all EMI payments
    const irr = calculateIRR(finalGrossLoan, emi, tenure);

    // 8. Calculate dealer payout
    let payoutValue: number;
    if (scheme.payoutType === 'PERCENTAGE') {
        // Calculate based on payout basis
        let payoutBasis = loanAmount;
        switch (scheme.payoutBasis) {
            case 'LOAN_AMOUNT':
                payoutBasis = loanAmount;
                break;
            case 'GROSS_LOAN_AMOUNT':
                payoutBasis = finalGrossLoan;
                break;
            case 'DISBURSAL_AMOUNT':
                payoutBasis = loanAmount - upfrontCharges; // Simplified
                break;
            default:
                payoutBasis = loanAmount;
        }
        payoutValue = scheme.payout;
    } else {
        // FIXED payout
        payoutValue = scheme.payout;
    }

    return {
        schemeId: scheme.id,
        schemeName: scheme.name,
        roi: scheme.interestRate,
        interestType: scheme.interestType,
        upfrontCharges: Math.round(upfrontCharges),
        fundedCharges: Math.round(fundedCharges),
        dealerPayout: {
            value: scheme.payoutType === 'PERCENTAGE'
                ? scheme.payout
                : Math.round(payoutValue),
            type: scheme.payoutType,
            basis: scheme.payoutBasis
        },
        downpayment: Math.round(downpayment),
        emi: Math.round(emi),
        irr: Math.round(irr * 100) / 100,
        apr: Math.round(irr * 100) / 100, // APR is same as IRR for now
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
