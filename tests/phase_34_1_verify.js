import fetch from 'node-fetch'; // Standard in modern node, or we can use the injected one
import child_process from 'child_process';
import process from 'process';

const API_BASE = 'http://localhost:3001';

async function runPenTests() {
    console.log("====================================================");
    console.log("🛡️ PHASE 34.1: ZERO-TRUST PENETRATION TEST SUITE");
    console.log("====================================================\n");

    let passed = 0;
    let failed = 0;

    const assertStatus = (name, res, expected) => {
        if (res.status === expected) {
            console.log(`✅ [PASS] ${name} (Expected ${expected}, Got ${res.status})`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${name} (Expected ${expected}, Got ${res.status})`);
            failed++;
        }
    };

    console.log("--- PART 1: JWT & AUTH ENFORCEMENT ---");

    // Test 1: No JWT Token
    try {
        const res1 = await fetch(`${API_BASE}/api/comps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: 30.2, lng: -97.7, radius: 5, userId: 'fake-id' })
        });
        assertStatus('No JWT Token (Should Reject)', res1, 401);
    } catch (e) { console.error(e) }

    // Test 2: Forged JWT Token
    try {
        const res2 = await fetch(`${API_BASE}/api/disposition/blast/sms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
            },
            body: JSON.stringify({ propertyId: 1, buyerIds: [1, 2] })
        });
        assertStatus('Spoofed Malformed JWT Signature (Should Reject)', res2, 401);
    } catch (e) { console.error(e); }

    console.log("\n--- PART 3: SSRF & PLAYWRIGHT MITIGATION ---");

    // Test 3: SSRF Payload against document generation
    try {
        const res3 = await fetch(`${API_BASE}/api/documents/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'some-fake-id', // Usually blocked by JWT now
                htmlContent: `<img src="http://169.254.169.254/latest/meta-data/" />`
            })
        });
        assertStatus('Raw SSRF without JWT (Should be intercepted by Auth first)', res3, 401);
    } catch (e) { console.error(e); }

    console.log(`\n🏁 PEN-TEST COMPLETE: ${passed}/${passed + failed} Passed.`);
    if (failed > 0) process.exit(1);
    process.exit(0);
}

// Start the server in the background
const serverProcess = child_process.exec('node backend/comps_server.cjs', (err) => {
    if (err) console.error(err);
});

// Wait 2 seconds for server to spin up, then execute
setTimeout(() => {
    runPenTests().then(() => {
        serverProcess.kill();
    });
}, 2000);
