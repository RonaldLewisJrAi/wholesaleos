const { chromium } = require('playwright');

(async () => {
    console.log("Starting Playwright to capture preview server...");
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
        console.error(`[BROWSER ERROR] ${error.message}`);
    });

    try {
        await page.goto('http://127.0.0.1:4174/');
        console.log("Waiting 5 seconds for React to mount / crash...");
        await page.waitForTimeout(5000); // Give it time to mount and crash

        const title = await page.title();
        console.log(`[PAGE TITLE] ${title}`);

        const fs = require('fs');
        const html = await page.content();
        fs.writeFileSync('debug_dom_output.html', html);
        console.log("Wrote DOM to debug_dom_output.html");

    } catch (err) {
        console.error("Navigation failed:", err);
    } finally {
        await browser.close();
    }
})();
