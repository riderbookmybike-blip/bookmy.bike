import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function globalAudit() {
    console.log('--- Global Bank Account Audit ---')
    const { data, error } = await supabase
        .from('id_bank_accounts')
        .select('id, bank_name, account_number, tenant_id')

    if (error) {
        console.error('Error:', error)
    } else {
        data.forEach(a => {
            console.log(`[${a.tenant_id}] ${a.bank_name} - ${a.account_number}`)
        })
    }
}

globalAudit()
