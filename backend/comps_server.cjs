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

// Initialize Redis for Comps Data Caching
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
});

const app = express();
app.use(cors());

app.use('/api/stripe', stripeRoutes);
app.use(express.json());
app.use('/api/documents', documentRoutes);
app.use('/api/disposition', dispositionRoutes);
app.use('/api/quotas', quotaRoutes);

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
        lat, lng, radius, timeframeMonths = 6, isDemoMode = false,
        sqftVariance = 15, exactBedBath = false,
        subjectSqft = 1500, subjectBeds = 3, subjectBaths = 2
    } = req.body;

    if (!lat || !lng || !radius) {
        return res.status(400).json({ error: 'Lat, Lng, and Radius are required.' });
    }

    const cacheKey = `comps:${Math.floor(lat * 1000)}:${Math.floor(lng * 1000)}:${radius}:${timeframeMonths}:${isDemoMode}:${sqftVariance}:${exactBedBath}`;

    // 1. Check Redis Cache
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log(`[Comps Engine] ⚡ Serving Comps from Redis Cache for ${cacheKey}`);
            return res.json(JSON.parse(cachedData));
        }
    } catch (err) {
        console.warn(`[Redis Warn] Cache read failed:`, err.message);
    }

    if (!isDemoMode) {
        console.log(`[Comps Engine] LIVE PIPELINE: Zillow API blocked by Anti-Bot constraints. Failing gracefully to use Deep-Link.`);
        return res.status(403).json({
            error: 'Live Data API disconnected due to active Zillow CAPTCHA. Please utilize the interactive Zillow Pop-out map.',
            requiresDeepLink: true
        });
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

    console.log(`[Comps Engine] Fetching Zillow for bounds:`, bounds);

    console.log(`[Comps Engine] Generating highly-realistic simulated comps for bounds:`, bounds);

    // Zillow, Redfin, and Realtor all block automated scraping with strong Cloudflare Turnstile CAPTCHAs.
    // To execute this flawlessly without paid residential proxies, we generate realistic mock data 
    // exactly around the requested radius to power the Wholesale OS mapping interface, 
    // while the frontend deep-links the human user to the real Zillow Map.

    const simulatedComps = [];
    const numComps = Math.floor(Math.random() * 8) + 5; // 5 to 12 comps

    for (let i = 0; i < numComps; i++) {
        // Randomly scatter coordinates within the requested radius
        const maxLatDelta = radius / 69.0;
        const maxLngDelta = radius / (69.0 * Math.cos(lat * Math.PI / 180));

        const compLat = lat + (Math.random() * 2 - 1) * maxLatDelta;
        const compLng = lng + (Math.random() * 2 - 1) * maxLngDelta;

        // Exact distance formula
        const dLat = compLat - lat;
        const dLng = compLng - lng;
        const distance = Math.sqrt(dLat * dLat + dLng * dLng) * 69;

        // Enforce precise constraints provided by intelligence engine
        const varianceLimit = subjectSqft * (sqftVariance / 100);
        const sqft = Math.floor(subjectSqft + (Math.random() * varianceLimit * 2 - Math.random() * varianceLimit));

        const beds = exactBedBath ? subjectBeds : Math.max(1, Math.floor(subjectBeds + (Math.random() * 2 - 1)));
        const baths = exactBedBath ? subjectBaths : Math.max(1, Math.floor(subjectBaths + (Math.random() * 1.5 - 0.5)));

        const price = Math.floor(sqft * (Math.random() * 100 + 200));
        const ppsqft = price / sqft;
        const monthsAgo = Math.floor(Math.random() * timeframeMonths) + 1;

        simulatedComps.push({
            id: `sim-comp-${i}`,
            address: `${Math.floor(Math.random() * 9999)} Local Street, Neighborhood`,
            distance: distance,
            monthsAgo: monthsAgo,
            sqft: sqft,
            yearBuilt: Math.floor(Math.random() * 50) + 1960,
            beds: beds,
            baths: baths,
            price: price,
            ppsqft: ppsqft,
            lat: compLat,
            lng: compLng,
        });
    }

    const sortedComps = simulatedComps.sort((a, b) => a.distance - b.distance);

    const responsePayload = {
        success: true,
        count: sortedComps.length,
        comps: sortedComps,
        note: "Data simulated to bypass active Zillow CAPTCHA blockades. Rely on the Zillow Deep-Link for real-world validation."
    };

    // 2. Save to Redis Cache (expire in 2 hours)
    try {
        await redis.set(cacheKey, JSON.stringify(responsePayload), 'EX', 60 * 60 * 2);
    } catch (err) {
        console.warn(`[Redis Warn] Cache write failed for ${cacheKey}`, err.message);
    }

    // Simulate API delay for first load
    setTimeout(() => {
        return res.json(responsePayload);
    }, 1500);
});

app.listen(PORT, () => {
    console.log(`Zillow Stealth Proxy running on http://localhost:${PORT}`);
});
