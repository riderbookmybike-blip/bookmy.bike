/* eslint-disable @typescript-eslint/no-explicit-any */

export type FinanceCandidate = { bank: any; scheme: any };

export type FinanceWinner = {
    bank: any;
    scheme: any;
    emi: number;
    grossLoan: number;
    interest: number;
    total: number;
};

const asUpper = (value: unknown) => String(value || '').toUpperCase();
const toNumber = (value: unknown, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

export function isTenureSupported(scheme: any, tenure: number): boolean {
    const allowed = Array.isArray(scheme?.allowedTenures) ? scheme.allowedTenures.map((t: any) => Number(t)) : [];
    if (allowed.length > 0) return allowed.includes(tenure);

    const minT = toNumber(scheme?.minTenure, 0);
    const maxT = toNumber(scheme?.maxTenure, 0);
    if (minT > 0 && maxT >= minT) return tenure >= minT && tenure <= maxT;
    return true;
}

export function calcChargeAmount(charge: any, baseLoan: number, totalOnRoad: number): number {
    const type = asUpper(charge?.type || charge?.valueType || 'FIXED');
    if (type === 'PERCENTAGE') {
        const basisKey = asUpper(charge?.calculationBasis || 'ON_ROAD');
        const basis = basisKey === 'LOAN_AMOUNT' ? baseLoan : totalOnRoad;
        return Math.round(toNumber(basis, 0) * (toNumber(charge?.value, 0) / 100));
    }
    return toNumber(charge?.value, 0);
}

export function isLoanEligibleForScheme(scheme: any, grossLoan: number, totalOnRoad: number): boolean {
    if (grossLoan <= 0) return false;

    const maxLtv = toNumber(scheme?.maxLTV, 0);
    if (maxLtv > 0 && totalOnRoad > 0) {
        const ltvCapAmount = (totalOnRoad * maxLtv) / 100;
        if (grossLoan > Math.floor(ltvCapAmount)) return false;
    }

    const minLoan = toNumber(scheme?.minLoanAmount, 0);
    if (minLoan > 0 && grossLoan < minLoan) return false;

    const maxLoan = toNumber(scheme?.maxLoanAmount, 0);
    if (maxLoan > 0 && grossLoan > maxLoan) return false;

    return true;
}

export function evaluateCandidateForTenure(
    candidate: FinanceCandidate,
    input: {
        tenure: number;
        baseLoan: number;
        totalOnRoad: number;
        downPayment: number;
    }
): FinanceWinner | null {
    const scheme = candidate?.scheme || {};
    const tenure = toNumber(input.tenure, 0);
    if (tenure <= 0 || !isTenureSupported(scheme, tenure)) return null;

    const charges: any[] = Array.isArray(scheme?.charges) ? scheme.charges : [];
    const totalUpfront = charges
        .filter(c => asUpper(c?.impact) === 'UPFRONT')
        .reduce((sum, c) => sum + calcChargeAmount(c, input.baseLoan, input.totalOnRoad), 0);
    const totalFunded = charges
        .filter(c => asUpper(c?.impact) === 'FUNDED')
        .reduce((sum, c) => sum + calcChargeAmount(c, input.baseLoan, input.totalOnRoad), 0);

    const grossLoan = Math.max(0, Math.round(input.baseLoan + totalFunded + totalUpfront));
    if (!isLoanEligibleForScheme(scheme, grossLoan, input.totalOnRoad)) return null;

    const annualRate = toNumber(scheme?.interestRate, 0) / 100;
    const interestType = asUpper(scheme?.interestType || 'REDUCING');
    const emiRaw =
        interestType === 'FLAT'
            ? (grossLoan + grossLoan * annualRate * (tenure / 12)) / tenure
            : (() => {
                  const monthlyRate = annualRate / 12;
                  if (monthlyRate === 0) return grossLoan / tenure;
                  return (
                      (grossLoan * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
                      (Math.pow(1 + monthlyRate, tenure) - 1)
                  );
              })();

    const emi = Math.round(emiRaw);
    const totalPaidViaEmi = emi * tenure;
    const interest = Math.max(0, Math.round(totalPaidViaEmi - grossLoan));
    const total = Math.round(totalPaidViaEmi + Math.max(0, Math.round(input.downPayment)));

    return {
        bank: candidate?.bank,
        scheme,
        emi,
        grossLoan,
        interest,
        total,
    };
}

export function pickBestCandidateForTenure(
    candidates: FinanceCandidate[],
    input: {
        tenure: number;
        baseLoan: number;
        totalOnRoad: number;
        downPayment: number;
    }
): FinanceWinner | null {
    let best: FinanceWinner | null = null;
    for (const candidate of candidates || []) {
        const evaluated = evaluateCandidateForTenure(candidate, input);
        if (!evaluated) continue;
        if (!best || evaluated.emi < best.emi) best = evaluated;
    }
    return best;
}
