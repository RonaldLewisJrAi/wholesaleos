/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const runTests = async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminSupa = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

    let logOutput = "🧠 Starting Phase 13 Runtime Verification: Behavioral Engine Accuracy\n";
    const log = (msg) => {
        console.log(msg);
        logOutput += msg + '\n';
    };

    try {
        log("[SETUP] Provisioning Test Tenant for Behavioral Engine...");
        const { data: org, error: orgErr } = await adminSupa.from('organizations').insert({ name: 'Behavioral Test Corp' }).select().single();
        if (orgErr) throw orgErr;

        log("👉 Inserting Lead with High Distress, 50% Equity, and Urgent Timeline...");
        const { data: lead, error: leadErr } = await adminSupa.from('leads').insert({
            organization_id: org.id,
            first_name: 'Motivated',
            last_name: 'Seller',
            arv: 200000,
            mortgage_balance: 100000,     // 50% equity -> (clamped 50 * 0.4 = 20 pts)
            distress_score: 80,           // 80 * 0.4 = 32 pts
            timeline_to_sell: '0-30 days' // 100 * 0.2 = 20 pts
            // Sum = 72 pts
        }).select().single();

        if (leadErr) {
            log("❌ Schema Missing Columns Failed: " + leadErr.message);
        } else {
            log(`✅ Lead Inserted. Heat Score: ${lead.heat_score}, Equity: ${lead.equity_percent}`);
            if (lead.heat_score === 72) {
                log("✅ SUCCESS: Heat Score Calculation is accurate and identical to mathematical prediction.");
            } else {
                log("❌ FAILURE: Heat score logic skew. Expected: 72");
            }
        }

        await adminSupa.from('organizations').delete().eq('id', org.id);

    } catch (e) {
        log("\n❌ FATAL TEST ERROR: " + String(e));
    } finally {
        fs.writeFileSync(path.join(__dirname, '../behavioral_results.txt'), logOutput);
        process.exit(0);
    }
};

runTests();
