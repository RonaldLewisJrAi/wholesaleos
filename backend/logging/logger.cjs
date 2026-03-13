const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure the logs directory exists at the root of the project
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// 1. Log Format Configuration
// Define the structured JSON and console-friendly formats
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, metadata }) => {
        let msg = `[${timestamp}] ${level}: ${message}`;
        if (metadata && Object.keys(metadata).length && !metadata.stack) {
            msg += ` | ${JSON.stringify(metadata)}`;
        }
        if (metadata?.stack) {
            msg += `\n${metadata.stack}`;
        }
        return msg;
    })
);

// Determine valid log level
const defaultLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
const envLevel = process.env.LOG_LEVEL?.toLowerCase();
const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
const level = validLevels.includes(envLevel) ? envLevel : defaultLevel;


// 2. Transport Configuration
// Shared rotation rules: Max 10MB per file, max 10 files retained (total 100MB per category)
const createRotateTransport = (filename, levelOverride = null) => {
    return new DailyRotateFile({
        dirname: logDir,
        filename: `${filename}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '10m',
        maxFiles: '10d',
        level: levelOverride || level
    });
};

// 3. Logger Instances
const transports = [
    createRotateTransport('app'), // General application stream
    new winston.transports.Console({
        format: consoleFormat,
        level: level
    })
];

const logger = winston.createLogger({
    level: level,
    format: logFormat,
    defaultMeta: { service: 'wholesale-os' },
    transports: transports
});

// Dedicated Sub-loggers for specific scopes
const workerLogger = logger.child({ service: 'worker-engine' });
// Add a dedicated file transport for workers
workerLogger.add(createRotateTransport('worker'));

const radarLogger = logger.child({ service: 'deal-radar' });
radarLogger.add(createRotateTransport('radar'));

const skipTraceLogger = logger.child({ service: 'skip-trace' });
skipTraceLogger.add(createRotateTransport('skiptrace'));

const aiLogger = logger.child({ service: 'ai-engine' });
aiLogger.add(createRotateTransport('ai'));

module.exports = {
    logger,
    workerLogger,
    radarLogger,
    skipTraceLogger,
    aiLogger
};
