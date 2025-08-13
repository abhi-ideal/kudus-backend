
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
require('dotenv').config();

const recommendationRoutes = require('./routes');
const logger = require('../../shared/utils/logger');

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
    service: 'recommendation-service',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/recommendations', recommendationRoutes);

// Error handling
app.use((err, req, res, next) => {
  logger.error('Recommendation Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Lambda handler
module.exports.handler = serverless(app);

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.RECOMMENDATION_SERVICE_PORT || 3005;
  sequelize.authenticate()
    .then(() => {
      logger.info('Recommendation Service: Database connected successfully');
      app.listen(PORT, '0.0.0.0', () => {
        logger.info(`🎯 Recommendation Service running on port ${PORT}`);
      });
    })
    .catch(err => {
      logger.error('Recommendation Service: Unable to connect to database:', err);
    });
}
