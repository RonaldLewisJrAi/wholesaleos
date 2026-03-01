import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    let orgId = orgs?.[0]?.id;

    if (!orgId) {
        const { data: newOrg } = await supabase.from('organizations').insert([{ name: 'Test' }]).select('id').single();
        orgId = newOrg?.id;
    }

    const { data: leadData, error: leadErr } = await supabase.from('leads').insert([{
        organization_id: orgId,
        seller_name: 'Schema Check',
        property_address: '123 Test',
        status: 'New'
    }]).select('*').single();

    if (leadErr) {
        console.error("Error inserting lead:", leadErr.message);
    } else {
        console.log("Leads columns:", Object.keys(leadData).join(', '));
        // delete it
        await supabase.from('leads').delete().eq('id', leadData.id);
    }
}

checkSchema();
