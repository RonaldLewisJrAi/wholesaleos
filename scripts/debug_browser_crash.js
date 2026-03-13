import puppeteer from 'puppeteer';

(async () => {
    console.log('Starting headless browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Explicitly pipe all browser console errors to the Node terminal
    page.on('console', async (msg) => {
        if (msg.type() === 'error') {
            const msgArgs = msg.args();
            for (let i = 0; i < msgArgs.length; ++i) {
                try {
                    console.log(`[BROWSER ERROR] ${await msgArgs[i].jsonValue()}`);
                } catch (e) {
                    console.log(`[BROWSER ERROR] ${msg.text()}`);
                }
            }
        }
    });

    page.on('pageerror', error => console.error(`[PAGE ERROR CRASH]: \n${error.message}`));

    page.on('requestfailed', request => {
        console.error(`[NETWORK FAIL] ${request.url()} - ${request.failure()?.errorText || 'Unknown'}`);
    });

    console.log('Navigating to http://localhost:5173/ ...');
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
        console.log('Page loaded properly.');
    } catch (e) {
        console.error(`[NAVIGATION FAILED] ${e.message}`);
    }

    // Wait for React to mount and potentially crash
    await new Promise(r => setTimeout(r, 6000));

    // Check if the root div is empty
    try {
        const rootHtml = await page.$eval('#root', el => el.innerHTML);
        console.log(`[ROOT LENGTH] ${rootHtml.length}`);
        if (rootHtml.length < 50) {
            console.log(`[ROOT HTML] ${rootHtml}`);
        }
    } catch (e) {
        console.log(`[ROOT CHECK FAILED] Could not find #root. Is the HTML malformed?`, e.message);
    }

    await browser.close();
    console.log('Browser closed.');
})();
