const http = require('http');

const authHeader = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || 'simulated-token-for-local-testing'}`;

function makeRequest(path, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log("==========================================");
    console.log("🚀 STARTING DIRECT AI GATEWAY INTEGRATION TEST");
    console.log("==========================================");

    try {
        console.log("\n[1] Testing Deal Intelligence Gateway...");
        const dealRes = await makeRequest('/api/ai/analyze-deal', {
            id: 'test-deal-123',
            address: '123 Validation St, Dallas TX',
            arv: 350000,
            mao: 250000,
            rehab: 20000
        });
        console.log("Status:", dealRes.status, "Response:", dealRes.data);

        console.log("\n[2] Testing OSCAR Conversational Gateway...");
        const oscarRes = await makeRequest('/api/ai/oscar', {
            message: "Explain the BRRRR method briefly.",
            contextContext: "Running local backend tests."
        });
        console.log("Status:", oscarRes.status, "Response:", oscarRes.data);

        console.log("\n[3] Testing Document Extraction Queueing...");
        const docRes = await makeRequest('/api/ai/extract-document', {
            documentText: "Purchase agreement for 456 Mockingbird Ln. Seller: Jane Smith. Buyer: InvestCo. Price: $200k. Closing Date: Oct 1st.",
            documentType: "PURCHASE_AGREEMENT"
        });
        console.log("Status:", docRes.status, "Response:", docRes.data);

    } catch (e) {
        console.error("\n❌ TEST FAILED:", e);
    }
}

runTests();
