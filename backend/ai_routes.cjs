const express = require('express');
const router = express.Router();
const { checkTokenBudget, checkCache, saveToCache, logAIUsage } = require('./ai/aiUsageService.cjs');
const { executeAIQuery } = require('./ai/vertexClient.cjs');
const { enqueueAITask } = require('./workers/aiAnalysisWorker.cjs');

// Mock Authentication Middleware (Replace with actual JWT verification in production)
const verifyToken = (req, res, next) => {
    // If running from the internal test script, bypass JWT extraction
    if (req.headers.authorization && req.headers.authorization.includes('eyJhbGciOiJIUz')) {
        req.user = { id: 'test-user', organization_id: 'test-org', role: 'GLOBAL_SUPER_ADMIN' };
    } else {
        req.user = req.user || { id: 'test-user', organization_id: 'test-org', role: 'GLOBAL_SUPER_ADMIN' };
    }
    next();
};

/**
 * Deal Intelligence AI 
 * Evaluates wholesaling opportunities based on ARV, repairs, and purchase price.
 */
router.post('/analyze-deal', verifyToken, async (req, res) => {
    try {
        const { organization_id, id: user_id } = req.user;
        const dealData = req.body;

        // 1. Enforce Token & Feature Tier Budget (Pro / Super)
        const budget = await checkTokenBudget(organization_id, 'Deal Intelligence');
        if (!budget.allowed) {
            return res.status(403).json({ error: budget.reason });
        }

        // 2. Check Cache
        const cached = await checkCache('deal_analysis', dealData);
        if (cached) {
            return res.json({ source: 'cache', data: cached });
        }

        // 3. Construct Prompt Engineered payload
        const prompt = `You are a strict Deal Intelligence Engine for a real estate wholesaling platform. 
Examine the following numbers: ARV ($${dealData.arv}), Purchase Price ($${dealData.purchasePrice}), Repairs Estimate ($${dealData.repairs}).
Return a valid JSON string (NO markdown blocks, just raw JSON) containing exactly these 4 keys:
"dealScore" (1-100), "liquidity" ("HIGH", "MODERATE", "LOW"), "closeProbability" (0-100), "suggestedFee" (string, e.g. "$10k-$15k").`;

        // 4. Force Gemini 2.0 Flash to save Tokens
        const response = await executeAIQuery(prompt, false);

        if (!response.success) {
            return res.status(500).json({ error: response.error });
        }

        // 5. Parse, Cache & Log
        const parsedOutput = JSON.parse(response.text);
        await saveToCache('deal_analysis', dealData, parsedOutput);
        await logAIUsage(user_id, organization_id, 'Deal Intelligence', response.modelUsed, response.usage.inputTokens, response.usage.outputTokens);

        return res.json({ source: 'vertex', data: parsedOutput });

    } catch (error) {
        console.error("Deal Analysis Gateway Failed:", error);
        res.status(500).json({ error: "Failed to process AI Deal Evaluation." });
    }
});

/**
 * OSCAR Conversational Assistant
 * General platform Q&A and academy mentoring.
 */
router.post('/oscar', verifyToken, async (req, res) => {
    try {
        const { organization_id, id: user_id } = req.user;
        const { message, contextContext, history } = req.body;

        // 1. Enforce Token & Feature Tier Budget (Basic / Pro / Super)
        const budget = await checkTokenBudget(organization_id, 'OSCAR Chat');
        if (!budget.allowed) {
            return res.status(403).json({ error: budget.reason });
        }

        // 2. Construct Prompt Engineered payload
        const prompt = `You are OSCAR (Operational System Conversational AI Resource) inside WholesaleOS.
The user is asking: "${message}".
Context mode: ${contextContext || 'General Platform Help'}.
Keep your responses helpful, concise, and focused strictly on Real Estate Wholesaling or WholesaleOS platform usage. Do not answer questions outside of this scope. Use Markdown.`;

        // 3. Force Gemini 2.0 Flash
        const response = await executeAIQuery(prompt, false);

        if (!response.success) {
            return res.status(500).json({ error: response.error });
        }

        // 4. Log (OSCAR is highly conversational, caching is generally not useful here)
        await logAIUsage(user_id, organization_id, 'OSCAR Chat', response.modelUsed, response.usage.inputTokens, response.usage.outputTokens);

        return res.json({ source: 'vertex', text: response.text });

    } catch (error) {
        console.error("OSCAR Gateway Failed:", error);
        res.status(500).json({ error: "OSCAR failed to generate a response." });
    }
});

/**
 * Document Intelligence Extraction
 * Dispatches an asynchronous BullMQ task to extract structured data from OCR text.
 */
router.post('/extract-document', verifyToken, async (req, res) => {
    try {
        const { organization_id, id: user_id } = req.user;
        const payload = req.body;

        const budget = await checkTokenBudget(organization_id, 'Document AI');
        if (!budget.allowed) return res.status(403).json({ error: budget.reason });

        const cached = await checkCache('document_ai', payload);
        if (cached) return res.json({ source: 'cache', data: cached });

        // Enqueue as Medium Priority (5)
        const job = await enqueueAITask('document_extraction', payload, 5);

        return res.json({ source: 'queue', jobId: job.id, message: 'Document extraction queued.' });
    } catch (error) {
        console.error("Document Gateway Failed:", error);
        res.status(500).json({ error: "Failed to queue Document Extraction." });
    }
});

/**
 * Radar Insight Generator
 * Dispatches a backend generative sweep across recent deal events to identify market velocity.
 */
router.post('/radar-insight', verifyToken, async (req, res) => {
    try {
        const { organization_id, id: user_id } = req.user;
        const payload = req.body;

        const budget = await checkTokenBudget(organization_id, 'Radar AI');
        if (!budget.allowed) return res.status(403).json({ error: budget.reason });

        const cached = await checkCache('radar_insight', payload);
        if (cached) return res.json({ source: 'cache', data: cached });

        // Enqueue as Low Priority (10) to protect user-facing chats
        const job = await enqueueAITask('radar_market_insight', payload, 10);

        return res.json({ source: 'queue', jobId: job.id, message: 'Radar analysis queued.' });
    } catch (error) {
        console.error("Radar Gateway Failed:", error);
        res.status(500).json({ error: "Failed to queue Radar Market Analysis." });
    }
});

module.exports = router;
