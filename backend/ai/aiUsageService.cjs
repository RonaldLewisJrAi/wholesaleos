const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { aiLogger } = require('./logging/logger.cjs');

// Initialize a backend-only admin client to bypass RLS and read quotas securely
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TIER_LIMITS = {
    'BASIC': {
        requests: 200,
        tokens: 200000,
        allowedFeatures: ['Academy Mentor', 'OSCAR Chat', 'Basic Deal Explanation']
    },
    'PRO': {
        requests: 2000,
        tokens: 2000000,
        allowedFeatures: ['Academy Mentor', 'OSCAR Chat', 'Basic Deal Explanation', 'Deal Intelligence', 'Document AI', 'Radar AI', 'Investor Match']
    },
    'SUPER': {
        requests: 10000,
        tokens: 10000000,
        allowedFeatures: ['ALL']
    }
};

const CACHE_TTL = {
    'deal_analysis': 30 * 24 * 60 * 60 * 1000, // 30 Days
    'radar_insight': 6 * 60 * 60 * 1000, // 6 Hours
    'document_ai': null // Permanent
};

/**
 * Validates the user's organization quota against their current subscription tier.
 */
const checkTokenBudget = async (organizationId, featureName) => {
    try {
        // 1. Fetch Organization Tier
        const { data: org, error: orgErr } = await supabaseAdmin
            .from('organizations')
            .select('subscription_plan')
            .eq('id', organizationId)
            .single();

        if (orgErr || !org) return { allowed: false, error: "Organization not found." };

        const currentTier = org.subscription_plan?.toUpperCase() || 'BASIC';
        const limits = TIER_LIMITS[currentTier] || TIER_LIMITS['BASIC'];

        // 2. Map Professional renamed tier backwards if needed
        if (currentTier === 'PROFESSIONAL' && !TIER_LIMITS['PROFESSIONAL']) {
            Object.assign(limits, TIER_LIMITS['PRO']); // Bridge from previous phase rename
        }

        // 3. Check Feature Flags
        if (!limits.allowedFeatures.includes('ALL') && !limits.allowedFeatures.includes(featureName)) {
            aiLogger.warn('AI Budget Check Failed: Feature not allowed on current tier', { organizationId, currentTier, featureName });
            return {
                allowed: false,
                reason: `The '${featureName}' feature requires a higher subscription tier. Upgrade your plan to access this AI capability.`
            };
        }

        // 4. Calculate current month usage
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: usageData, error: usageErr } = await supabaseAdmin
            .from('ai_usage')
            .select('tokens_total, id')
            .eq('organization_id', organizationId)
            .gte('created_at', startOfMonth.toISOString());

        if (usageErr) return { allowed: false, error: "Failed to read AI telemetry." };

        const currentRequests = usageData.length;
        const currentTokens = usageData.reduce((acc, row) => acc + row.tokens_total, 0);

        // 5. Assert budget
        if (currentTokens >= limits.tokens || currentRequests >= limits.requests) {
            aiLogger.warn('AI Budget Check Failed: Quota exceeded', { organizationId, currentTier, currentRequests, currentTokens, limitRequests: limits.requests, limitTokens: limits.tokens });
            return {
                allowed: false,
                reason: `AI usage limit reached for your subscription tier (${currentRequests}/${limits.requests} reqs, ${currentTokens}/${limits.tokens} tokens). Upgrade your plan to continue using advanced AI features.`
            };
        }

        return { allowed: true, remainingTokens: limits.tokens - currentTokens };

    } catch (err) {
        aiLogger.error("AI Budget check failed", { error: err.message, stack: err.stack, organizationId });
        return { allowed: false, error: "Internal telemetry verification error." };
    }
};

/**
 * Generates an SHA-256 hash of the input object to use as a cache lookup key.
 */
const generateInputHash = (inputPayload) => {
    return crypto.createHash('sha256').update(JSON.stringify(inputPayload)).digest('hex');
};

/**
 * Checks the ai_cache table for a valid, non-expired response.
 */
const checkCache = async (featureName, inputPayload) => {
    const inputHash = generateInputHash(inputPayload);

    const { data, error } = await supabaseAdmin
        .from('ai_cache')
        .select('output, expires_at')
        .eq('feature', featureName)
        .eq('input_hash', inputHash)
        .single();

    if (error || !data) return null; // Cache miss

    // Check expiration if TTL exists
    if (data.expires_at) {
        const now = new Date();
        const expires = new Date(data.expires_at);
        if (now > expires) {
            aiLogger.debug('AI Cache expired', { featureName, inputHash, expiresAt: data.expires_at });
            // Delete expired row asynchronously and return cache miss
            supabaseAdmin.from('ai_cache').delete().eq('feature', featureName).eq('input_hash', inputHash).then();
            return null;
        }
    }

    aiLogger.info('AI Cache hit', { featureName, inputHash });
    return data.output; // Cache hit
};

/**
 * Saves a generative AI payload into the cache.
 */
const saveToCache = async (featureName, inputPayload, outputJSON) => {
    const inputHash = generateInputHash(inputPayload);
    const ttlMs = CACHE_TTL[featureName];

    let expiresAt = null;
    if (ttlMs) {
        expiresAt = new Date(Date.now() + ttlMs).toISOString();
    }

    await supabaseAdmin
        .from('ai_cache')
        .upsert({
            cache_key: `${featureName}-${inputHash.substring(0, 8)}`,
            feature: featureName,
            input_hash: inputHash,
            output: outputJSON,
            expires_at: expiresAt
        }, { onConflict: 'feature, input_hash' });
};

/**
 * Writes the billing tokens directly to the ai_usage table.
 */
const logAIUsage = async (userId, organizationId, featureName, model, tokensInput, tokensOutput) => {
    // Arbitrary internal cost metric for dashboards (e.g. Gem-Flash 0.075 / 1M)
    const COST_PER_1M_INPUT = model.includes('pro') ? 1.25 : 0.075;
    const COST_PER_1M_OUTPUT = model.includes('pro') ? 5.00 : 0.30;

    const estimatedCost = ((tokensInput / 1000000) * COST_PER_1M_INPUT) + ((tokensOutput / 1000000) * COST_PER_1M_OUTPUT);

    aiLogger.debug('Logging AI telemetry', { organizationId, featureName, model, tokensTotal: tokensInput + tokensOutput, estimatedCost });

    await supabaseAdmin.from('ai_usage').insert({
        user_id: userId,
        organization_id: organizationId,
        feature: featureName,
        model: model,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        tokens_total: tokensInput + tokensOutput,
        cost_estimate: estimatedCost
    });
};

module.exports = {
    checkTokenBudget,
    checkCache,
    saveToCache,
    logAIUsage
};
