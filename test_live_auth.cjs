const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log("Starting Playwright to capture AUTHENTICATED LIVE VERCEL server...");
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
        console.error(`[BROWSER ERROR] ${error.message}`);
    });

    try {
        await page.goto('https://frozen-halo.vercel.app/');
        console.log("Waiting for login page...");

        // Fill out login form (using generic test credentials if applicable, or waiting for manual intervention if not headless. We'll use headless and try to trigger the crash if it's a layout issue, or if we need a real user, we might need a test account).
        // Since we don't know a test account password offhand, let's see if there is a way to trace the error by just looking at the source code of the authenticated components.
        // Actually, I can use the same bypass technique locally, but on the built preview server to see if it still happens.
        // Or, since it's the live site, let's just scrape the login page and see if there are any immediate chunk loading errors.
        await page.waitForTimeout(5000);

        const html = await page.content();
        fs.writeFileSync('live_auth_dom_output.html', html);
        await page.screenshot({ path: 'live_auth_screenshot.png' });
        console.log("Wrote DOM to live_auth_dom_output.html");

    } catch (err) {
        console.error("Navigation failed:", err);
    } finally {
        await browser.close();
    }
})();
