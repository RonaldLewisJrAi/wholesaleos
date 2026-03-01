import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, '../supabase/migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

// Sort files properly (so phase_9 comes before phase_10)
files.sort((a, b) => {
    const getNum = (str) => {
        const match = str.match(/(?:phase_|schema_expansion)(\d+)/i);
        return match ? parseFloat(match[1]) : 0; // if no number, 0 
    };
    const numA = getNum(a) || (a.includes('schema_expansion') ? 1 : 0);
    const numB = getNum(b) || (b.includes('schema_expansion') ? 1 : 0);

    if (numA === numB) return a.localeCompare(b);
    return numA - numB;
});

console.log("Ordered migrations:");
console.log(files);

let compiled = "-- MASTER COMPILED MIGRATIONS FOR WEB UI\n\n";

files.forEach(file => {
    compiled += `\n\n-- ============================\n-- FILE: ${file}\n-- ============================\n`;
    compiled += fs.readFileSync(path.join(migrationsDir, file), 'utf8');
});

fs.writeFileSync(path.join(__dirname, '../all_migrations.sql'), compiled);
console.log("Compiled to all_migrations.sql");
