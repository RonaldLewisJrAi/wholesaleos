require('dotenv').config();
const { Worker, Queue } = require('bullmq');
const Redis = require('ioredis');
const { exec } = require('child_process');

// Redis Connection configured for a managed cloud instance (e.g. Upstash) or local Docker.
const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
});

const AI_SCRAPER_QUEUE_NAME = 'ai-scraper-jobs';

console.log(`[Worker] Initializing BullMQ Worker on Queue: ${AI_SCRAPER_QUEUE_NAME}`);

// Define the Queue (useful for debugging or injecting test jobs manually)
const scraperQueue = new Queue(AI_SCRAPER_QUEUE_NAME, { connection });

// Initialize the Worker Process
const worker = new Worker(AI_SCRAPER_QUEUE_NAME, async job => {
    console.log(`\n[Worker] 🚀 Received Job ${job.id}: Processing ${job.name}`);
    const { county, state, targetDate, orgId } = job.data;

    if (job.name === 'rutherford-preforeclosure') {
        return new Promise((resolve, reject) => {
            console.log(`[Worker] Executing Python Scraper for ${county}, ${state} (Target: ${targetDate})...`);

            // Execute the heavily-fortified Playwright python script
            const pythonProcess = exec(`python rutherford_scraper.py "${county}" "${targetDate}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`[Worker ERROR ${job.id}] Scraper execution failed: ${error.message}`);
                    return reject(new Error('Python Web Scraper failed. Check logs.'));
                }

                if (stderr) {
                    console.warn(`[Worker WARNING ${job.id}] Python STDERR: ${stderr}`);
                }

                console.log(`[Worker] 🤖 Python Output Captured:`);
                console.log(stdout);

                // TODO: In Phase 17b, parse stdout JSON and push it directly into the Supabase 'leads' table linked to 'orgId'.
                console.log(`[Worker] ✅ Job ${job.id} completed. Data is ready for Supabase injection.`);
                resolve(stdout);
            });
        });
    }

    throw new Error(`Unknown job name: ${job.name}`);
}, {
    connection,
    concurrency: 2, // Process max 2 scrapers concurrently to prevent CPU thrashing
    limiter: {
        max: 5,        // 5 jobs
        duration: 1000 // per second (Rate Limiting to appease Target websites)
    }
});

// Worker Global Event Listeners
worker.on('completed', job => {
    console.log(`[Worker] 🎉 Job ${job.id} successfully completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`[Worker] ❌ Job ${job.id} has failed with error: ${err.message}`);
});

process.on('SIGINT', async () => {
    console.log('Shutting down BullMQ Worker gracefully...');
    await worker.close();
    process.exit(0);
});
