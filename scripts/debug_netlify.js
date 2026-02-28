const { chromium } = require('playwright');

(async () => {
    console.log("Launching headless browser to check Netlify deployment...");
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const errors = [];
    const logs = [];

    page.on('console', msg => {
        const text = msg.text();
        logs.push(`${msg.type().toUpperCase()}: ${text}`);
        if (msg.type() === 'error') {
            errors.push(text);
            console.error(`[BROWSER ERROR] ${text}`);
        } else {
            console.log(`[BROWSER LOG] ${text}`);
        }
    });

    page.on('pageerror', exception => {
        errors.push(exception.message);
        console.error(`[UNCAUGHT EXCEPTION] ${exception}`);
    });

    page.on('requestfailed', request => {
        const text = request.failure()?.errorText || 'Unknown error';
        console.log(`[NETWORK FAILURE] ${request.url()} - ${text}`);
    });

    try {
        console.log("Navigating to https://dreamy-melomakarona-8a049c.netlify.app/ ...");
        await page.goto('https://dreamy-melomakarona-8a049c.netlify.app/', { waitUntil: 'networkidle', timeout: 15000 });

        console.log("Waiting 3 seconds for React runtime execution...");
        await page.waitForTimeout(3000);

        const content = await page.content();
        if (content.includes('id="root"')) {
            console.log("React root div found.");
            const rootHTML = await page.$eval('#root', el => el.innerHTML);
            console.log(`Root innerHTML length: ${rootHTML.length} characters.`);
            if (rootHTML.length < 50) {
                console.log("WARNING: React root appears empty. The app likely crashed before hydration.");
            }
        } else {
            console.log("CRITICAL: No empty <div id=\"root\"> found in the DOM.");
        }

    } catch (err) {
        console.error("Navigation failed:", err.message);
    } finally {
        await browser.close();
        console.log(`\n\n--- SUMMARY ---`);
        console.log(`Total Errors Captured: ${errors.length}`);
        if (errors.length > 0) {
            console.log("Top Error:");
            console.log(errors[0]);
        }
    }
})();
