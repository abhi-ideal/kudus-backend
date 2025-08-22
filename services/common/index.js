const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
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

// Export app for testing
module.exports = app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.COMMON_SERVICE_PORT || 3007;
  sequelize.authenticate()
    .then(() => {
      console.log('Common Service: Database connected successfully');
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🔧 Common Service running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Common Service: Unable to connect to database:', err);
      // Still start the service even if database connection fails
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🔧 Common Service running on port ${PORT} (without database)`);
      });
    });
}