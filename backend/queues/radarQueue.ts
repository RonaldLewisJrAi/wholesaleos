import { Queue } from "bullmq";
import dotenv from "dotenv";
dotenv.config();

export const radarQueue = new Queue("radar-ingestion", {
    connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD
    }
});
