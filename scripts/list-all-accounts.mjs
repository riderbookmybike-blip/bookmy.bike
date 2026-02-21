import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listAllAccounts() {
    const { data, error } = await supabase
        .from('id_bank_accounts')
        .select('*, tenant:id_tenants(slug, name)')

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('All Accounts:', data.map(a => ({
            id: a.id,
            name: a.bank_name,
            num: a.account_number,
            tenant: a.tenant?.slug,
            tenantId: a.tenant_id
        })))
    }
}

listAllAccounts()
