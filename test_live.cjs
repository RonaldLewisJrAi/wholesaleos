const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log("Starting Playwright to capture LIVE VERCEL server...");
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
        console.log("Waiting 10 seconds for React to mount / crash...");
        await page.waitForTimeout(10000); // Give it time to mount and crash

        const title = await page.title();
        console.log(`[PAGE TITLE] ${title}`);

        const html = await page.content();
        fs.writeFileSync('live_dom_output.html', html);
        await page.screenshot({ path: 'live_screenshot.png' });
        console.log("Wrote DOM to live_dom_output.html and screenshot to live_screenshot.png");

    } catch (err) {
        console.error("Navigation failed:", err);
    } finally {
        await browser.close();
    }
})();
