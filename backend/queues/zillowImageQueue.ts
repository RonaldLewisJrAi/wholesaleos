import { Queue } from "bullmq";
import dotenv from "dotenv";
dotenv.config();

export const zillowImageQueue = new Queue("zillow-image-ingestion", {
    connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD
    }
});
