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
const foreclosureRoutes = require('./foreclosure_routes.cjs');
const skiptraceRoutes = require('./skiptrace_routes.cjs');
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
app.use('/api/dealRadar/foreclosure-leads', requireSubscription, foreclosureRoutes);
app.use('/api/skiptrace', requireSubscription, skiptraceRoutes);
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

// =========================================================================================
// REAL ZILLOW PROPERTY SCRAPER (PHASE 40_2)
// Bypass DataDome via Stealth DuckDuckGo Snippet Parsing
// =========================================================================================
app.post('/api/properties/import-zillow', apiLimiter, requireSubscription, (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Zillow URL required.' });

    let address = 'Unknown Address';
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const homeDetailsIndex = pathParts.findIndex(p => p === 'homedetails');
        if (homeDetailsIndex !== -1 && pathParts.length > homeDetailsIndex + 1) {
            address = pathParts[homeDetailsIndex + 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    } catch (e) { }

    const searchQuery = encodeURIComponent(`site:zillow.com "${address}"`);
    const https = require('https');

    https.get(`https://html.duckduckgo.com/html/?q=${searchQuery}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        }
    }, (ddgRes) => {
        let data = '';
        ddgRes.on('data', chunk => data += chunk);
        ddgRes.on('end', () => {
            const snippets = data.match(/<a class="result__snippet[^>]*>(.*?)<\/a>/gi) || [];
            let price = 'Pending';
            let sqft = null;
            let beds = null;
            let baths = null;

            for (let s of snippets) {
                if (s.includes('$')) {
                    const priceMatch = s.match(/\$[\d,]+/);
                    if (priceMatch && price === 'Pending') price = priceMatch[0];
                }
                const bedMatch = s.match(/(\d+)\s+beds?/i);
                if (bedMatch && !beds) beds = bedMatch[1];

                const bathMatch = s.match(/(\d+)\s+baths?/i);
                if (bathMatch && !baths) baths = bathMatch[1];

                const sqftMatch = s.match(/((?:\d{1,3},)?\d{3})\s+sqft/i);
                if (sqftMatch && !sqft) sqft = sqftMatch[1];
            }

            const imgQuery = encodeURIComponent(`site:photos.zillowstatic.com ${address}`);
            https.get(`https://html.duckduckgo.com/html/?q=${imgQuery}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            }, (imgRes) => {
                let imgData = '';
                imgRes.on('data', chunk => imgData += chunk);
                imgRes.on('end', () => {
                    const zillowUrls = imgData.match(/(?:https:\/\/)?(?:www\.)?photos\.zillowstatic\.com[a-zA-Z0-9_/\-\.]+\.webp/g) || [];
                    const image = zillowUrls.length > 0 ? (zillowUrls[0].startsWith('http') ? zillowUrls[0] : 'https://' + zillowUrls[0]) : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';

                    res.json({ address, arv: price, beds, baths, sqft, image });
                });
            }).on('error', () => res.json({ address, arv: price, beds, baths, sqft, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' }));
        });
    }).on('error', (err) => {
        console.error('DDG Scrape Error:', err);
        res.status(500).json({ error: 'Failed to extract real Zillow metrics.' });
    });
});


app.listen(PORT, () => {
    console.log(`Zillow Stealth Proxy running on http://localhost:${PORT}`);
});
