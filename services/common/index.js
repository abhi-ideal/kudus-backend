const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const commonRoutes = require('./routes');

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
    service: 'common-service',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/common', commonRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Common Service Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Lambda handler
module.exports.handler = serverless(app);

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.COMMON_SERVICE_PORT || 3007;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔧 Common Service running on port ${PORT}`);
  });
}