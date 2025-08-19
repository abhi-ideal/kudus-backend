
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
require('dotenv').config();

const userRoutes = require('./routes');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'user-service',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/users', userRoutes);

// Error handling
app.use((err, req, res, next) => {
  logger.error('User Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Lambda handler
module.exports.handler = serverless(app);

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.USER_SERVICE_PORT || 3002;
  sequelize.authenticate()
    .then(() => {
      logger.info('User Service: Database connected successfully');
      app.listen(PORT, '0.0.0.0', () => {
        logger.info(`👤 User Service running on port ${PORT}`);
      });
    })
    .catch(err => {
      logger.error('User Service: Unable to connect to database:', err);
    });
}
