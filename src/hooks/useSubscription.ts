'use client';

import { useTenant } from '@/lib/tenant/tenantContext';
import { SUBSCRIPTION_PLANS, PlanTier } from '@/config/subscriptionPlans';
import { Resource } from '@/config/permissions';

// In a real app, this would come from the API via TenantContext.
// We will mock the current plan here for the UI demo.
const MOCK_CURRENT_PLAN: PlanTier = 'ENTERPRISE'; // Changed to ENTERPRISE default for development

export function useSubscription() {
    const { status } = useTenant(); // We can use tenant status too

    // Mock State - In production, this would be part of the Tenant Object
    const currentPlanTier = MOCK_CURRENT_PLAN;
    const currentPlan = SUBSCRIPTION_PLANS[currentPlanTier];

    // Check if a specific resource is allowed by the plan
    const checkAccess = (resource: Resource): boolean => {
        if (!currentPlan) return false;
        return currentPlan.features.includes(resource);
    };

    // Check usage limits (Mock)
    const checkUsage = (currentUsers: number) => {
        return currentUsers < currentPlan.maxUsers;
    };

    return {
        plan: currentPlan,
        tier: currentPlanTier,
        checkAccess,
        checkUsage,
        maxUsers: currentPlan.maxUsers
    };
}
