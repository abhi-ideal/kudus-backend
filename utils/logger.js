
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [GATEWAY] ${level}: ${message}`;
        })
      )
    })
  ]
});

if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/gateway-error.log',
    level: 'error'
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/gateway-combined.log'
  }));
}

module.exports = logger;
