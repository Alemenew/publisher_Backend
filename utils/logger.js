// /logger/logger.js

import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf, errors } = format;

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

// Create logger instance
const logger = createLogger({
  level: 'info',  // Default log level
  format: combine(
    timestamp(),
    errors({ stack: true }),  // Capture stack trace for errors
    logFormat
  ),
  transports: [
    new transports.Console(),  // Log to the console
    new transports.File({ filename: 'logs/error.log', level: 'error' }),  // Log errors to file
    new transports.File({ filename: 'logs/combined.log' })  // Log all messages to file
  ]
});

export default logger;

