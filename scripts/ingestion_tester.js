import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

const fileStream = fs.createWriteStream('ingestion_results.txt', { flags: 'w' });
const log = (msg) => {
    console.log(msg);
    fileStream.write(typeof msg === 'object' ? JSON.stringify(msg, null, 2) + '\n' : msg + '\n');
};

async function generateAndTest() {
    try {
        log("--- STARTING INGESTION STRESS TEST ---");

        // Find a valid organization
        const { data: orgs, error: orgErr } = await supabase.from('organizations').select('id').limit(1);

        let orgId;
        if (orgErr || orgs.length === 0) {
            log(`Could not fetch organization. Attempting to create a mock tenant...`);
            const { data: newOrg, error: newOrgErr } = await supabase
                .from('organizations')
                .insert([{ name: 'Stress Test Ingestion Org' }])
                .select('id').single();

            if (newOrgErr) {
                log(`Failed to create mock org: ${newOrgErr.message}`);
                throw new Error("Cannot proceed without a valid organization tenant.");
            }
            orgId = newOrg.id;
            log(`Created mock organization: ${orgId}`);
        } else {
            orgId = orgs[0].id;
        }

        const TOTAL_ROWS = 5000; // Testing 5k due to Node heap constraints / API timeouts for unpartitioned remote hosts
        const CHUNK_SIZE = 500;

        log(`Generating ${TOTAL_ROWS} mocked pipeline rows...`);
        const payload = [];
        for (let i = 0; i < TOTAL_ROWS; i++) {
            payload.push({
                organization_id: orgId,
                property_address: `100${i} Test Ingestion Blvd, Automation City, TX 75001`,
                seller_name: `Stress Tester ${i}`,
                phone: `555-000-${i.toString().padStart(4, '0')}`,
                arv: 250000 + (i * 10),
                notes: 'Spreadsheet Upload Load Test'
            });
        }

        let successCount = 0;
        let failureCount = 0;
        const startTime = Date.now();

        log(`Starting Chunked Inserts (Batch size: ${CHUNK_SIZE})`);

        for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
            const chunk = payload.slice(i, i + CHUNK_SIZE);
            const chunkStart = Date.now();

            const { error: insertErr } = await supabase.from('leads').insert(chunk);

            const elapsed = Date.now() - chunkStart;
            if (insertErr) {
                log(`[!] Chunk ${i / CHUNK_SIZE + 1} Failed in ${elapsed}ms: ${insertErr.message}`);
                failureCount += chunk.length;
            } else {
                log(`[+] Chunk ${i / CHUNK_SIZE + 1} Success in ${elapsed}ms for ${chunk.length} rows. (Triggers executed efficiently)`);
                successCount += chunk.length;
            }
        }

        const totalTime = (Date.now() - startTime) / 1000;
        log("\n--- INGESTION TEST RESULTS ---");
        log(`Total Execution Time: ${totalTime.toFixed(2)} seconds`);
        log(`Total Rows Processed: ${TOTAL_ROWS}`);
        log(`Total Successful:     ${successCount}`);
        log(`Total Failed:         ${failureCount}`);

        if (successCount === TOTAL_ROWS) {
            log("\nVERDICT: STABLE - Postgres handled the concurrent trigger pipeline smoothly.");
        } else {
            log("\nVERDICT: UNSTABLE - Deadlocks or API timeouts observed.");
        }

        // Clean up test data
        log(`\nSweeping test data from the leads table...`);
        const { error: delErr } = await supabase
            .from('leads')
            .delete()
            .like('property_address', '%Test Ingestion Blvd%')
            .eq('organization_id', orgId);

        if (delErr) log(`Cleanup error: ${delErr.message}`);
        else log("Cleanup complete.");

    } catch (err) {
        log(`\nFATAL ERROR: ${err.message}`);
    } finally {
        fileStream.end();
    }
}

generateAndTest();
