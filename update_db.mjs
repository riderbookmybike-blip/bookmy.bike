import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data: aums } = await supabase.from('id_tenants').select('id').eq('slug', 'aums').single();
  if (aums) {
     await supabase.from('sys_settings').update({ default_owner_tenant_id: aums.id }).neq('id', '00000000-0000-0000-0000-000000000000');
     console.log('Fixed sys_settings.default_owner_tenant_id to AUMS:', aums.id);
  } else {
     console.log('No AUMS tenant found!');
  }
}
fix();
