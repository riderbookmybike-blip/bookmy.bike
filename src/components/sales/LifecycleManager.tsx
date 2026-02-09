import { OperationalStage } from '@/types/booking';

interface StageConfig {
    allowedTabs: string[];
    primaryTab: string;
}

const LIFECYCLE_CONFIG: Record<OperationalStage, StageConfig> = {
    QUOTE: {
        allowedTabs: ['Quote'],
        primaryTab: 'Quote',
    },
    BOOKING: {
        allowedTabs: ['Order'],
        primaryTab: 'Order',
    },
    PAYMENT: {
        allowedTabs: ['Ledger'],
        primaryTab: 'Ledger',
    },
    FINANCE: {
        allowedTabs: ['Quote'],
        primaryTab: 'Quote',
    },
    ALLOTMENT: {
        allowedTabs: ['Allotment', 'PDI'],
        primaryTab: 'Allotment',
    },
    COMPLIANCE: {
        allowedTabs: ['Insurance', 'Registration', 'HSRP'],
        primaryTab: 'Insurance',
    },
    DELIVERED: {
        allowedTabs: ['Delivery', 'Invoice'],
        primaryTab: 'Delivery',
    },
};

export const getLifecycleConfig = (stage: OperationalStage) => {
    return LIFECYCLE_CONFIG[stage] || LIFECYCLE_CONFIG.QUOTE;
};

export const getStageFromTab = (tab: string): OperationalStage | null => {
    for (const [stage, config] of Object.entries(LIFECYCLE_CONFIG)) {
        if (config.primaryTab === tab) return stage as OperationalStage;
    }
    return null;
};
