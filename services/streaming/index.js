const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const streamingRoutes = require('./routes');
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
    service: 'streaming-service',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/streaming', streamingRoutes);

// Error handling
app.use((err, req, res, next) => {
  logger.error('Streaming Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Lambda handler
module.exports.handler = serverless(app);

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.STREAMING_SERVICE_PORT || 3004;
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`📺 Streaming Service running on port ${PORT}`);
  });
}