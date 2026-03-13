import puppeteer from 'puppeteer';

(async () => {
    console.log('[Puppeteer] Starting headless browser for Auth-Crash Test...');
    const browser = await puppeteer.launch({
        headless: 'new', // changed to 'new' or false to debug locally if needed
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

    console.log('[Puppeteer] Navigating to http://localhost:5173/login ...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 30000 });

    // Automate Login
    try {
        console.log('[Puppeteer] Injecting credentials into Login form...');
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        await page.type('input[type="email"]', 'ronald_lewis_jr@live.com'); // Admin account

        await page.waitForSelector('input[type="password"]', { timeout: 5000 });
        await page.type('input[type="password"]', '6b41268479d7a59579ba72a6405d7790A!1');

        await page.click('button[type="submit"]'); // Assume standard button
        console.log('[Puppeteer] Submitted login. Waiting 10 seconds for routing and hydration...');
    } catch (e) {
        console.error(`[Puppeteer Login Error] ${e.message}`);
    }

    // Wait for React to authenticate, route to Dashboard, and potentially crash
    await new Promise(r => setTimeout(r, 10000));

    // Check if the root div is empty
    try {
        const rootHtml = await page.$eval('#root', el => el.innerHTML);
        console.log(`[ROOT LENGTH] ${rootHtml.length}`);
        if (rootHtml.length < 50) {
            console.log(`[ROOT HTML DUMP] ${rootHtml}`);
        }
    } catch (e) {
        console.log(`[ROOT CHECK FAILED] Could not find #root. Is the HTML malformed?`, e.message);
    }

    const rootUrl = page.url();
    console.log(`[Puppeteer] Final URL after 10s: ${rootUrl}`);

    await browser.close();
    console.log('[Puppeteer] Browser closed.');
})();
