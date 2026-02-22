const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Scraper Integration Endpoint
app.post('/api/foreclosures', (req, res) => {
    try {
        const { county, state } = req.body;

        // Using provided credentials for the data pipeline
        const email = "mrronaldlewisjr@gmail.com";
        const password = "Thelya1981!";

        console.log(`Initialzing scrape for ${county}, ${state}...`);

        // Spawn a Python child process to run the scraper script
        const pythonProcess = spawn('python', ['scraper.py', county, state, email, password]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Scraper process exited with code ${code}: ${errorString}`);
                return res.status(500).json({ error: 'Scraping process failed', details: errorString });
            }

            try {
                // Parse the final JSON output from the Python script
                // We split by newline and take the last line assuming the Python script might have print() statements before the final JSON
                const lines = dataString.trim().split('\n');
                const jsonOutput = JSON.parse(lines[lines.length - 1]);
                res.json(jsonOutput);
            } catch (parseError) {
                console.error('Failed to parse scraper output:', dataString);
                res.status(500).json({ error: 'Invalid scraper output', details: parseError.message });
            }
        });

    } catch (error) {
        console.error('Initial scraping request failed:', error);
        res.status(500).json({ error: 'Failed to initiate scrape', details: error.message });
    }
});

// Assessor Extraction Endpoint
app.post('/api/assessor', (req, res) => {
    try {
        const { address } = req.body;

        const email = "mrronaldlewisjr@gmail.com";
        const password = "Thelya1981!";

        console.log(`Initialzing Assessor extraction for ${address}...`);

        const pythonProcess = spawn('python', ['property_scraper.py', address, email, password]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Scraper process exited with code ${code}: ${errorString}`);
                return res.status(500).json({ error: 'Scraping process failed', details: errorString });
            }

            try {
                const lines = dataString.trim().split('\n');
                const jsonOutput = JSON.parse(lines[lines.length - 1]);
                res.json(jsonOutput);
            } catch (parseError) {
                console.error('Failed to parse scraper output:', dataString);
                res.status(500).json({ error: 'Invalid scraper output', details: parseError.message });
            }
        });

    } catch (error) {
        console.error('Initial scraping request failed:', error);
        res.status(500).json({ error: 'Failed to initiate scrape', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Real Estate Proxy Backend running on port ${PORT}`);
});
