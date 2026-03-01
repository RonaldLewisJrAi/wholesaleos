import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.join(__dirname, '../all_migrations.sql');

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain');
    if (fs.existsSync(sqlFilePath)) {
        res.end(fs.readFileSync(sqlFilePath, 'utf8'));
    } else {
        res.end("SQL FILE NOT FOUND");
    }
});

server.listen(3099, () => {
    console.log("SQL serving on http://localhost:3099");
});
