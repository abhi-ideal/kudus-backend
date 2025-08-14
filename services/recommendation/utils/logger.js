
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'recommendation-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [RECOMMENDATION] ${level}: ${message}`;
        })
      )
    })
  ]
});

if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/recommendation-error.log',
    level: 'error'
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/recommendation-combined.log'
  }));
}

module.exports = logger;
