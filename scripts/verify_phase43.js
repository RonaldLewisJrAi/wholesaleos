import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPhase43() {
    console.log("Verifying Intelligence Tables...");

    // Check intelligence_model_versions
    const { data: models, error: err1 } = await supabase.from('intelligence_model_versions').select('*').limit(1);
    if (err1) {
        console.error("Failed to read intelligence_model_versions:", err1.message);
    } else {
        console.log("intelligence_model_versions OK! Found:", models);
    }

    // Check intelligence_decision_logs
    const { data: logs, error: err2 } = await supabase.from('intelligence_decision_logs').select('*').limit(1);
    if (err2) {
        console.error("Failed to read intelligence_decision_logs:", err2.message);
    } else {
        console.log("intelligence_decision_logs OK! Data:", logs);
    }

    // Check deals table column
    const { data: deals, error: err3 } = await supabase.from('deals').select('id, deal_discipline_score').limit(1);
    if (err3) {
        console.error("Failed to read deals.deal_discipline_score:", err3.message);
    } else {
        console.log("deals.deal_discipline_score OK! Data:", deals);
    }

    console.log("Verification Complete.");
}

verifyPhase43();
