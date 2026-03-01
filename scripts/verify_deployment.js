import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDeployment() {
    console.log("===============================================");
    console.log("   WHOLESALE OS DEPLOYMENT VERIFICATION       ");
    console.log("===============================================");

    let passed = true;

    try {
        // 1. Verify Phase 38: Multi-Tenant Organizations Table
        console.log("1. Verifying Organizations (Multi-Tenancy)...");
        const { error: orgError } = await supabase.from('organizations').select('id').limit(1);
        if (orgError) {
            console.log(`   ❌ Failed: ${orgError.message}`);
            passed = false;
        } else {
            console.log("   ✅ Organizations table active.");
        }

        // 2. Verify Phase 39: Leads / Workflow Automation Fields
        console.log("2. Verifying Leads MAO & Workflow Fields...");
        const { error: leadsError } = await supabase.from('leads').select('mao, assigned_to').limit(1);
        if (leadsError) {
            console.log(`   ❌ Failed: ${leadsError.message}`);
            passed = false;
        } else {
            console.log("   ✅ Leads table includes MAO and assignment tracking.");
        }

        // 3. Verify Phase 41: Intelligent Compliance Flags
        console.log("3. Verifying Intelligence Compliance Module...");
        const { error: flagsError } = await supabase.from('deal_intelligence_flags').select('id').limit(1);
        if (flagsError) {
            console.log(`   ❌ Failed: ${flagsError.message}`);
            passed = false;
        } else {
            console.log("   ✅ deal_intelligence_flags table active.");
        }

        // 4. Verify Document Module Exists
        console.log("4. Verifying Documents Module...");
        const { error: docsError } = await supabase.from('documents').select('id').limit(1);
        if (docsError) {
            console.log(`   ❌ Failed: ${docsError.message}`);
            passed = false;
        } else {
            console.log("   ✅ Documents table active.");
        }

    } catch (err) {
        console.error("❌ Critical Verification Error:", err.message);
        passed = false;
    }

    console.log("===============================================");
    if (passed) {
        console.log("🟢 ALL DB MODULES VERIFIED (Phases 38-41)");
    } else {
        console.log("🔴 VERIFICATION FAILED. Review errors above.");
    }
}

verifyDeployment();
