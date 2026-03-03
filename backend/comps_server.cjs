const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default || require('rate-limit-redis');
const Redis = require('ioredis');
const stripeRoutes = require('./stripe_routes.cjs');
const documentRoutes = require('./document_routes.cjs');
const dispositionRoutes = require('./disposition_routes.cjs');
const quotaRoutes = require('./quota_routes.cjs');
const apiKeysRoutes = require('./api_keys_routes.cjs');
const subscriptionRoutes = require('./subscription_routes.cjs');
const { createClient } = require('@supabase/supabase-js');

// Initialize Redis for Comps Data Caching
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
});

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// =========================================================================================
// PHASE 33.1: GLOBAL WRITE-BLOCKING & GLOBAL_SUPER_ADMIN ENFORCEMENT
// =========================================================================================
const requireSubscription = async (req, res, next) => {
    if (req.method === 'GET' || req.method === 'OPTIONS') return next();

    let userId = null;
    let token = null;

    // 1. Try to extract Bearer token from headers
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else {
        return res.status(401).json({ allowed: false, error: 'Unauthorized: Missing Bearer token in headers.' });
    }

    if (!supabaseAdmin) return next();

    try {
        // 2. Cryptographically verify the JWT to ensure it wasn't forged
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            console.error('[SECURITY] JWT Validation Failed:', authError?.message);
            return res.status(401).json({ allowed: false, error: 'Unauthorized: Invalid or expired token.' });
        }

        userId = user.id;

        // 3. Force the payload userId to match the verified token owner (prevents IDOR)
        if (req.body && typeof req.body === 'object') {
            req.body.userId = userId;
        }
        req.user = user;

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('system_role, primary_persona')
            .eq('id', userId)
            .single();

        if (profile) {
            req.primaryPersona = profile.primary_persona; // Retained for consistency, assuming instruction snippet was incomplete
            // 2. Global Super Admin Bypass
            if (profile.system_role === 'GLOBAL_SUPER_ADMIN') {
                req.user = { id: userId, role: 'GLOBAL_SUPER_ADMIN', bypassAll: true }; // Changed 'uid' to 'userId'
                return next();
            }
        }

        const { data: userOrg } = await supabaseAdmin
            .from('user_organizations')
            .select('organization_id')
            .eq('user_id', userId)
            .single();

        if (userOrg) {
            req.userOrg = userOrg;

            const { data: org } = await supabaseAdmin
                .from('organizations')
                .select('subscription_status, subscription_tier')
                .eq('id', userOrg.organization_id)
                .single();

            if (org) {
                req.organization = org;
                const restrictedStatuses = ['PAST_DUE', 'TERMINATED', 'CANCELED', 'PAUSED'];
                if (restrictedStatuses.includes(org.subscription_status)) {
                    // Telemetry
                    try {
                        await supabaseAdmin.from('system_logs').insert({
                            organization_id: userOrg.organization_id,
                            user_id: userId,
                            log_type: 'SECURITY',
                            source: 'API_GATEWAY',
                            message: `BLOCKED 403 Action to ${req.originalUrl} - Subscription: ${org.subscription_status}`
                        });
                    } catch (e) {
                        console.error('[SecTelemetry] Failed to record 403 block', e);
                    }

                    return res.status(403).json({
                        allowed: false,
                        error: `Action blocked. Account status is ${org.subscription_status}. Please update your billing information to restore write access.`
                    });
                }
            }
        }
    } catch (err) {
        console.error('[Auth Guard Error]', err);
    }
    next();
};

const app = express();
app.use(cors());

app.use('/api/stripe', stripeRoutes); // Mounted before express.json() to capture raw webhooks safely
app.use(express.json());

// Apply Write-Blocking Middleware
app.use('/api/documents', requireSubscription, documentRoutes);
app.use('/api/disposition', requireSubscription, dispositionRoutes);
app.use('/api/keys', requireSubscription, apiKeysRoutes);
app.use('/api/comps', requireSubscription); // Will cascade to the /api/comps POST route below

app.use('/api/quotas', quotaRoutes);
app.use('/api/subscription', subscriptionRoutes); // Allowed to pass without restriction so users can resume billing

const PORT = 3001;

// General API Rate Limiter
const apiLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Helper to calculate lat/lng bounds for a given radius in miles
const getBounds = (lat, lng, radiusMiles) => {
    const latDelta = radiusMiles / 69.0;
    const lngDelta = radiusMiles / (69.0 * Math.cos(lat * Math.PI / 180));
    return {
        north: lat + latDelta,
        south: lat - latDelta,
        east: lng + lngDelta,
        west: lng - lngDelta
    };
};

// Apply rate limiter specifically to the expensive scraping endpoint
app.post('/api/comps', apiLimiter, async (req, res) => {
    const {
        lat, lng, radius, timeframeMonths = 6,
        sqftVariance = 15, exactBedBath = false,
        subjectSqft = 1500, subjectBeds = 3, subjectBaths = 2
    } = req.body;

    if (!lat || !lng || !radius) {
        return res.status(400).json({ error: 'Lat, Lng, and Radius are required.' });
    }

    const cacheKey = `comps:${Math.floor(lat * 1000)}:${Math.floor(lng * 1000)}:${radius}:${timeframeMonths}:${sqftVariance}:${exactBedBath}`;

    // 1. Strict Server-Side Tier Gating
    // req.organization is populated by the requireSubscription middleware
    if (req.user?.role !== 'GLOBAL_SUPER_ADMIN') {
        if (!req.organization || req.organization.subscription_status !== 'ACTIVE' || req.organization.subscription_tier === 'BASIC') {
            return res.status(403).json({
                error: "Comps Engine locked in DEMO tier. Upgrade to PRO to unlock live comp intelligence."
            });
        }
    }

    // 2. Check Redis Cache
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log(`[Comps Engine] ⚡ Serving Deep-Link from Redis Cache for ${cacheKey}`);
            return res.json(JSON.parse(cachedData));
        }
    } catch (err) {
        console.warn(`[Redis Warn] Cache read failed:`, err.message);
    }

    const bounds = getBounds(lat, lng, radius);

    // Zillow searchQueryState for recently sold
    const searchQueryState = {
        mapBounds: bounds,
        isMapVisible: true,
        filterState: {
            sortSelection: { value: 'globalrelevanceex' },
            isRecentlySold: { value: true },
            doz: { value: `${timeframeMonths}m` }
        },
        isListVisible: true
    };

    const targetUrl = `https://www.zillow.com/homes/recently_sold/?searchQueryState=${encodeURIComponent(JSON.stringify(searchQueryState))}`;

    console.log(`[Comps Engine] Generating Deterministic Deep-Link for bounds:`, bounds);

    const responsePayload = {
        success: true,
        requiresDeepLink: true,
        message: "Live Zillow scraping temporarily disabled. Click below to view live comps.",
        deepLinkUrl: targetUrl,
        comps: [] // Hard enforce empty array so frontend never renders fake data
    };

    // 3. Save to Redis Cache (expire in 2 hours)
    try {
        await redis.set(cacheKey, JSON.stringify(responsePayload), 'EX', 60 * 60 * 2);
    } catch (err) {
        console.warn(`[Redis Warn] Cache write failed for ${cacheKey}`, err.message);
    }

    return res.json(responsePayload);
});

app.listen(PORT, () => {
    console.log(`Zillow Stealth Proxy running on http://localhost:${PORT}`);
});
