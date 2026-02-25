/* eslint-disable */
const https = require('https');

// We will fetch search results from duckduckgo html version to bypass Zillow perimeterX
https.get('https://html.duckduckgo.com/html/?q=site:photos.zillowstatic.com+nashville+house+exterior', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("DuckDuckGo HTML size:", data.length);
        const zillowUrls = data.match(/https:\/\/(?:www\.)?photos\.zillowstatic\.com\/fp\/[a-zA-Z0-9_-]+\.webp/g);
        if (zillowUrls && zillowUrls.length > 0) {
            console.log("Found Zillow URLs:", [...new Set(zillowUrls)].slice(0, 10));
        } else {
            console.log("None found in direct strict match. Broadening search...");
            const broadMatch = data.match(/photos\.zillowstatic\.com[a-zA-Z0-9_/\-\.]+/g);
            if (broadMatch) {
                console.log("Broad matches:", [...new Set(broadMatch)].slice(0, 10));
            } else {
                console.log("Still no matches.");
            }
        }
    });
}).on('error', err => console.error(err));
