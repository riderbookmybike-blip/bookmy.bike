import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listTenants() {
    const { data, error } = await supabase
        .from('id_tenants')
        .select('id, slug, name')

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Tenants:', data)
    }
}

listTenants()
