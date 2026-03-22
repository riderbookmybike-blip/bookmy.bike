import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: settings } = await supabase.from('sys_settings').select('*').limit(1);
  console.log('sys_settings:', settings);
  
  const { data: tenants } = await supabase.from('id_tenants').select('id, name, slug').limit(5);
  console.log('id_tenants:', tenants);
}
check();
