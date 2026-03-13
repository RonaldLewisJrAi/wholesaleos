const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log("Starting Playwright to capture PREVIEW error...");
    const browser = await chromium.launch({ headless: false }); // User can see this flash
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            fs.appendFileSync('auth_crash.log', `[CONSOLE ERROR] ${msg.text()}\n`);
            console.log(`[BROWSER ERROR SEEN] ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        fs.appendFileSync('auth_crash.log', `[UNCAUGHT EXCEPTION] ${error.message}\n${error.stack}\n`);
        console.error(`[PAGE EXCEPTION SEEN] ${error.message}`);
    });

    try {
        console.log("Navigating to local preview server...");
        // Re-enable mock auth bypass via environment variable or just accept that the user needs to log in manually?
        // Let's actually just read the source code of `Pipeline.jsx` since we know that's where the crash occurs post-login.
        await page.goto('http://localhost:4174/');
        console.log("Please log in manually if needed, script will wait 30 seconds for a crash to be logged...");
        await page.waitForTimeout(30000);

    } catch (err) {
        console.error("Navigation failed:", err);
    } finally {
        await browser.close();
    }
})();
