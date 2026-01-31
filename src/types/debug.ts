export interface BMBDebug {
    pincode?: string;
    stateCode?: string;
    locSource?: string;
    pricingSource?: string;
    district?: string;
    schemeId?: string;
    schemeName?: string;
    bankName?: string;
    financeLogic?: string;
    leadId?: string;
    dealerId?: string;
    tenantId?: string;
    pageId?: string;
    userId?: string;
    marketOffersCount?: number;
    studioName?: string;
}

declare global {
    interface Window {
        __BMB_DEBUG__?: BMBDebug;
    }
}
