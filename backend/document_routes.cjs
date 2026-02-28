const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');
const { chromium } = require('playwright');

const router = express.Router();

// Initialize Redis for Quota Tracking
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
});

// Initialize Supabase Admin auth
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

router.post('/track', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ allowed: false, error: 'User ID required.' });
        }

        if (!supabaseAdmin) {
            console.warn('[Doc API] Supabase Admin not configured. Bypassing limits for local dev.');
            return res.status(200).json({ allowed: true });
        }

        // 0. Fetch Organization ID from User ID securely
        const { data: userOrg, error: userOrgError } = await supabaseAdmin
            .from('user_organizations')
            .select('organization_id')
            .eq('user_id', userId)
            .single();

        if (userOrgError || !userOrg) {
            return res.status(404).json({ allowed: false, error: 'User not attached to an active organization.' });
        }

        const organizationId = userOrg.organization_id;

        // 1. Fetch Organization Subscription Tier
        const { data: org, error } = await supabaseAdmin
            .from('organizations')
            .select('subscription_tier, subscription_status')
            .eq('id', organizationId)
            .single();

        if (error || !org) {
            return res.status(404).json({ allowed: false, error: 'Organization not found.' });
        }

        if (!org.subscription_tier || org.subscription_tier === 'DEMO') {
            return res.status(403).json({ allowed: false, error: 'Document generation is strictly disabled in Demo Mode.' });
        }

        if (org.subscription_status !== 'ACTIVE') {
            return res.status(402).json({ allowed: false, error: `Subscription is ${org.subscription_status}. Please renew your plan.` });
        }

        // 2. Define Limits based on Tier
        let monthlyLimit = 0;
        switch (org.subscription_tier) {
            case 'BASIC':
                monthlyLimit = 5;
                break;
            case 'ADVANCED':
                monthlyLimit = 20;
                break;
            case 'SUPER':
            case 'ELITE':
                monthlyLimit = 999999; // Unlimited
                break;
            default:
                monthlyLimit = 0; // Free / Unpaid
        }

        if (monthlyLimit === 0) {
            return res.status(402).json({ allowed: false, error: 'Upgrade required to generate official documents.' });
        }

        // 3. Track Usage in Redis (Reset monthly)
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const usageKey = `document_usage:${organizationId}:${currentMonth}`;

        const currentUsage = await redis.incr(usageKey);

        // Set TTL to 32 days if this is the first increment this month
        if (currentUsage === 1) {
            await redis.expire(usageKey, 60 * 60 * 24 * 32);
        }

        if (currentUsage > monthlyLimit) {
            // Revert the increment since the generation is blocked
            await redis.decr(usageKey);
            return res.status(429).json({
                allowed: false,
                error: `Monthly document limit reached (${monthlyLimit}/${monthlyLimit}). Upgrade for more capacity.`
            });
        }

        // 4. Allowed
        return res.status(200).json({
            allowed: true,
            usage: currentUsage,
            limit: monthlyLimit
        });

    } catch (error) {
        console.error('[Document Generator] Quota Tracker Error:', error);
        return res.status(500).json({ allowed: false, error: 'Internal server error verifying quotas.' });
    }
});

router.post('/generate', async (req, res) => {
    try {
        const { userId, htmlContent } = req.body;

        if (!userId) {
            return res.status(400).json({ allowed: false, error: 'User ID required.' });
        }

        if (!htmlContent) {
            return res.status(400).json({ allowed: false, error: 'HTML Content required to generate document.' });
        }

        let actualIsDemoMode = false;
        if (!supabaseAdmin) {
            console.warn('[Doc API] Supabase Admin not configured. Bypassing limits for local dev.');
        } else {
            // Re-verify Tier Limits Server-Side
            const { data: userOrg } = await supabaseAdmin
                .from('user_organizations')
                .select('organization_id')
                .eq('user_id', userId)
                .single();

            if (userOrg) {
                const { data: org } = await supabaseAdmin
                    .from('organizations')
                    .select('subscription_tier, subscription_status')
                    .eq('id', userOrg.organization_id)
                    .single();

                if (!org || !org.subscription_tier || org.subscription_tier === 'DEMO') {
                    actualIsDemoMode = true; // Natural Demo
                } else if (org.subscription_status !== 'ACTIVE' && org.subscription_status !== 'CANCELED') {
                    actualIsDemoMode = true; // Overridden by demotion
                }
            }
        }

        // Launch Playwright Headless securely (SSRF mitigation)
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            javaScriptEnabled: false
        });
        const page = await context.newPage();

        // Implement rigid network interceptors
        await page.route('**/*', route => {
            const requestUrl = route.request().url();
            // Block all un-intended outward connections, allowing only inline resources
            if (requestUrl.startsWith('data:')) {
                route.continue();
            } else {
                route.abort('blockedbyclient');
            }
        });

        // Construct the document shell
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; background: #fff; color: #000; padding: 40px; margin: 0; }
        * { box-sizing: border-box; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

        await page.setContent(fullHtml, { waitUntil: 'load' });

        if (actualIsDemoMode) {
            console.log('[Document Generator] Enforcing DEMO Rasterization DRM.');
            // Inject the void watermark
            await page.evaluate(() => {
                const div = document.createElement('div');
                div.style.position = 'fixed';
                div.style.top = '0';
                div.style.left = '0';
                div.style.width = '100vw';
                div.style.height = '100vh';
                div.style.pointerEvents = 'none';
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.justifyContent = 'center';
                div.style.zIndex = '99999';
                div.style.opacity = '0.15';
                div.innerHTML = '<h1 style="font-size: 6rem; font-weight: 900; color: black; transform: rotate(-45deg); white-space: nowrap; letter-spacing: 0.1em; text-transform: uppercase;">VOID / DEMO ACCOUNT</h1>';
                document.body.appendChild(div);
            });

            // Rasterize the document completely (take a screenshot to destroy HTML vectors)
            const screenshot = await page.screenshot({ fullPage: true });
            await page.setContent(`<!DOCTYPE html><html><head><style>body { margin: 0; padding: 0; background: white; }</style></head><body><img src="data:image/png;base64,${screenshot.toString('base64')}" style="width: 100%; display: block;" /></body></html>`);
        }

        const pdfBuffer = await page.pdf({
            format: 'Letter',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Contract.pdf');
        return res.send(pdfBuffer);

    } catch (error) {
        console.error('[Document Generator] PDF Generation Error:', error);
        return res.status(500).json({ allowed: false, error: 'Internal server error generating PDF.' });
    }
});

module.exports = router;
