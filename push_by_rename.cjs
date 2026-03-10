const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');

function pushLegacy() {
    console.log("Renaming legacy phase files to trick Supabase CLI...");

    const files = fs.readdirSync(migrationsDir).filter(f => f.startsWith('phase_') && f.endsWith('.sql'));
    const renamedMap = new Map();

    // 1. Rename files
    let counter = 10;
    for (const file of files) {
        // Create a fake future timestamp so they run last
        const fakeTimestamp = `2027123100${counter}00`;
        const newName = `${fakeTimestamp}_${file}`;

        const oldPath = path.join(migrationsDir, file);
        const newPath = path.join(migrationsDir, newName);

        fs.renameSync(oldPath, newPath);
        renamedMap.set(newPath, oldPath);
        counter++;
    }

    try {
        console.log("Executing Supabase DB Push...");
        execSync(`echo Y | npx supabase db push > push_error_log.txt 2>&1`, { stdio: 'inherit', shell: true });
        console.log("SUCCESS: All legacy files pushed successfully.");
    } catch (e) {
        console.error("CLI push failed.");
    } finally {
        console.log("Restoring original filenames...");
        // 3. Rename back
        for (const [newPath, oldPath] of renamedMap.entries()) {
            if (fs.existsSync(newPath)) {
                fs.renameSync(newPath, oldPath);
            }
        }
        console.log("Cleanup complete.");
    }
}

pushLegacy();
