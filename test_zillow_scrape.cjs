const { chromium } = require('playwright');

async function testZillow() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // An example Zillow URL
    const targetUrl = 'https://www.zillow.com/homedetails/4922-Charlotte-Ave-Nashville-TN-37209/41123471_zpid/';

    try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const title = await page.title();
        console.log("Title:", title);

        const titleParts = title.split('|');
        const address = titleParts[0] ? titleParts[0].trim() : 'Unknown Address';

        let image = '';
        try {
            image = await page.locator('meta[property="og:image"]').getAttribute('content');
        } catch (e) { }

        let zestimate = 'Pending';
        try {
            // Look for Zestimate in the DOM. Usually it's in a span near "Zestimate"
            const z = await page.evaluate(() => {
                const el = document.querySelector('span:contains("Zestimate")');
                return el ? el.innerText : null; // simplified
            });
            if (z) zestimate = z;
        } catch (e) { }

        console.log({ address, image, zestimate });
    } catch (err) {
        console.error("Failed to load or scrape:", err.message);
    } finally {
        await browser.close();
    }
}
testZillow();
