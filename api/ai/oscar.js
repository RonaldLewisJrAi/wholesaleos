const { executeAIQuery } = require('../../backend/ai/vertexClient.cjs');
const { checkTokenBudget, logAIUsage } = require('../../backend/ai/aiUsageService.cjs');
const { aiLogger } = require('../../backend/logging/logger.cjs');

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // CORS Headers for safety
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log("[Vercel][OSCAR] Request received at /api/ai/oscar");

    try {
        // Mock Auth Extraction (replace with Supabase JWT in production if needed)
        // Vercel serverless doesn't have the Express middleware attached automatically
        const user_id = 'vercel-test-user';
        const organization_id = 'test-org';

        const { message, contextContext } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message payload is required." });
        }

        console.log(`[Vercel][OSCAR] Processing query: "${message}"`);
        aiLogger.debug("OSCAR Agent Invoked via Vercel", { organization_id, context: contextContext });

        // 1. Enforce Token & Feature Tier Budget
        try {
            const budget = await checkTokenBudget(organization_id, 'OSCAR Chat');
            if (!budget.allowed) {
                aiLogger.warn("OSCAR Quota Rejected", { organization_id, reason: budget.reason });
                return res.status(403).json({ error: budget.reason });
            }
        } catch (budgetErr) {
            console.warn("[Vercel][OSCAR] Budget check bypassed (Redis missing context):", budgetErr.message);
        }

        // 2. Construct Prompt Engineered payload
        const prompt = `You are OSCAR (Operational System Conversational AI Resource) inside WholesaleOS.
The user is asking: "${message}".
Context mode: ${contextContext || 'General Platform Help'}.
Keep your responses helpful, concise, and focused strictly on Real Estate Wholesaling or WholesaleOS platform usage. Do not answer questions outside of this scope. Use Markdown.`;

        // 3. Force Gemini 2.0 Flash
        console.log(`[Vercel][OSCAR] Pinging Google Vertex AI...`);
        const response = await executeAIQuery(prompt, false);

        if (!response.success) {
            console.error(`[Vercel][OSCAR] Vertex AI Failure:`, response.error);
            return res.status(500).json({ error: response.error });
        }

        // 4. Log usage metrics
        try {
            await logAIUsage(user_id, organization_id, 'OSCAR Chat', response.modelUsed, response.usage.inputTokens, response.usage.outputTokens);
        } catch (logErr) {
            console.warn("[Vercel][OSCAR] Telemetry weak fail:", logErr.message);
        }

        console.log(`[Vercel][OSCAR] Vertex AI Success. Sending response.`);
        return res.status(200).json({ source: 'vertex', text: response.text });

    } catch (error) {
        console.error("[Vercel][OSCAR] Serverless Gateway Failed:", error);
        aiLogger.error("OSCAR Serverless Gateway Failed", { error: error.message, stack: error.stack });
        res.status(500).json({ error: "OSCAR failed to generate a response." });
    }
}
