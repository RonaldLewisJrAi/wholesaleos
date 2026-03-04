const https = require('https');

async function extractRealZillowData(url) {
    let address = 'Unknown Address';
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const homeDetailsIndex = pathParts.findIndex(p => p === 'homedetails');
        if (homeDetailsIndex !== -1 && pathParts.length > homeDetailsIndex + 1) {
            address = pathParts[homeDetailsIndex + 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } else if (url.includes('baths')) {
            address = pathParts[pathParts.length - 1] || 'Unknown';
        }
    } catch (e) { }

    console.log("Extracted Address from URL:", address);

    // DuckDuckGo scrape
    const searchQuery = encodeURIComponent(`site:zillow.com "${address}"`);
    console.log("Searching DDG for:", searchQuery);

    https.get(`https://html.duckduckgo.com/html/?q=${searchQuery}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            // Find Snippets to extract price
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

            console.log("Data extracted from snippets:", { price, beds, baths, sqft });

            // Image search
            const imgQuery = encodeURIComponent(`site:photos.zillowstatic.com ${address}`);
            https.get(`https://html.duckduckgo.com/html/?q=${imgQuery}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            }, (res2) => {
                let imgData = '';
                res2.on('data', chunk => imgData += chunk);
                res2.on('end', () => {
                    const zillowUrls = imgData.match(/(?:https:\/\/)?(?:www\.)?photos\.zillowstatic\.com[a-zA-Z0-9_/\-\.]+\.webp/g) || [];
                    const image = zillowUrls.length > 0 ? (zillowUrls[0].startsWith('http') ? zillowUrls[0] : 'https://' + zillowUrls[0]) : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                    console.log("Found Image:", image);
                });
            });

        });
    }).on('error', err => console.error(err));
}

extractRealZillowData('https://www.zillow.com/homedetails/4922-Charlotte-Ave-Nashville-TN-37209/41123471_zpid/');
