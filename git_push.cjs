const { simpleGit } = require('simple-git');
const path = require('path');

const git = simpleGit(path.resolve(__dirname));

async function pushChanges() {
    try {
        console.log("Checking git status...");
        const status = await git.status();
        console.log(status);

        console.log("Adding all changes...");
        await git.add('./*');

        console.log("Committing Phase 40 and 41...");
        await git.commit('feat(phase-40-41): Implement strict subscription lifecycle triggers and DDG stealth proxy for Zillow imports');

        console.log("Pushing to origin...");
        await git.push('origin', 'main'); // Assuming main branch

        console.log("Push complete!");
    } catch (err) {
        console.error("Git operation failed:", err);
    }
}

pushChanges();
