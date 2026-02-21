import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const tenantId = 'c18b4df2-75c2-421a-88c3-1317137a993d'

async function checkDeleted() {
    const { data, error } = await supabase
        .from('crm_receipts')
        .select('id, is_deleted')
        .eq('tenant_id', tenantId)

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Receipt Deleted Status:', data)
    }
}

checkDeleted()
