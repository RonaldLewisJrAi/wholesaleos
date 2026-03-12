import { runForeclosureScanCycle } from './agentController';

/**
 * Initializes the automated scheduling wrapper for the Deal Radar Agent.
 * Simulates a cron job ticking daily.
 */
export function scheduleRadarAgent() {
    console.log('[Scheduler] Initializing Deal Radar Intelligence Scanners.');

    // In a production Node environment, this would use node-cron or APScheduler
    // Since this runs in the React/Vite layer currently or a basic worker, 
    // we set it up to run immediately for testing purposes, then wait 24h.

    setTimeout(async () => {
        try {
            await runForeclosureScanCycle();
        } catch (e) {
            console.error("[Scheduler] Cycle failed:", e);
        }
    }, 5000); // 5 seconds after boot

    // 24-hour interval
    setInterval(async () => {
        try {
            await runForeclosureScanCycle();
        } catch (e) {
            console.error("[Scheduler] Cycle failed:", e);
        }
    }, 24 * 60 * 60 * 1000);
}
