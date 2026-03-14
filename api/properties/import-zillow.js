export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Zillow URL required.' });

    if (!url.includes('zillow.com/homedetails')) {
        return res.status(400).json({ error: 'Invalid Zillow URL. Please provide a valid homedetails link.' });
    }

    const processZillowData = (nextData, res) => {
        try {
            const props = nextData.props.pageProps.componentProps.gdpClientCache;
            const propertyKey = Object.keys(props).find(key => key.includes('PropertyState'));

            if (!propertyKey) {
                throw new Error("Could not find PropertyState in NextJS JSON payload.");
            }

            const propertyData = props[propertyKey].property;

            const extracted = {
                address: `${propertyData.address.streetAddress}, ${propertyData.address.city}, ${propertyData.address.state} ${propertyData.address.zipcode}`,
                arv: propertyData.price ? `$${propertyData.price.toLocaleString()}` : 'Pending',
                beds: propertyData.bedrooms || null,
                baths: propertyData.bathrooms || null,
                sqft: propertyData.livingArea || null,
                image: propertyData.hugePhotos?.[0]?.url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                zpid: propertyData.zpid
            };

            console.log(`[Zillow API] Native extraction succeeded for: ${extracted.address}`);
            return res.status(200).json(extracted);

        } catch (error) {
            console.error('[Zillow API] NextJS JSON Parsing failed:', error.message);
            throw new Error("Failed to parse NextJS JSON.");
        }
    };

    try {
        console.log(`[Zillow API] Fetching raw HTML for: ${url}`);

        // Phase 1: High-velocity structural fetch
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });

        const html = await response.text();

        // Detect WAF Captcha interception
        if (html.includes('captcha') || html.includes('px-captcha') || response.status === 403) {
            console.warn('[Zillow API] Raw fetch intercepted by WAF Captcha. Escalating to DDG Proxy...');
            throw new Error("WAF Interception Detected");
        }

        const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (!jsonMatch) {
            throw new Error("Could not locate __NEXT_DATA__ payload in HTTP structure.");
        }

        const nextData = JSON.parse(jsonMatch[1]);
        return processZillowData(nextData, res);

    } catch (error) {
        console.warn('[Zillow API] NATIVE extraction failed. Escalating to DDG Proxy Bypass...', error.message);

        // Phase 2: Serverless Fallback -> DuckDuckGo Snippet Proxy
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

        try {
            const ddgRes = await fetch(`https://html.duckduckgo.com/html/?q=${searchQuery}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                }
            });

            const data = await ddgRes.text();

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
            const imgRes = await fetch(`https://html.duckduckgo.com/html/?q=${imgQuery}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            const imgData = await imgRes.text();

            const zillowUrls = imgData.match(/(?:https:\/\/)?(?:www\.)?photos\.zillowstatic\.com[a-zA-Z0-9_/\-\.]+\.webp/g) || [];
            const image = zillowUrls.length > 0 ? (zillowUrls[0].startsWith('http') ? zillowUrls[0] : 'https://' + zillowUrls[0]) : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';

            console.log(`[Zillow API] Serverless DDG Fallback succeeded for: ${address}`);
            return res.status(200).json({ address, arv: price, beds, baths, sqft, image });

        } catch (ddgError) {
            console.error('[Zillow API] DDG Scrape Error:', ddgError);
            return res.status(500).json({ error: 'Failed to extract real Zillow metrics.' });
        }
    }
}
