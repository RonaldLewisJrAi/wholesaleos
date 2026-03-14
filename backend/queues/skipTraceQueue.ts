import { Queue } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
});

export const skipTraceQueue = new Queue('skipTraceQueue', {
    connection,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for inspection
    },
});
