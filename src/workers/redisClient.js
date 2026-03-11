import { Redis } from 'ioredis';

// eslint-disable-next-line no-undef
const getEnv = (key) => typeof process !== 'undefined' ? process.env[key] : undefined;
const REDIS_URL = import.meta?.env?.VITE_REDIS_URL || getEnv('REDIS_URL') || 'redis://localhost:6379';

// Reusable Redis connection for BullMQ
export const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
    console.error('[REDIS CLIENT] Connection Error:', err);
});

export default connection;
