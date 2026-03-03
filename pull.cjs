const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    console.log("Checking DB Connection...");

    // We will attempt to force an insert but grab the details object cleanly
    const { error: e1 } = await supabase.from('leads').insert({
        organization_id: '05f30bd0-ac2a-47f6-9ae8-7df3adc4cae5',
        status: 'Lead',
        seller_name: 'test',
        property_address: 'test'
    });

    if (e1) {
        console.log("LEADS ERROR:");
        console.log(JSON.stringify(e1, null, 2));
    }

    const { error: e2 } = await supabase.from('deals').insert({
        organization_id: '05f30bd0-ac2a-47f6-9ae8-7df3adc4cae5',
        status: 'Underwriting',
        property_address: 'test'
    });

    if (e2) {
        console.log("\nDEALS ERROR:");
        console.log(JSON.stringify(e2, null, 2));
    }
}

check();
