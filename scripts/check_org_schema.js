import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('organizations').select('*').limit(1).then(res => {
    fs.writeFileSync('org_cols.json', JSON.stringify(Object.keys(res.data[0] || {}), null, 2));
});
