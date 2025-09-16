import pino from 'pino';
import fs from 'fs';

const logStream = fs.createWriteStream('app.log', { flags: 'a' });
export const logger = pino({ level: process.env.LOG_LEVEL || 'info' }, logStream);