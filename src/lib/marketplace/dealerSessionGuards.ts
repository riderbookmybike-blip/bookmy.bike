export type DealerSessionGuardInput = {
    dealerId: string | null;
    financeId: string | null;
    district: string | null;
};

export function shouldSkipDealerContextUpdate(
    prev: DealerSessionGuardInput,
    dealerId: string,
    district?: string
): boolean {
    const nextDistrict = district || null;
    const nextFinanceId = prev.financeId || null;
    return prev.dealerId === dealerId && prev.district === nextDistrict && prev.financeId === nextFinanceId;
}

export function shouldSkipFinanceContextUpdate(prev: DealerSessionGuardInput, financeId: string | null): boolean {
    const nextFinanceId = financeId || null;
    return prev.financeId === nextFinanceId;
}
