const { execSync } = require('child_process');
try {
    console.log("Pushing DB Migrations via CLI Management API...");
    execSync(`npx supabase db push`, { stdio: 'inherit', shell: true });
    console.log("SUCCESS!");
} catch (e) {
    console.error("CLI ERROR:", e);
}
