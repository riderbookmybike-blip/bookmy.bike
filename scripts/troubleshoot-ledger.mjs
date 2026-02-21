import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const tenantId = 'c18b4df2-75c2-421a-88c3-1317137a993d'

async function troubleshootLedger() {
    console.log('--- Troubleshooting Ledger Query ---')

    // 1. Get Accounts first to verify IDs
    const { data: accounts } = await supabase
        .from('id_bank_accounts')
        .select('id, bank_name')
        .eq('tenant_id', tenantId)

    if (!accounts || accounts.length === 0) {
        console.log('No accounts found for tenant.')
        return
    }

    const itId = accounts[0].id
    console.log(`Testing with Account: ${accounts[0].bank_name} (${itId})`)

    // 2. Test Different JSONB filter syntaxes
    const syntaxes = [
        { name: "filter('provider_data->>bank_account_id', 'eq', id)", fn: (q, id) => q.filter('provider_data->>bank_account_id', 'eq', id) },
        { name: "filter('provider_data->bank_account_id', 'eq', id)", fn: (q, id) => q.filter('provider_data->bank_account_id', 'eq', id) },
        { name: "query.eq('provider_data->bank_account_id', id)", fn: (q, id) => q.eq('provider_data->bank_account_id', id) },
        { name: "Simple text search in provider_data", fn: (q, id) => q.textSearch('provider_data', id) }
    ]

    for (const syntax of syntaxes) {
        let query = supabase
            .from('crm_receipts')
            .select('id')
            .eq('tenant_id', tenantId)

        try {
            const { data, error } = await syntax.fn(query, itId)
            if (error) {
                console.log(`[FAILED] ${syntax.name}: ${error.message}`)
            } else {
                console.log(`[SUCCESS] ${syntax.name}: Found ${data?.length || 0} records`)
            }
        } catch (e) {
            console.log(`[ERROR] ${syntax.name}: ${e.message}`)
        }
    }

    // 3. No filter check
    const { data: noFilter } = await supabase
        .from('crm_receipts')
        .select('id, provider_data')
        .eq('tenant_id', tenantId)
        .limit(1)

    console.log('Sample Data (No Filter):', noFilter)
}

troubleshootLedger()
