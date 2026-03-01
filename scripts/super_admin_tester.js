/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const runTests = async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

    const adminSupa = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const clientSupa = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

    let logOutput = "🛡️ Starting Phase 13 Runtime Verification: Super Admin MFA & Audit Logging\n";
    const log = (msg) => {
        console.log(msg);
        logOutput += msg + '\n';
    };

    let mockUserId;

    try {
        log("[SETUP] Provisioning Temporary Super Admin Account...");
        const email = `test_admin_${Date.now()}@wholesale-os.test`;
        const password = 'TestAdminPassword123!';

        // 1. Create User
        const { data: userCreated, error: userErr } = await adminSupa.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { first_name: 'Test', last_name: 'Admin' } // Needs name to trigger profile gen
        });
        if (userErr) throw userErr;
        mockUserId = userCreated.user.id;

        // 2. Escalate Privilege in Database
        await new Promise(r => setTimeout(r, 1000)); // Wait for trigger
        const { error: privErr } = await adminSupa.from('profiles').update({ system_role: 'GLOBAL_SUPER_ADMIN' }).eq('id', mockUserId);
        if (privErr) throw privErr;

        // 3. Authenticate to get AAL1 Session
        log("👉 Authenticating Session (AAL1 - No MFA)...");
        const { data: authData, error: authErr } = await clientSupa.auth.signInWithPassword({ email, password });
        if (authErr) throw authErr;

        // 4. Test 1: Permitted Non-Mutating Audit Action (Login tracking)
        log("👉 Test 1: Submitting Non-Mutating Audit Log (GLOBAL_SUPER_ADMIN_LOGIN_ATTEMPT)...");
        const { error: test1Err } = await clientSupa.rpc('log_super_admin_action', {
            action_type: 'GLOBAL_SUPER_ADMIN_LOGIN_ATTEMPT',
            target_resource: 'system_auth',
            target_id: null,
            details: { ip: '127.0.0.1' }
        });

        if (test1Err) {
            log(`❌ FAILURE: Login Tracking rejected incorrectly. ${test1Err.message}`);
        } else {
            log("✅ SUCCESS: Login Tracking successfully bypassed MFA check.");
        }

        // 5. Test 2: Blocked Mutating Action (Purge) without AAL2
        log("👉 Test 2: Submitting High-Risk Mutation (PURGE_TENANT_DATA) without AAL2...");
        const { error: test2Err } = await clientSupa.rpc('log_super_admin_action', {
            action_type: 'PURGE_TENANT_DATA',
            target_resource: 'organizations',
            target_id: '00000000-0000-0000-0000-000000000000',
            details: { reason: 'Test' }
        });

        if (test2Err && test2Err.message.includes('Multi-Factor Authentication (AAL2) is required')) {
            log("✅ SUCCESS: High-Risk Mutation correctly REJECTED due to missing AAL2 (MFA).");
        } else {
            log("❌ FAILURE: Engine permitted mutation or threw unexpected error. " + (test2Err?.message || ''));
        }

        // 6. Verify Log Persistence
        log("👉 Verifying Immutable Log Persistence...");
        const { data: logs, error: checkLogErr } = await adminSupa.from('super_admin_audit_logs').select('*').eq('admin_id', mockUserId);
        if (logs && logs.length === 1 && logs[0].action_type === 'GLOBAL_SUPER_ADMIN_LOGIN_ATTEMPT') {
            log("✅ SUCCESS: Immutable Audit Trail confirmed. Only the permitted login was written to ledger.");
        } else {
            log("❌ FAILURE: Audit trace mismatch. Rows retrieved: " + (logs?.length || 0));
        }

    } catch (e) {
        log("\n❌ FATAL TEST ERROR:\n" + JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    } finally {
        if (mockUserId) {
            log("[CLEANUP] Scrubbing Temporary Super Admin Sandbox...");
            await adminSupa.auth.admin.deleteUser(mockUserId);
        }
        import('fs').then(fs => fs.writeFileSync(path.join(__dirname, '../admin_results.txt'), logOutput));
        setTimeout(() => process.exit(0), 100);
    }
};

runTests();
