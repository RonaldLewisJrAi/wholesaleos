const { Queue, Worker } = require('bullmq');
const { executeAIQuery } = require('../ai/vertexClient.cjs');
const { checkTokenBudget, saveToCache, logAIUsage } = require('../ai/aiUsageService.cjs');
const { workerLogger } = require('../logging/logger.cjs');
const Redis = require('ioredis');

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
});

// Create the unified background AI Queue
const aiQueue = new Queue('AI_Analysis_Queue', { connection: redisConnection });

/**
 * High Priority: OSCAR queries, Interactive Deal Analysis (1)
 * Medium Priority: Document Extraction (5)
 * Low Priority: Radar insights, Batch processing (10)
 */
const enqueueAITask = async (taskType, payload, priorityLevel = 5) => {
    return await aiQueue.add(taskType, payload, {
        priority: priorityLevel,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
    });
};

// ==========================================================
// WORKER EXECUTION DAEMON
// ==========================================================
const aiWorker = new Worker('AI_Analysis_Queue', async job => {
    workerLogger.debug(`Processing worker job`, { jobId: job.id, type: job.name });
    const { payload, organizationId, userId } = job.data;

    try {
        // Enforce Token Budgets inside the worker
        const budget = await checkTokenBudget(organizationId, job.name);
        if (!budget.allowed) {
            workerLogger.warn(`Job Rejected: Budget Exceeded`, { jobId: job.id, expectedQueue: job.name, reason: budget.reason });
            // Let the job fail permanently, do not retry
            throw new Error(`Quota Exceeded: ${budget.reason}`);
        }

        switch (job.name) {
            case 'document_extraction':
                return await handleDocumentExtraction(payload, organizationId, userId);
            case 'radar_market_insight':
                return await handleRadarInsightGeneration(payload, organizationId, userId);
            default:
                throw new Error(`Unknown AI Task Type: ${job.name}`);
        }

    } catch (error) {
        workerLogger.error(`Worker execution failed`, { jobId: job.id, error: error.message, stack: error.stack });
        throw error;
    }

}, { connection: redisConnection });

aiWorker.on('completed', (job) => {
    workerLogger.info(`Job Completed successfully`, { jobId: job.id });
});

aiWorker.on('failed', (job, err) => {
    workerLogger.error(`Job Failed hook triggered`, { jobId: job.id, error: err.message });
});

// ==========================================================
// TASK HANDLERS
// ==========================================================
async function handleDocumentExtraction(payload, organizationId, userId) {
    const { documentText, documentType } = payload;

    const prompt = `You are a Real Estate Contract Parser.
Extract the following from this ${documentType || 'Legal Document'}: 
Address, Seller Name, Buyer Name, Purchase Price, Closing Date.
Return strictly as JSON with keys: "address", "seller", "buyer", "purchasePrice", "closingDate".
If a field is not found, return null.

Document Text:
${documentText.substring(0, 5000)}`;

    const response = await executeAIQuery(prompt, false);
    if (!response.success) throw new Error("Vertex Model Failed to Extract");

    const extractedData = JSON.parse(response.text);

    // Cache permanently for this document hash
    await saveToCache('document_ai', payload, extractedData);
    await logAIUsage(userId, organizationId, 'Document AI', response.modelUsed, response.usage.inputTokens, response.usage.outputTokens);

    return extractedData;
}

async function handleRadarInsightGeneration(payload, organizationId, userId) {
    const { recentEvents, market } = payload;

    // Needs complex reasoning to spot trends across hundreds of events
    const prompt = `You are a Wholesale Real Estate Market Analyst.
Analyze these recent platform events for the ${market} market and generate a concise 2-sentence market intelligence insight summarizing investor demand and deal velocity.
Events: ${JSON.stringify(recentEvents)}`;

    // Utilizing PRO model for complex analytical correlation
    const response = await executeAIQuery(prompt, true);
    if (!response.success) throw new Error("Vertex Model Failed Insight Generation");

    // Cache insights for 6 hours
    await saveToCache('radar_insight', payload, { insight: response.text });
    await logAIUsage(userId, organizationId, 'Radar AI', response.modelUsed, response.usage.inputTokens, response.usage.outputTokens);

    return { insight: response.text };
}

module.exports = {
    enqueueAITask,
    aiQueue
};
