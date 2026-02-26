const { execSync } = require('child_process');

try {
    console.log("Executing Git commands via Node.js execSync...");
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Phase 32: Enterprise Hardening UI & Timers"', { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log("Successfully pushed to Github!");
} catch (error) {
    console.error("Git push failed:", error.message);
}
