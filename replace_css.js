import fs from 'fs';
import { globSync } from 'glob';

const files = globSync('src/**/*.css');
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    content = content.replace(/background(-color)?:\s*rgba\(0,\s*0,\s*0,\s*(0\.[1-4])\);/gi, 'background$1: var(--bg-secondary);');
    content = content.replace(/background(-color)?:\s*rgba\(0,\s*0,\s*0,\s*(0\.[5-9])\);/gi, 'background$1: var(--bg-tertiary);');
    content = content.replace(/background(-color)?:\s*(#000|#000000|black);/gi, 'background$1: var(--bg-dark);');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
        modifiedCount++;
    }
});

console.log(`Successfully updated ${modifiedCount} CSS files to use dynamic semantic variables.`);
