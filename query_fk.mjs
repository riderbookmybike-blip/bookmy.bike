import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: lead } = await supabase.from('crm_leads').select('id, owner_tenant_id').order('created_at', { ascending: false }).limit(1).single();
  console.log('Latest Lead owner_tenant_id:', lead.owner_tenant_id);
}
check();
