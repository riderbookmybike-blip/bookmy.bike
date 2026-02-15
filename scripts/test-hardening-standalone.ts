import { validateQuoteDealerContext, validateFinanceLeadDealer } from '../src/lib/crm/contextHardening';

async function runTests() {
    console.log('--- Testing Hardening Logic ---');

    const mockSettings = { unified_context_strict_mode: true };
    const mockSettingsLogOnly = { unified_context_strict_mode: false };

    // 1. Test validateFinanceLeadDealer
    console.log('\nTesting validateFinanceLeadDealer:');

    // Case A: Finance simulator without dealer (Strict)
    const resA = validateFinanceLeadDealer('PDP_FINANCE_SIMULATOR', undefined, mockSettings);
    console.log(
        'Case A (PDP_FINANCE_SIMULATOR, no dealer, strict):',
        resA.success === false ? 'PASS (Rejected)' : 'FAIL'
    );

    // Case B: Finance simulator without dealer (Log-only)
    const resB = validateFinanceLeadDealer('PDP_FINANCE_SIMULATOR', undefined, mockSettingsLogOnly);
    console.log(
        'Case B (PDP_FINANCE_SIMULATOR, no dealer, log-only):',
        resB.success === true ? 'PASS (Allowed)' : 'FAIL'
    );

    // Case C: Normal lead without dealer
    const resC = validateFinanceLeadDealer('DIRECT', undefined, mockSettings);
    console.log('Case C (DIRECT, no dealer, strict):', resC.success === true ? 'PASS (Allowed)' : 'FAIL');

    // Case D: Finance simulator WITH dealer
    const resD = validateFinanceLeadDealer('PDP_FINANCE_SIMULATOR', 'dealer-123', mockSettings);
    console.log(
        'Case D (PDP_FINANCE_SIMULATOR, with dealer, strict):',
        resD.success === true ? 'PASS (Allowed)' : 'FAIL'
    );

    // 2. Test validateQuoteDealerContext
    console.log('\nTesting validateQuoteDealerContext:');

    // Simple mock for SupabaseClient
    const createMockSupabase = (leadData: any) =>
        ({
            from: () => ({
                select: () => ({
                    eq: () => ({
                        eq: () => ({
                            maybeSingle: async () => ({ data: leadData, error: null }),
                        }),
                    }),
                }),
            }),
        }) as any;

    // Case E: Lead locked to Dealer A, Quote for Dealer B (Strict)
    const mockSupabaseE = createMockSupabase({ selected_dealer_tenant_id: 'dealer-A' });
    const resE = await validateQuoteDealerContext(mockSupabaseE, 'lead-1', 'dealer-B', mockSettings);
    console.log('Case E (Locked to A, Quote for B, Strict):', resE.success === false ? 'PASS (Rejected)' : 'FAIL');

    // Case F: Lead locked to Dealer A, Quote for Dealer B (Log-only)
    const resF = await validateQuoteDealerContext(mockSupabaseE, 'lead-1', 'dealer-B', mockSettingsLogOnly);
    console.log('Case F (Locked to A, Quote for B, Log-only):', resF.success === true ? 'PASS (Allowed)' : 'FAIL');

    // Case G: Lead NOT locked, Quote for Dealer B
    const mockSupabaseG = createMockSupabase({ selected_dealer_tenant_id: null });
    const resG = await validateQuoteDealerContext(mockSupabaseG, 'lead-1', 'dealer-B', mockSettings);
    console.log('Case G (Lead not locked, Quote for B):', resG.success === true ? 'PASS (Allowed)' : 'FAIL');

    // Case H: Lead locked to Dealer A, Quote for Dealer A
    const resH = await validateQuoteDealerContext(mockSupabaseE, 'lead-1', 'dealer-A', mockSettings);
    console.log('Case H (Lead locked to A, Quote for A):', resH.success === true ? 'PASS (Allowed)' : 'FAIL');

    console.log('\n--- Hardening Logic Tests Complete ---');
}

runTests().catch(console.error);
