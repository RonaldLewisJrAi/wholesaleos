const { VertexAI } = require('@google-cloud/vertexai');
const { aiLogger } = require('../logging/logger.cjs');

// Initialize Vertex with the project context
const vertex_ai = new VertexAI({
    project: process.env.GCP_PROJECT || 'wholesaleos-production', // Fallback or dynamic
    location: 'us-central1'
});

// Primary default model for high-speed, cost-effective operations
const geminiFlash = vertex_ai.preview.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.1, // Low temperature for consistent deterministic formatting
    },
});

// Fallback or explicit model for highly complex reasoning tasks
const geminiPro = vertex_ai.preview.getGenerativeModel({
    model: 'gemini-2.0-pro-exp-02-05',
    generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.2, // Slightly higher for reasoning
    },
});

/**
 * Executes a prompt against Vertex AI with exponential backoff retry logic.
 * @param {string} prompt The text prompt to send to the model
 * @param {boolean} usePro Whether to explicitly force the Pro model (default: Flash)
 * @param {number} maxRetries Maximum number of retries (default: 3)
 */
const executeAIQuery = async (prompt, usePro = false, maxRetries = 3) => {
    const model = usePro ? geminiPro : geminiFlash;
    let attempt = 0;
    const delays = [500, 1000, 2000]; // 500ms, 1s, 2s backoff

    while (attempt <= maxRetries) {
        try {
            const req = {
                contents: [
                    { role: 'user', parts: [{ text: prompt }] }
                ],
            };

            aiLogger.debug(`AI request initiated (${model.model})`, { attempt });

            const streamingResp = await model.generateContentStream(req);
            let fullText = '';
            for await (const chunk of streamingResp.stream) {
                if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content && chunk.candidates[0].content.parts[0]) {
                    fullText += chunk.candidates[0].content.parts[0].text;
                }
            }

            const aggregatedResponse = await streamingResp.response;

            // Extract Token Usage telemetry directly from the API response
            const tokenUsage = aggregatedResponse.usageMetadata || {
                promptTokenCount: 0,
                candidatesTokenCount: 0,
                totalTokenCount: 0
            };

            aiLogger.info(`AI request completed successfully`, {
                model: usePro ? 'gemini-2.0-pro' : 'gemini-2.0-flash',
                tokens: tokenUsage.totalTokenCount,
                attempt
            });

            return {
                success: true,
                text: fullText.trim(),
                usage: {
                    inputTokens: tokenUsage.promptTokenCount || 0,
                    outputTokens: tokenUsage.candidatesTokenCount || 0,
                    totalTokens: tokenUsage.totalTokenCount || 0
                },
                modelUsed: usePro ? 'gemini-2.0-pro' : 'gemini-2.0-flash'
            };

        } catch (error) {
            aiLogger.warn(`Vertex AI Retry Attempt ${attempt + 1}/${maxRetries} Failed`, { error: error.message });
            if (attempt === maxRetries) {
                aiLogger.error("Vertex AI Explicit Failure", { error: error.message, stack: error.stack });
                return {
                    success: false,
                    error: `Vertex AI explicitly failed after ${maxRetries} retries: ${error.message}`,
                    fallbackTriggered: true
                };
            }

            // Wait for exponential backoff duration
            await new Promise(resolve => setTimeout(resolve, delays[attempt]));
            attempt++;
        }
    }
};

module.exports = {
    vertex_ai,
    geminiFlash,
    geminiPro,
    executeAIQuery
};
