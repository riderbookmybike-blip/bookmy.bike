import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function auditTransactions() {
    console.log('--- Global Transaction Audit ---')

    const { data: receipts } = await supabase.from('crm_receipts').select('*, tenant:id_tenants(slug)')
    const { data: payments } = await supabase.from('crm_payments').select('*, tenant:id_tenants(slug)')

    console.log('Total Receipts found:', receipts?.length)
    console.log('Total Payments found:', payments?.length)

    // Find 768 or 0071 in provider_data or method
    const matchR = receipts?.filter(r => JSON.stringify(r.provider_data).includes('768') || JSON.stringify(r.provider_data).includes('0071'))
    const matchP = payments?.filter(p => JSON.stringify(p.provider_data).includes('768') || JSON.stringify(p.provider_data).includes('0071'))

    console.log('Matching Receipts:', matchR?.map(m => ({ id: m.id, tenant: m.tenant?.slug, data: m.provider_data })))
    console.log('Matching Payments:', matchP?.map(m => ({ id: m.id, tenant: m.tenant?.slug, data: m.provider_data })))
}

auditTransactions()
