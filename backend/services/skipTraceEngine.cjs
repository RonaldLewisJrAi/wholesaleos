const { skipTraceLogger } = require('../logging/logger.cjs');

// Ensure standard browser user agent to prevent 403s
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
};

/**
 * Universal Regex Parsers
 */
function parsePhoneNumbers(html) {
    const phoneRegex = /\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/g;
    const matches = html.match(phoneRegex) || [];

    // Clean and strictly format (XXX) XXX-XXXX
    return [...new Set(matches.map(num => {
        const cleaned = ('' + num).replace(/\D/g, '');
        if (cleaned.length !== 10) return null;
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }).filter(Boolean))];
}

function parseEmails(html) {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const matches = html.match(emailRegex) || [];
    return [...new Set(matches.map(e => e.toLowerCase()))];
}

/**
 * OpenSkip API Lookup (Free Tier) - Primary Source
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
            headers: { "X-API-KEY": apiKey }
        });

        if (!response.ok) return null;

        const data = await response.json();
        const phones = (data.phones || []).map(p => ({ number: p, confidence: 80 }));
        const emails = (data.emails || []).map(e => ({ email: e, confidence: 80 }));

        if (phones.length === 0 && emails.length === 0) return null;

        return { phones, emails, provider: 'openskip' };
    } catch (err) {
        skipTraceLogger.error('[OpenSkip] Exception', { error: err.message });
        return null;
    }
}

/**
 * Fallback Scraper: TruePeopleSearch
 */
async function truePeopleSearchLookup(ownerName, city, state) {
    try {
        const url = `https://www.truepeoplesearch.com/results?name=${encodeURIComponent(ownerName)}&citystatezip=${encodeURIComponent(city + ' ' + state)}`;
        skipTraceLogger.info(`[TruePeopleSearch] Scraping: ${url}`);

        const response = await fetch(url, { headers: BROWSER_HEADERS });
        if (!response.ok) return null;

        const html = await response.text();
        const uniquePhones = parsePhoneNumbers(html);
        const uniqueEmails = parseEmails(html).filter(e => !e.includes('truepeoplesearch'));

        if (uniquePhones.length === 0 && uniqueEmails.length === 0) return null;

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
 * Fallback Scraper: ZabaSearch
 */
async function zabaSearchLookup(ownerName, city, state) {
    try {
        const nameParts = ownerName.trim().split(' ');
        const first = nameParts[0] || '';
        const last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const url = `https://www.zabasearch.com/people/${encodeURIComponent(first)}+${encodeURIComponent(last)}/${encodeURIComponent(city)}/${encodeURIComponent(state)}/`;

        skipTraceLogger.info(`[ZabaSearch] Scraping: ${url}`);

        const response = await fetch(url, { headers: BROWSER_HEADERS });
        if (!response.ok) return null;

        const html = await response.text();
        const uniquePhones = parsePhoneNumbers(html);
        const uniqueEmails = parseEmails(html).filter(e => !e.includes('zabasearch'));

        if (uniquePhones.length === 0 && uniqueEmails.length === 0) return null;

        return {
            phones: uniquePhones.map(p => ({ number: p, confidence: 60 })),
            emails: uniqueEmails.map(e => ({ email: e, confidence: 60 })),
            provider: 'zabasearch'
        };
    } catch (err) {
        skipTraceLogger.error('[ZabaSearch] Exception', { error: err.message });
        return null;
    }
}

/**
 * Fallback Scraper: ThatsThem
 */
async function thatsThemLookup(ownerName, city, state) {
    try {
        // format: https://thatsthem.com/name/John-Doe/Nashville-TN
        const formattedName = ownerName.replace(/\s+/g, '-');
        const formattedLoc = `${city.replace(/\s+/g, '-')}-${state}`;
        const url = `https://thatsthem.com/name/${formattedName}/${formattedLoc}`;

        skipTraceLogger.info(`[ThatsThem] Scraping: ${url}`);

        const response = await fetch(url, { headers: BROWSER_HEADERS });
        if (!response.ok) return null;

        const html = await response.text();
        const uniquePhones = parsePhoneNumbers(html);
        const uniqueEmails = parseEmails(html).filter(e => !e.includes('thatsthem'));

        if (uniquePhones.length === 0 && uniqueEmails.length === 0) return null;

        return {
            phones: uniquePhones.map(p => ({ number: p, confidence: 60 })),
            emails: uniqueEmails.map(e => ({ email: e, confidence: 60 })),
            provider: 'thatsthem'
        };
    } catch (err) {
        skipTraceLogger.error('[ThatsThem] Exception', { error: err.message });
        return null;
    }
}


/**
 * OSINT Web Scraping Orchestrator (Replaces Recon-ng)
 */
async function runReconSearch(ownerName, city, state) {
    if (!ownerName || !city || !state) {
        skipTraceLogger.warn('[OSINT] Missing parameters for recon search.');
        return null;
    }

    skipTraceLogger.info(`[OSINT] Launching OSINT Waterfall for ${ownerName} in ${city}, ${state}`);

    // Source 1: TruePeopleSearch
    let results = await truePeopleSearchLookup(ownerName, city, state);
    if (results) return results;

    // Source 2: ZabaSearch
    skipTraceLogger.info(`[OSINT] TruePeopleSearch failed. Cascading to ZabaSearch.`);
    results = await zabaSearchLookup(ownerName, city, state);
    if (results) return results;

    // Source 3: ThatsThem
    skipTraceLogger.info(`[OSINT] ZabaSearch failed. Cascading to ThatsThem.`);
    results = await thatsThemLookup(ownerName, city, state);
    if (results) return results;

    return null;
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

    // Try Primary Provider: OpenSkip API
    let results = await openSkipLookup(ownerName, address, city, state);

    // Fallback: Custom Node OSINT Engine
    if (!results || (results.phones.length === 0 && results.emails.length === 0)) {
        skipTraceLogger.info(`[SkipTrace] Primary API failed. Launching OSINT Recon Scraper.`);
        results = await runReconSearch(ownerName, city, state);
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
    runReconSearch,
    parsePhoneNumbers,
    parseEmails,
    normalizeContactData
};
