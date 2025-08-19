
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sequelize = require('./config/database');
require('dotenv').config();

const contentRoutes = require('./routes');
const logger = require('./utils/logger');

const app = express();

// Configure multer for memory storage (Lambda compatible)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'content-service',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/content', contentRoutes);

// Error handling
app.use((err, req, res, next) => {
  logger.error('Content Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Lambda handler
module.exports.handler = serverless(app);

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.CONTENT_SERVICE_PORT || 3003;
  sequelize.authenticate()
    .then(() => {
      logger.info('Content Service: Database connected successfully');
      app.listen(PORT, '0.0.0.0', () => {
        logger.info(`🎬 Content Service running on port ${PORT}`);
      });
    })
    .catch(err => {
      logger.error('Content Service: Unable to connect to database:', err);
    });
}
