import { runForeclosureScanCycle } from './agentController';

/**
 * Initializes the automated scheduling wrapper for the Deal Radar Agent.
 * Simulates a cron job ticking daily.
 */
export function scheduleRadarAgent() {
    console.log('[Scheduler] Initializing Deal Radar Intelligence Scanners.');

    // Remote proxy log to Winston Deal Radar stream
    fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            channel: 'radar',
            level: 'info',
            message: 'Initializing Deal Radar Intelligence Scanners'
        })
    }).catch(() => { });

    // In a production Node environment, this would use node-cron or APScheduler
    // Since this runs in the React/Vite layer currently or a basic worker, 
    // we set it up to run immediately for testing purposes, then wait 24h.

    setTimeout(async () => {
        try {
            await runForeclosureScanCycle();
        } catch (e: any) {
            console.error("[Scheduler] Cycle failed:", e);
            fetch('/api/telemetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel: 'radar', level: 'error', message: 'Cycle failed', metadata: { error: e.message } })
            }).catch(() => { });
        }
    }, 5000); // 5 seconds after boot

    // 24-hour interval
    setInterval(async () => {
        try {
            await runForeclosureScanCycle();
        } catch (e: any) {
            console.error("[Scheduler] Cycle failed:", e);
            fetch('/api/telemetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel: 'radar', level: 'error', message: 'Interval cycle failed', metadata: { error: e.message } })
            }).catch(() => { });
        }
    }, 60 * 60 * 1000); // 1 hour interval
}
