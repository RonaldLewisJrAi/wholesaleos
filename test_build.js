import { execSync } from 'child_process';

console.log("Starting local Vite production build test...");
try {
    // Run exactly what Vercel runs
    const output = execSync('npx vite build', { encoding: 'utf-8', stdio: 'pipe' });
    console.log("BUILD SUCCESSFUL! Vercel should have no problem deploying this.");
    console.log(output);
} catch (error) {
    console.log("-----------------------------------------");
    console.log("BUILD CRASHED! THIS IS WHY VERCEL FAILED:");
    console.log("-----------------------------------------");
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.log(error.stderr);
}
