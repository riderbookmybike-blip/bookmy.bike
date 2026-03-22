import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: tenant } = await supabase.from('id_tenants').select('id, name').eq('id', '5371fa81-a58a-4a39-aef2-2821268c96c8').maybeSingle();
  console.log('Does default tenant exist?', tenant);
}
check();
