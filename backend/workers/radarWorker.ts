import { Worker } from "bullmq";
import { runRadarScan } from "../services/radarEngine.js";
import dotenv from "dotenv";
dotenv.config();

export const radarWorker = new Worker(
    "radar-ingestion",
    async (job) => {
        console.log(`[RadarWorker] Processing radar scan job for state: ${job.data.state}`);
        await runRadarScan(job.data.state);
    },
    {
        connection: {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD
        }
    }
);

radarWorker.on("completed", (job) => {
    console.log(`[RadarWorker] Completed job ${job.id}`);
});

radarWorker.on("failed", (job, err) => {
    console.error(`[RadarWorker] Failed job ${job?.id}: ${err.message}`);
});
