const { skipTraceLogger } = require('../logging/logger.cjs');

/**
 * OpenSkip API Lookup (Free Tier)
 */
async function openSkipLookup(ownerName, address, city, state) {
    try {
        const apiKey = process.env.OPENSKIP_API_KEY;
        if (!apiKey) {
            skipTraceLogger.warn('OPENSKIP_API_KEY is not set. Skipping OpenSkip provider.');
            return null;
        }

        const url = new URL('https://api.openskip.com/skiptrace');
        if (address) url.searchParams.append('address', address);
        if (city) url.searchParams.append('city', city);
        if (state) url.searchParams.append('state', state);

        skipTraceLogger.info(`[OpenSkip] Requesting: ${url.toString()}`);

        const response = await fetch(url.toString(), {
            headers: {
                "X-API-KEY": apiKey
            }
        });

        if (!response.ok) {
            skipTraceLogger.error('[OpenSkip] API Error', { status: response.status });
            return null;
        }

        const data = await response.json();

        const phones = (data.phones || []).map(p => ({ number: p, confidence: 80 }));
        const emails = (data.emails || []).map(e => ({ email: e, confidence: 80 }));

        if (phones.length === 0 && emails.length === 0) {
            return null;
        }

        return {
            phones,
            emails,
            provider: 'openskip'
        };
    } catch (err) {
        skipTraceLogger.error('[OpenSkip] Exception', { error: err.message });
        return null;
    }
}

/**
 * TruePeopleSearch Fallback Scraper
 */
async function truePeopleSearchLookup(ownerName, city, state) {
    try {
        if (!ownerName) {
            skipTraceLogger.warn('[TruePeopleSearch] Owner name missing, aborting scraper.');
            return null;
        }

        const nameParam = encodeURIComponent(ownerName);
        const locParam = encodeURIComponent(`${city || ''} ${state || ''}`.trim());
        const url = `https://www.truepeoplesearch.com/results?name=${nameParam}&citystatezip=${locParam}`;

        skipTraceLogger.info(`[TruePeopleSearch] Scraping: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        if (!response.ok) {
            skipTraceLogger.error('[TruePeopleSearch] HTTP Error', { status: response.status });
            return null;
        }

        const html = await response.text();

        // Exact phone matching ex: (555) 123-4567
        const phoneRegex = /\(\d{3}\)\s?\d{3}-\d{4}/g;
        // Basic email scraping
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

        const phonesMatch = html.match(phoneRegex) || [];
        const emailsMatch = html.match(emailRegex) || [];

        // Deduplicate
        const uniquePhones = [...new Set(phonesMatch)];
        // Filter out TruePeopleSearch's own links/emails
        const uniqueEmails = [...new Set(emailsMatch)].filter(e => !e.toLowerCase().includes('truepeoplesearch'));

        if (uniquePhones.length === 0 && uniqueEmails.length === 0) {
            return null;
        }

        skipTraceLogger.info(`[TruePeopleSearch] Match successful! Found ${uniquePhones.length} phones, ${uniqueEmails.length} emails.`);

        return {
            phones: uniquePhones.map(p => ({ number: p, confidence: 60 })),
            emails: uniqueEmails.map(e => ({ email: e, confidence: 60 })),
            provider: 'truepeoplesearch'
        };
    } catch (err) {
        skipTraceLogger.error('[TruePeopleSearch] Exception', { error: err.message });
        return null;
    }
}

/**
 * Normalizes results by calculating average precision/confidence
 */
function normalizeContactData(results) {
    if (!results) return { phones: [], emails: [], provider: null, confidenceAverage: 0 };

    let totalConfidence = 0;
    let count = 0;

    results.phones.forEach(p => { totalConfidence += p.confidence; count++; });
    results.emails.forEach(e => { totalConfidence += e.confidence; count++; });

    const confidenceAverage = count > 0 ? Math.round(totalConfidence / count) : 0;

    return {
        phones: results.phones,
        emails: results.emails,
        provider: results.provider,
        confidenceAverage
    };
}

/**
 * Primary Orchestrator logic
 */
async function runSkipTrace(property) {
    const { ownerName, address, city, state } = property;

    skipTraceLogger.info(`Starting skip trace orchestration for ${ownerName || 'Unknown Owner'} at ${address || 'Unknown Address'}`);

    // Try Primary Provider: OpenSkip
    let results = await openSkipLookup(ownerName, address, city, state);

    // Fallback: TruePeopleSearch Scraper
    if (!results || (results.phones.length === 0 && results.emails.length === 0)) {
        skipTraceLogger.info(`OpenSkip yielded no results, executing TruePeopleSearch fallback.`);
        results = await truePeopleSearchLookup(ownerName, city, state);
    }

    if (!results || (results.phones.length === 0 && results.emails.length === 0)) {
        return {
            phones: [],
            emails: [],
            message: "No contacts found"
        };
    }

    return normalizeContactData(results);
}

module.exports = {
    runSkipTrace,
    openSkipLookup,
    truePeopleSearchLookup,
    normalizeContactData
};
